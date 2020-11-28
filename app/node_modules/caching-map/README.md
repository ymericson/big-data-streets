# LRU cache for people who like ES6 and promises

This is an in-memory cache for JavaScript objects.  The API is similar to the
ES6 `Map` class, which is also an in-memory cache for JavaScript objects, but
you get a few additional features:

* You can set the cache limit to 0 or Infinity, effectively enable/disable
  caching (e.g. running code in development and production)
* You can set the cache limit to any value between 0 and Infinity, deciding how
  much you want to hold in memory
* You can set the cost for each individual key, for smarter memory usage
* You can set expiration for each individual key, afterwhich the key is no
  longer available, making room for new keys
* Expired keys are evicted first to make room for new keys, followed by least
  recently used keys
* You can iterate over all keys from most to least recently used
* The materialize callback is easy  for caching asynchronous resources (database
  connections, HTTP resources, etc) while avoiding * Materialize function to
  avoid thundering herds


## Example

```js
const Cache = require('caching-map');

// Cache 10 most recently used documents
const documents = new Cache(10);

// If key is missing, load document from file system
documents.materialize = function(filename) {
  return promisify(fs.readFile)(filename);
}


// filename -> promise(Buffer)
//
// Returns promise that resolves to the content of this file
// File becomes the most recently used
function loadDocument(filename) {
  return documents.get(filename);
}


// -> [ filename ]
//
// Returns up to ten filenames of the most recently loaded documents
function listDocuments() {
  const filenames = [ ...documents.keys() ];
  return filenames;
}
```


### Limit and Cost

When creating a new cache, the first constructor argument is the cache limit.

The second argument can be another cache, a `Map`, or any iterator that returns
name/value pairs.  You can easily create a new cache from a map (`new Cache(limit,
map)`), or turn a cache into a map (`new Map(cache)`).

If you set the cache limit to zero (or negative number), it will hold zero keys.
This could be useful when you want to use the same object in different
configurations, e.g. cache in production but always live load in development.

If you set the cache limit to infinity, it will hold as many keys as you've got.
This is useful if you want cache features, but don't care about memory usage.
For example, flipping between caching all or nothing, using TTL to expire old
values, or tracking most recently used keys:

```js
// Cache keys in production, always live load in development
// For example, for caching templates
const limit = (NODE.ENV === 'production') ? Infinity : 0;
const cache = new Cache(limit);
```

You can use the `limit` property to change the cache limit at any time.
Changing the limit doesn't evict any keys until the cache needs to make room for
new keys.


### Setting Keys

When you set a key, that key becomes the most recently used.

When you set a key, if the cache runs into its storage limit, it will start
evicting (deleting) keys until it has room to store the new key.  It will first
evict any expired keys, and then evict the least recently used keys.

When setting a key, you can associate a cost for that key.  The default is one,
so the default behavior is to limit the number of keys stored in the cache:

```js
cache.limit = 2;
cache
  .set('x', 'XXX')
  .set('y', 'YYY')
  .set('z', 'ZZZ');
cache.size
=> 2
[ ...cache.keys() ]
=> [ 'z', 'y' ]
```

However, if you are able to calculate a more accurate cost for each of the keys
(e.g. the size of a string), you can use that for better memory usage:

```js
const x = 'X';
const y = 'YYYY';

cache.set('x', x, { cost: Buffer.byteLength(x) });
[ cache.size, cache.cost ]
=> [ 1, 1 ]

cache.set('y', y, { cost: Buffer.byteLength(y) });
[ cache.size, cache.cost ]
=> [ 2, 5 ]
```

When setting a key, you can associate the time to live (in milliseconds).  Once
that time has passed, the key is expired.  Expired keys are removed first to
make room for new keys.  There is no way to retrieve the value of an expired
key:

```js
const ttl = ms('1h');

cache.set('key', 'good for an hour', { ttl });
cache.get('key');
=> 'good for an hour'

setTimeout(function() {
  cache.get('key');
}, ttl);
=> undefined
```

If a key expires immediately (TTL is zero or negative), or if the key cost is
larger than the limit, then that key is not stored, and no other key is evicted.


### Get

When you retrieve a key (`get(key)`), that key becomes the most recently used
key.  It will be the last key removed to make room for new keys, and the first
key returned when iterating through the keys.

In contrast, checking whether a key exists (`has(key)`), or iterating over keys,
does not change their order.  Only getting or setting a key changes it to most
recent.


### Iterate

The default iterator, `entries()`, `keys()` and `values()` are all available, as
well as `forEach`.  Since this is an LRU cache, they all iterate on entries
based on their caching order: from most to least recently used.

You can use iteration for operations like deleting keys based on a pattern,
listing all keys, and so forth:

```js
function deleteKeysInNamespace(cache, namespace) {
  const prefix = `${namespace}:`;
  for (let key of cache)
    if (key.startsWith(prefix))
      cache.delete(key);
}

function listAllKeys(cache) {
  return [ ...cache.keys() ];
}
```

Just watch out, iteration is O(N), and will be expensive for caches with many
keys.


### Lazy Expiration

Expired keys are lazily evicted from the cache, either to make room for new
keys, or when attempting to retrieve, check existence or iterate over the
expired key.

If you want to force evict all expired keys, you need to do so yourself, by
iterating over all keys:

```js
function evictExpiredKeys() {
  // Iterating over expired key removes it from the cache
  for (let entry of cache) ;
}

setTimeout(evictExpiredKeys, ms('5m'));
```

Don't forget that whenever you read the `size` or `cost` of the cache, that
value may include expired keys that are still in the cache but no longer
accessible.


### The Materialize Function

A common pattern for caching code is to retrieve a key, and when the key doesn't
exist, resolve and store the value.  This easily leads to the [Thundering herd
problem](https://en.wikipedia.org/wiki/Thundering_herd_problem).

For example, if you have 100 concurrent requests that all need to render the
same data, but the cache is empty, you may end up with 100 database queries
attempting to set a single cache key.

The simplest solution is to cache a promise that resolves to that value.  That
way, everyone is waiting for that one promise to resolve once.  However, if an
error occurs and the promise is rejected, you want to remove it from the cache,
so a new promise can take its place.

The materialize function is a convenient way to implement this pattern.  When a
key has no value, this function is called with the key, and should return the
expected value, or a promise that resolves to that value.  For example:

```js
cache.materialize = function(url) {
  return promisify(request)(url);
};

const URL = 'http://example.com/';

cache.get(URL).then(
  function(result) {
    // We cached a promise that always resolves to this response
    console.log(result.body);

    assert( cache.has(URL) );
  },
  function(error) {
    // The promise is no longer in the cache, we can try again
    assert( !cache.has(URL) );
  });

```

If you want to set the cost and/or expiration for that key, returns a promise,
but also set the key when that promise resolves:

```js
cache.materialize = function(url) {
  const promise = promisify(request)(url);

  promise.then(function(response) {

    const cost = response.body.length;
    cache.set(url, promise, { cost });

  });
  return promise;
};
```


## License

MIT License Copyright (c) 2015 Broadly Inc

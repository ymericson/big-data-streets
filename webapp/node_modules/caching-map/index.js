// LRU cache for people who like ES6 and promises

'use strict';
const Util = require('util');


// Convert any value into a limit: a positive number, zero or Infinity.
function actualLimit(limit) {
    return Number.isFinite(limit) ? Math.max(0, limit) : Infinity;
}

// Convert any value into a cost: a positive number or zero.  If no number
// provided (undefined, NaN, etc) return the default cost of one.
function actualCost(cost) {
    return Number.isFinite(cost) ? Math.max(0, cost) : 1;
}

// Returns true if the entry has expired already
function hasExpired(link) {
    return (link.expires <= Date.now());
}


// 1. We don't want these properties to show up in console.log(cache)
// 2. Private methods could come here, when io.js supports them
const _cost = Symbol('cost');
const _head = Symbol('head');
const _tail = Symbol('tail');
const _limit = Symbol('limit');
const _map = Symbol('map');


class Cache {

    constructor(limit, source) {
        this[_map] = new Map();
        this[_cost] = 0;

        if (limit && limit[Symbol.iterator]) {
            source = limit;
            limit = (source instanceof Cache) ? source.limit : undefined;
        }
        this.limit = limit;
        this.ttl = Infinity;
        this.materialize = null;
        this.generateKey = null;

        if (source instanceof Cache)
            this._cloneCache(source);
        else if (source)
            this._cloneIterator(source);
    }

    _cloneIterator(source) {
        for (let entry of source)
            this._set(entry[0], entry[1]);
    }

    _cloneCache(source) {
        let link = source[_tail];
        while (link) {
            this._set(link.key, link.value, link);
            link = link.previous;
        }
        this.materialize = source.materialize;
        this.generateKey = source.generateKey;
        this.ttl = source.ttl;
    }


    // Remove link from linked list.  Used when deleting, and when moving link
    // to head (during get).
    _removeFromList(link) {
        if (this[_head] === link)
            this[_head] = link.next;
        if (this[_tail] === link)
            this[_tail] = link.previous;

        if (link.next)
            link.next.previous = link.previous;
        if (link.previous)
            link.previous.next = link.next;
    }

    // Prepend to linked list.  Used when adding new link (set) or when moving
    // existing link to beginning of linked list (get).
    _prependToList(link) {
        link.previous = null;
        link.next = this[_head];
        if (this[_head])
            this[_head].previous = link;
        this[_head] = link;
        if (!this[_tail])
            this[_tail] = link;
    }


    get limit() {
        // Getter because we use a setter
        return this[_limit];
    }

    // Sets the cache limit
    set limit(value) {
        // You can use whatever value you want, but we need it to be a positive
        // number, possibly Infinity
        this[_limit] = actualLimit(value);
    }

    // Returns the current cost
    get cost() {
        return this[_cost];
    }

    get size() {
        return this[_map].size;
    }


    clear() {
        this[_map].clear();
        this[_cost] = 0;
        this[_head] = null;
        this[_tail] = null;
    }


    _delete(key) {
        const link = this[_map].get(key);
        if (!link)
            return false;

        this._removeFromList(link);
        this[_map].delete(key);

        // Discount
        this[_cost] = this[_cost] - link.cost;

        return true;
    }

    delete(keyObject) {
        const key = this._generateKey(keyObject);
        return this._delete(key);
    }


    // Evicts as many expired entries an least recently used entries to keep
    // cache under limit.  This can be O(N) as it may iterate over the entire
    // cache twice, but in practice we generally evict as many entries as we add,
    // so viewed over long time horizon, this is an O(1) operation.
    _evict(limit) {
        // Only evicts enough expired keys to make room for new key, if you need to
        // evict all expired keys, use the iterator.
        for (let link of this[_map].values()) {
            if (this[_cost] <= limit)
                break;
            if (hasExpired(link))
                this._delete(link.key);
        }

        // Remove from the tail is potentiall O(N), we in practice we usually evict
        // as many entries as we add, so evict is O(1) spread over time
        while (this.size && this[_cost] > limit) {
            const leastRecent = this[_tail];
            this._delete(leastRecent.key);
        }
    }

    _generateKey(keyObj) {
        return this.generateKey && this.generateKey(keyObj) || keyObj;
    }

    // Returns the key value if set and not evicted yet.
    get(keyObj) {
        const key = this._generateKey(keyObj);
        const link = this[_map].get(key);
        // Although we do have the value, the contract is that we don't return
        // expired values
        if (link && !hasExpired(link)) {
            this._moveLinkToHead(link);
            return link.value;
        } else if (this.materialize)
            return this._materializeAndCache(key, keyObj);
        else
            return undefined;
    }


    _moveLinkToHead(link) {
        // Link becomes most recently used
        const mostRecent = (this[_head] === link);
        if (!mostRecent) {
            // This is not the most CPU efficient, there's some redundant linked list
            // changes that we can consolidate if we implemented a move; but in real
            // life, you won't be able to measure the difference, so we opt to reuse
            // existing methods, this gives us better test coverage
            this._removeFromList(link);
            this._prependToList(link);
        }
    }


    _materializeAndCache(key, objKey) {
        const self = this;
        const promise = Promise.resolve(objKey).then(this.materialize);

        function deleteIfRejected() {
            const entry = self[_map].get(key);
            if (entry && entry.value === promise)
                self._delete(key);
        }

        this._set(key, promise);
        promise.catch(deleteIfRejected);
        return promise;
    }


    // Returns true if key has been set and not evicted yet.
    has(keyObj) {
        const key = this._generateKey(keyObj);
        const link = this[_map].get(key);
        if (!link)
            return false;
        return !hasExpired(link);
    }


    * entries() {
        let link = this[_head];
        while (link) {
            // We take this opportunity to get rid of expired keys
            if (hasExpired(link))
                this._delete(link.key);
            else
                yield [link.key, link.value];
            link = link.next;
        }
    }

    * values() {
        for (let [key, value] of this.entries())
            yield value;
    }

    * keys() {
        for (let [key] of this.entries())
            yield key;
    }

    forEach(callback, thisArg) {
        // This could be `let [key, value] of` in future version
        for (let [key, value] of this.entries())
            callback.call(thisArg, value, key, this);
    }

    // TTL (milliseconds) to expiration (timestamp)
    ttlToExpires(ttl) {
        return Number.isInteger(ttl) ? Date.now() + ttl : Date.now() + this.ttl;
    }

    // Stores the key and value.
    //
    // Each key is associated with a cost.  The cost is a positive number, and
    // the default value is 1.  When the total cost is higher than the cache
    // limit, it will start evicting least recently used values.  You can use a
    // cost of zero to keep the key indefinitely (or until it expires).
    //
    // Each key has a TTL associated with it.  Expired keys are evicted first to
    // make room for new keys.
    //
    // The following two are equivalent:
    //
    //   _set(key, value)
    //   _set(key, value, { cost: 1, ttl: Infinity })
    _set(key, value, options) {
        const cost = actualCost(options && options.cost);
        const expires = this.ttlToExpires(options && options.ttl);

        this._delete(key);

        // If TTL is zero we're never going to return this key, we don't want to
        // evict older keys either
        if (expires <= Date.now())
            return this;

        // If this key can't fit, we don't want to evict other keys to make room
        const canHoldKey = (cost <= this.limit);
        if (!canHoldKey)
            return this;

        // Evict enough keys to make room for this one
        const leaveRoomForKey = (this.limit - cost);
        this._evict(leaveRoomForKey);

        // Double linked list (previous, next) for O(1) reordering of recently used
        // keys.  Every place you see a link, it refes to an object with these
        // properties.
        //
        // We need the key here as well so we can evict least recently used entries
        const link = {
            key,
            value,
            previous: null,
            next: null,
            cost,
            expires,

            inspect(depth, inspectOptions) {
                // console.log(cache) calls inspect(cache) on the Map, which ends up
                // calling inspect on each map value (i.e. this link object).  We want
                // to show the stored value (just like a Map).
                return Util.inspect(value, inspectOptions);
            }
        };

        this._prependToList(link);
        this[_map].set(key, link);
        this[_cost] = this[_cost] + cost;

        // Map allows you to chain calls to set()
        return this;
    }

    set(keyObject, value, options) {
        const key = this._generateKey(keyObject);
        return this._set(key, value, options);
    }

    // Util.inspect(cache) calls this, and Node's console.log uses inspect
    inspect(depth, inspectOptions) {
        return Util.inspect(this[_map], inspectOptions);
    }

}


// Just like Map, the default iterator iterates over all entries (except our order is different)
Cache.prototype[Symbol.iterator] = Cache.prototype.entries;


module.exports = Cache;


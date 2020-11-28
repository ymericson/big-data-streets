'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const LRUCache = require('lru-native');
const crypto = require('crypto');

const debug = require('debug')('node-thrift2-hbase:HBaseFallThroughLRUCache');

function md5(data) {
    if (!data)
        return;
    return crypto.createHash('md5').update(data, 'utf8').digest("hex");
}

class HBaseFallThroughLRUCache {

    constructor(fetch, options) {
        this.cache = new LRUCache(options);
        this.fetch = fetch;
    }

    get(table, getObj, options, callback) {
        const cache = this.cache;
        const cacheKey = md5(JSON.stringify(getObj.row) + JSON.stringify(options));
        const value = cache.get(cacheKey);

        function _callback(err, valueFromHBase) {
            if (err) {
                debug('error fetching data:', err);
                return callback(err);
            }

            cache.set(cacheKey, valueFromHBase);
            callback(null, valueFromHBase);
        }

        if (value) {
            return callback(null, value)
        }
        else {
            this.fetch(table, getObj, _callback);
        }
    }
}

Promise.promisifyAll(HBaseFallThroughLRUCache.prototype);

module.exports = HBaseFallThroughLRUCache;
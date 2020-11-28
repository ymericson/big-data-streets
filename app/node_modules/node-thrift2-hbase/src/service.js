'use strict';

const _ = require('underscore');
const Promise = require('bluebird');

const createClientPool = require('./client-pool');
const Cache = require('./cache');
const serde = require('./serde');

const Get = require('./get');
const Put = require('./put');
const Del = require('./del');
const Inc = require('./inc');
const Scan = require('./scan');
const ScanStream = require('./scan-stream');

const debug = require('debug')('node-thrift2-hbase:service');

const Service = function (options) {
    this.clientPool = createClientPool(options);
    this.hosts = options.hosts;
    this.saltMap = options.saltMap || {};
    let cachedTables = options.cachedTables || [];
    this.cachedTablesSet = new Set(cachedTables);
    this.cache = new Cache(
        _.bind(this.applyGetOnClientAsync, this),
        options.cacheOptions);
};

Service.create = function (options) {
    return new Service(options);
};

Service.prototype.destroy = function (callback) {
    return this.clientPool.drain(callback);
};

Service.prototype.serde = serde;

function noop(k) {
    return k;
}

function saltByLastKeyCharCode(key) {
    const charCode = key.codePointAt(key.length - 1);
    const salt = charCode % 10;
    const salted = salt.toString() + key;
    debug('salting key', key, '=>', salted);
    return salted;
}

Service.prototype.saltFunctions = {
    saltByLastKeyCharCode: saltByLastKeyCharCode
};

Service.prototype.salt = function (table, key) {
    return (this.saltMap[table] || noop)(key);
};

Service.prototype.applyActionOnClient = function (actionName, table, queryObj, callback) {
    debug('applyActionOnClient: applying action', queryObj);
    const hbasePool = this.clientPool;
    this.clientPool.acquire(function (err, hbaseClient) {
        if (err)
            return callback(err);

        function releaseAndCallback(err, data) {
            if (err) {
                //destroy client on error
                hbasePool.destroy(hbaseClient);
                return callback(err);
            }
            //release client in the end of use.
            hbasePool.release(hbaseClient);
            return callback(null, data);
        }

        try {
            hbaseClient[actionName](table, queryObj, releaseAndCallback);
        }catch(err){
            //release client on exception in creating thrift command
            hbasePool.release(hbaseClient);
            callback(err);
        }
    });
};

Service.prototype.applyGetOnClient = function (table, queryObj, callback) {
    this.applyActionOnClient('get', table, queryObj, callback);
}
Service.prototype.Get = Get;
Service.prototype.get = function (table, get, options, callback) {
    if (callback == null) {
        callback = options;
        options = {};
    }

    get.row = this.salt(table, get.row);
    const cache = this.cache;
    debug('getting from table', table);
    debug(get);

    if ((options && options.cacheQuery) || this.cachedTablesSet.has(table)) {
        cache.get(table, get, options, callback)
    } else {
        this.applyActionOnClient('get', table, get, callback);
    }
};
Service.prototype.getRow = function (table, key, columns, options, callback) {
    debug('getting row', key, 'from table', table, 'with columns', columns);
    const getObj = new Get(key, options);

    if (columns && columns.length > 0) {
        _.each(columns, function (ele, idx) {
            if (ele.indexOf(':') != -1) {
                const cols = ele.split(':');
                const family = cols[0];
                const qualifier = cols[1];
                getObj.addColumn(family, qualifier);
            } else {
                getObj.addFamily(ele);
            }
        });
    }

    this.get(table, getObj, options, callback);
};

Service.prototype.Put = Put;
Service.prototype.put = function (table, put, callback) {
    put.row = this.salt(table, put.row);
    this.applyActionOnClient('put', table, put, callback);
};
Service.prototype.putRow = function (table, key, cf, valuesMap, callback) {
    const hbasePool = this.clientPool;
    key = this.salt(table, key);

    this.clientPool.acquire(function (err, hbaseClient) {
        if (err)
            return callback(err);

        const put = hbaseClient.Put(key);
        for (const col in valuesMap) {
            const value = valuesMap[col];
            if (value !== undefined && value !== null)
                put.add(cf, col, value);
        }
        hbaseClient.put(table, put, function releaseAndCallback(err, data) {
            if (err) {
                //destroy client on error
                hbasePool.destroy(hbaseClient);
                return callback(err);
            }
            //release client in the end of use.
            hbasePool.release(hbaseClient);
            return callback(null, data);
        });
    });
};

//cellAmounts = [{cf:f,qualifier:q,amount:1}, ...]
Service.prototype.incRow = function (table, key, cellAmounts, callback) {
    const hbasePool = this.clientPool;
    key = this.salt(table, key);

    this.clientPool.acquire(function (err, hbaseClient) {
        if (err)
            return callback(err);

        const inc = hbaseClient.Inc(key);
        for (const cellIndx in cellAmounts) {
            const incCell = cellAmounts[cellIndx];
            if (incCell.cf && incCell.qualifier)
                inc.add(incCell.cf, incCell.qualifier, incCell.amount);
            else
                return callback(new Error("CellAmount must be in the form of {cf:\"f\",qualifier:\"q\",amount:\"1\""));
        }
        hbaseClient.inc(table, inc, function releaseAndCallback(err, data) {
            if (err) {
                //destroy client on error
                hbasePool.destroy(hbaseClient);
                return callback(err);
            }
            //release client in the end of use.
            hbasePool.release(hbaseClient);
            return callback(null, data);
        });
    });
};

Service.prototype.Scan = Scan;
Service.prototype.scan = function (table, scan, callback) {
    this.applyActionOnClient('scan', table, scan, callback);
};

Service.prototype.Del = Del;
Service.prototype.del = function (table, del, callback) {
    this.applyActionOnClient('del', table, del, callback);
};

Service.prototype.Inc = Inc;
Service.prototype.inc = function (table, inc, callback) {
    inc.row = this.salt(table, inc.row);
    this.applyActionOnClient('inc', table, inc, callback);
};

Promise.promisifyAll(Service.prototype);

Service.prototype.createScanStream = function (table, scan) {
    return new ScanStream(this.clientPool, table, scan);
};

module.exports = Service.create;
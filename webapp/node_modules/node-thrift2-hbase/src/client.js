"use strict";

const _ = require('underscore');
const Int64 = require('node-int64');

const Put = require('./put');
const Del = require('./del');
const Inc = require('./inc');
const thrift = require('thrift');
const HBaseTypes = require('../gen-nodejs/hbase_types');

class Client {
    constructor(options) {

        if (!options.host || !options.port) {
            throw new Error('host or port is none');
        }
        this.host = options.host || 'master';
        this.port = options.port || '9090';

        options.connect_timeout = options.timeout || 0;
        options.max_attempts = options.maxAttempts;
        options.retry_max_delay = options.retryMaxDelay;

        const connection = thrift.createConnection(this.host, this.port, options);
        connection.connection.setKeepAlive(true);
        this.connection = connection;

        this.commandCallbacks = new Set();
    }

    /**
     * @deprecated Use thriftClient instead.
     */
    get client(){
        return this.thriftClient;
    }

    releaseCommandCallbacksOnError(err) {
        for (const callback of this.commandCallbacks) {
            callback(err);
        }
        this.commandCallbacks.clear();
    }

    create(options) {
        return new Client(options);
    }

    Put(row) {
        return new Put(row);
    }

    Del(row) {
        return new Del(row);
    }

    Inc(row) {
        return new Inc(row);
    }

    scan(table, scan, callback) {
        const tScan = new HBaseTypes.TScan(scan);

        this.commandCallbacks.add(callback);

        this.thriftClient.getScannerResults(table, tScan, scan.numRows, (serr, data) => {

            this.commandCallbacks.delete(callback);

            if (serr) {
                callback(serr.message.slice(0, 120));
            } else {
                callback(null, scan.objectsFromData(data));
            }
        });
    }

    get(table, getObj, callback) {
        const tGet = new HBaseTypes.TGet(getObj);

        this.commandCallbacks.add(callback);

        this.thriftClient.get(table, tGet, (err, data) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err.message.slice(0, 120));
            } else {
                callback(null, getObj.objectFromData(data));
            }

        });
    }

    put(table, put, callback) {
        const row = put.row;
        if (!row) {
            callback(null, 'rowKey is null');
        }

        const tPut = put.createThriftObject();

        this.commandCallbacks.add(callback);

        this.thriftClient.put(table, tPut, (err) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }

    putRow(table, row, columns, value, timestamp, callback) {
        const args = arguments;
        const query = {};

        if (args.length <= 0) {
            throw new Error('Expected 5 arguments got 0');
        }

        callback = args[args.length - 1];

        if (callback && typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }

        if (args.length < 5) {
            callback(new Error('arguments arg short of 5'));
            return;
        }

        if (args.length >= 5) {
            if (args[2].indexOf(':') === -1) {
                callback(new Error('family and qualifier must have it,example ["info:name"]'));
                return;
            }
        }

        query.row = row;
        const qcolumns = [];
        if (columns) {
            let cols = [], temp = {};
            cols = columns.split(':');
            temp = {
                family: cols[0],
                qualifier: cols[1],
                value: value
            };
            if (timestamp) {
                temp.timestamp = new Int64(timestamp);
            }
            qcolumns.push(new HBaseTypes.TColumnValue(temp));
            query.columnValues = qcolumns;
        }

        const tPut = new HBaseTypes.TPut(query);

        this.commandCallbacks.add(callback);

        this.thriftClient.put(table, tPut, (err) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }

    del(table, param, callback) {
        const tDelete = new HBaseTypes.TDelete(param);

        this.commandCallbacks.add(callback);

        this.thriftClient.deleteSingle(table, tDelete, (err) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }

    delRow(table, row, columns, timestamp, callback) {
        const args = arguments;
        const query = {};

        if (args.length <= 0) {
            throw new Error('Expected 3 arguments got 0');
        }

        callback = args[args.length - 1];

        if (callback && typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }

        if (args.length < 3) {
            callback(new Error('arguments arg short of 3'));
            return;
        }

        if (args.length === 5) {
            if (args[2].indexOf(':') === -1) {
                callback(new Error('family and qualifier must have it,example ["info:name"]'));
                return;
            }
        }

        query.row = row;
        const qcolumns = [];
        if (args.length >= 4 && columns) {
            let cols = [], temp = {};
            if (columns.indexOf(':') != -1) {
                cols = columns.split(':');
                temp = {
                    family: cols[0],
                    qualifier: cols[1]
                };
                if (args.length === 5) {
                    temp.timestamp = timestamp;
                }
            } else {
                temp = {
                    family: columns
                }
            }

            qcolumns.push(new HBaseTypes.TColumn(temp));
            query.columns = qcolumns;
        }

        const tDelete = new HBaseTypes.TDelete(query);

        this.commandCallbacks.add(callback);

        this.thriftClient.deleteSingle(table, tDelete, (err, data) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }

    inc(table, inc, callback) {
        const row = inc.row;
        if (!row) {
            callback(new Error('rowKey is null'));
        }

        const tIncrement = inc.createThriftObject();

        this.commandCallbacks.add(callback);

        this.thriftClient.increment(table, tIncrement, (err, data) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });

    }

    incRow(table, row, columns, callback) {
        const args = arguments;
        const query = {};

        if (args.length <= 0) {
            throw new Error('Expected 3 arguments got 0');
        }

        callback = args[args.length - 1];

        if (callback && typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }

        if (args.length < 3) {
            callback(new Error('arguments arg short of 3'));
            return;
        }

        if (args.length >= 3) {
            if (args[2].indexOf(':') === -1) {
                callback(new Error('family and qualifier must have it,example ["info:counter"]'));
                return;
            }
        }

        query.row = row;
        const qcolumns = [];
        if (columns) {
            let cols = [], temp = {};
            cols = columns.split(':');
            temp = {
                family: cols[0],
                qualifier: cols[1]
            };
            qcolumns.push(new HBaseTypes.TColumn(temp));
            query.columns = qcolumns;
        }

        const tIncrement = new HBaseTypes.TIncrement(query);

        this.commandCallbacks.add(callback);

        this.thriftClient.increment(table, tIncrement, (err, data) => {

            this.commandCallbacks.delete(callback);

            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }
}

module.exports = Client;
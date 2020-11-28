'use strict';

const _ = require('underscore');

const thrift = require('thrift');

const HBase = require('../gen-nodejs/THBaseService');

const poolModule = require('generic-pool');

const Client = require('./client');

const debug = require('debug')('node-thrift2-hbase:client-pool');

const createClientPool = function (options) {
    const hostsHistory = {};
    options = JSON.parse(JSON.stringify(options));

    switch (options.transport) {
        case 'framed':
            options.transport = thrift.TFramedTransport;
            break;
        case 'buffered':
        default:
            options.transport = thrift.TBufferedTransport;
    }

    switch (options.protocol) {
        case 'compact':
            options.protocol = thrift.TCompactProtocol;
            break;
        case 'json':
            options.protocol = thrift.TJSONProtocol;
            break;
        case 'binary':
        default:
            options.protocol = thrift.TBinaryProtocol;
    }

    options.hosts.forEach(function (host) {
        const hostHistory = {
            host: host,
            errors: 0,
            lastErrorTime: 0
        };
        hostsHistory[host] = hostHistory;
    });

    const halfLifeErrorsInterval = setInterval(function halfLifeErrors() {
        _.forEach(hostsHistory, function (hostHistory) {
            hostHistory.errors = Math.floor(hostHistory.errors / 2);
        });
    }, 60 * 1000);

    const markHostError = (host) => {
        const hostHistory = hostsHistory[host];

        if (hostHistory) {
            hostHistory.lastErrorTime = Date.now();
            hostHistory.errors += 1;
            hostsHistory[host] = hostHistory;
        }
    };

    const pool =
        poolModule.Pool({
            name: 'hbase',
            create: function (callback) {
                let isCallbackCalled = false;

                function callbackWrapper(error, client) {
                    if (isCallbackCalled)
                        return;

                    if (error) {
                        client._invalid = true;
                        markHostError(client.host);
                    }

                    isCallbackCalled = true;
                    callback(error, client);
                }

                if (!options.hosts || options.hosts.length < 1) {
                    return callback(new Error('hosts is empty'));
                }

                //filter hostsHistory with connect error.
                const hostsToSelect = _.values(hostsHistory).filter(function (hostHistory) {
                    return !hostHistory.errors ||
                        ((Date.now() - hostHistory.lastErrorTime) > Math.pow(2, hostHistory.errors));
                });

                if (hostsToSelect.length < 1)
                    return callback(new Error('All host appear to be down'));

                //select one host from list randomly
                const host = hostsToSelect[Math.floor(Math.random() *
                    hostsToSelect.length)].host;

                const clientOption = Object.assign(options, {
                    host
                });
                const client = new Client(clientOption);

                client.connection.on('connect', function () {
                    client.thriftClient = thrift.createClient(HBase, client.connection);
                    callbackWrapper(null, client);
                });

                //todo: 1. Need to retry with different host. 2. Add cool time for host with errors.
                client.connection.on('error', function (err) {
                    debug('Thrift connection error', err, client.host);
                    client.releaseCommandCallbacksOnError(err);
                    callbackWrapper(err, client);
                });

                client.connection.on('close', function () {
                    debug('Thrift close connection error', client.host);
                    let error = new Error('Thrift close connection');
                    client.releaseCommandCallbacksOnError(error);
                    callbackWrapper(error, client);
                });

                client.connection.on('timeout', function () {
                    debug('Thrift timeout connection error', client.host);
                    const error = new Error('Thrift timeout connection');
                    client.releaseCommandCallbacksOnError(error);
                    callbackWrapper(error, client);
                });

            },
            validate: function (client) {
                return !client._invalid && client.connection && client.connection.connected;
            },
            destroy: function (client) {
                client.connection.end();
                //try to disconnect from child process gracefully
                client.child && client.child.disconnect();
            },
            min: options.minConnections || 0,
            max: options.maxConnections || 10,
            idleTimeoutMillis: options.idleTimeoutMillis || 5000
        });

    pool.drain = _.wrap(pool.drain, wrapped => {
        clearInterval(halfLifeErrorsInterval);

        wrapped.call(pool);
    });

    return pool;
};


module.exports = createClientPool;
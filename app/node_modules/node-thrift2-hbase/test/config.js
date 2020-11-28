module.exports = {
    assets: {
        testTableName: 'test:test'
    },
    hbase: {
        hosts: ['localhost'],
        port: 9090,
        minConnections: 0,
        maxConnections: 20,
        idleTimeoutMillis: 5 * 60 * 1000,
        timeout: 60000
    }
};
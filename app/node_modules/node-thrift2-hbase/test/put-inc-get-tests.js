'use strict';

const _ = require('underscore');
const should = require('should');

const Int64 = require('node-int64');

const config = require('./config');
const hbaseServiceCreate = require('../src/service');

const testTable = config.assets.testTableName;

describe('PUT operation', function () {
    this.timeout(10000);

    const putValues = {
        string: 'abcd',
        integer: 321,
        float: 1.5,
        double: 1024.2048,
        number: Math.pow(2, 34) + 1,
        int64: new Int64('123456789abc')
    };

    before(function () {
        this.hbaseClient = hbaseServiceCreate(config.hbase);
    });

    after(function () {
        this.hbaseClient.destroy();
    });

    const now = Date.now();

    for (let [valueType, expectedValue] of Object.entries(putValues)) {
        const testTitle = `should put a ${valueType.toString()} value (${expectedValue})`;

        it(testTitle, async function () {
            const hbaseClient = this.hbaseClient;

            const rowKey = `put.${now}.${valueType}`;

            const putObject = new hbaseClient.Put(rowKey);
            putObject.add('f', valueType, {type: valueType, value: expectedValue});

            console.log('Putting row...', testTable, putObject);

            await hbaseClient.putAsync(testTable, putObject);

            const getObject = new hbaseClient.Get(rowKey);
            getObject.add('f', {name: valueType, type: valueType});

            console.log('Getting row...', getObject);

            const rowData = await hbaseClient.getAsync(testTable, getObject, {});

            let actualValue = rowData && rowData.f && rowData.f[valueType];

            if (valueType === 'int64') {
                should.equal(actualValue.compare(expectedValue), 0);
            } else {
                should.equal(actualValue, expectedValue);
            }
        });
    }
});

describe('Inc operation', function () {
    this.timeout(10000);

    before(function () {
        this.hbaseClient = hbaseServiceCreate(config.hbase);
    });

    after(function () {
        this.hbaseClient.destroy();
    });

    const now = Date.now();

    const incValues = [undefined, 3, -2];

    let sum = 0;

    for (const incVal of incValues) {

        it(`inc a row with amount ${incVal}`, async function () {
            const hbaseClient = this.hbaseClient;

            const rowKey = `inc.${now}`;

            const incObject = new hbaseClient.Inc(rowKey);

            incObject.add('f', 'counter', incVal);

            console.log('Incrementing row...', testTable, incObject);

            await hbaseClient.incAsync(testTable, incObject);

            const getObject = new hbaseClient.Get(rowKey);
            getObject.add('f', {name: "counter", type: "number"});

            console.log('Getting row...', getObject);

            const rowData = await hbaseClient.getAsync(testTable, getObject, {});

            let actualValue = rowData && rowData.f && rowData.f.counter;

            sum += incVal || 1;

            should.equal(actualValue, sum);

        });
    }
});
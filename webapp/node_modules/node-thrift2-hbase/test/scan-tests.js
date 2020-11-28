'use strict';

const _ = require('underscore');
const should = require('should');
const Promise = require('bluebird');

const config = require('./config');
const hbaseServiceCreate = require('../src/service');

const testStartMs = Date.now();
const generatedRowsCount = 2000;
const testTable = config.assets.testTableName;
const testQualifier = `q${testStartMs}`;

const testScanOptions = {
    columns: [{family: 'f', qualifier: testQualifier}]
};

describe('SCAN operation', function () {
    this.timeout(60000);

    before(async function () {
        this.hbaseClient = hbaseServiceCreate(config.hbase);

        await putTestRows();
    });

    after(function () {
        this.hbaseClient.destroy();
    });

    it('should get all rows', async function () {
        const rows = await scanRows({
            numRows: generatedRowsCount
        });

        should.equal(rows.length, generatedRowsCount);
    });

    it('should get range of rows', async function () {
        const rows = await scanRows({
            startRow: createRowKey(1300),
            stopRow: createRowKey(1600),
            numRows: generatedRowsCount * 2,
        });

        should.equal(rows.length, 300);
    });

    it('should get last 10 rows', async function () {
        const firstRows = await scanRows({
            chunkSize: 10,
            numRows: 10
        });

        const latRows = await scanRows({
            chunkSize: 10,
            numRows: 10,
            reversed: true
        });

        should.equal(latRows.length, 10);
        should.equal(firstRows.length, 10);
        should.notEqual(latRows, firstRows, "Last 10 rows should be different from first 10 rows")
    });

    it('should get all rows - 200 rows per iteration', function (done) {
        const chunkSize = 200;
        const limit = 1500;
        let numberOfRows = 0;

        createScanStream({
            numRows: limit,
            chunkSize: chunkSize
        })
            .on('data', rows => {
                console.log(`Received ${rows && rows.length} rows...`);

                numberOfRows += rows.length;

                rows.should.not.be.empty();
                (rows.length).should.be.belowOrEqual(chunkSize);
            })
            .on('error', err => done(err))
            .on('end', () => {

                numberOfRows.should.be.equal(limit);

                done(null);
            });
    });

    it('should get range of rows - 50 rows per iteration', function (done) {
        const chunkSize = 50;

        let totalRows = 0;

        createScanStream({
            startRow: createRowKey(1300),
            stopRow: createRowKey(1655),
            numRows: generatedRowsCount * 2,
            chunkSize: chunkSize
        })
            .on('data', rows => {
                console.log(`Received ${rows && rows.length} rows...`);

                rows.should.not.be.empty();
                (rows.length).should.be.belowOrEqual(chunkSize);

                totalRows += rows.length;
            })
            .on('error', err => done(err))
            .on('end', () => {
                should.equal(totalRows, 355);

                done(null);
            });
    });

    let scanRows = async scanOptions => {
        const hbaseClient = this.ctx.hbaseClient;

        const scanObject = new hbaseClient.Scan(Object.assign({}, testScanOptions, scanOptions));

        console.log('Scanning rows...', scanObject);

        return hbaseClient.scanAsync(testTable, scanObject);
    };

    let createScanStream = scanOptions => {
        const hbaseClient = this.ctx.hbaseClient;

        const scanObject = new hbaseClient.Scan(Object.assign({}, testScanOptions, scanOptions));

        console.log('Scanning rows...', scanObject);

        return hbaseClient.createScanStream(testTable, scanObject);
    };

    const putTestRows = async () => {
        const hbaseClient = this.ctx.hbaseClient;

        console.log(`Putting ${generatedRowsCount} rows on table ${testTable}...`);

        await Promise.map(generateRange(1000, 1000 + generatedRowsCount), async generatedIndex => {
            const rowKey = createRowKey(generatedIndex);

            const putObject = new hbaseClient.Put(rowKey);
            putObject.add('f', testQualifier, {type: 'string', value: 't'});

            await hbaseClient.putAsync(testTable, putObject);
        });

        console.log('Put rows completed');
    };

    const createRowKey = index => `scan.${testStartMs}.${index}`;

    const generateRange = function* (start, end) {
        for (let i = start; i < end; i++) {
            yield i;
        }
    };
});
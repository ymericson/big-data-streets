'use strict';

const Readable = require('stream').Readable;
const HBaseTypes = require('../gen-nodejs/hbase_types');

class ScanStream extends Readable {
    constructor(hbaseClientPool, table, scan) {
        super({objectMode: true});

        const tScan = new HBaseTypes.TScan(scan);

        Object.assign(this, {hbaseClientPool, table, scan, tScan});

        this.numberOfRowsRead = 0;
    }

    async startScan() {
        if (this._scannerClosed) return;

        return new Promise((resolve, reject) => {
            this.hbaseClientPool.acquire((aquireError, hbaseClient) => {
                if (aquireError) {
                    return this.closeScanner(aquireError, resolve);
                }

                const hbaseThriftClient = hbaseClient.thriftClient;

                this.hbaseClient = hbaseClient;
                this.hbaseThriftClient = hbaseThriftClient;

                if (this._scannerClosed) {
                    return this.closeScanner(undefined, resolve);
                }

                hbaseThriftClient.openScanner(this.table, this.tScan, (openScannerError, scannerId) => {
                    if (openScannerError) {
                        return this.closeScanner(openScannerError, resolve);
                    }

                    this.scannerId = scannerId;

                    if (this._scannerClosed) {
                        return this.closeScanner(undefined, resolve);
                    }

                    resolve();
                });
            });
        });
    }

    calcNextBatchSize() {
        if (this.scan.numRows > 0) {
            return Math.min(this.scan.chunkSize, this.scan.numRows - this.numberOfRowsRead);
        } else {
            return this.scan.chunkSize;
        }
    }

    async _read() {
        if (this._scannerClosed) return;

        if (!this._readStarted) {
            await this.startScan();

            if (this._scannerClosed) {
                return this.closeScanner(undefined);
            }

            this._readStarted = true;
        }

        this.hbaseThriftClient
            .getScannerRows(this.scannerId, this.calcNextBatchSize(), (scanError, data) => {
                //  error
                if (scanError) {
                    return this.closeScanner(scanError);
                }

                this.numberOfRowsRead += data.length;

                //  incoming data
                if (data.length > 0) {
                    this.push(this.scan.objectsFromData(data))
                }
                //  end of data or reached the limit
                if (data.length === 0 ||
                    this.scan.numRows > 0 && this.numberOfRowsRead >= this.scan.numRows) {

                    this.closeScanner();

                    this.push(null);

                    return;
                }
            });
    }

    async closeScanner(closeByError, scannerClosedCallback) {
        this._scannerClosed = true;

        if (this.scannerId !== undefined) {
            try {
                await new Promise((resolve, reject) =>
                    this.hbaseThriftClient.closeScanner(this.scannerId, err => !err ? resolve() : reject(err)));

                this.scannerId = undefined;
            } catch (err) {
                this.emit('error', err);
            }
        }

        if (this.hbaseClient !== undefined) {
            try {
                this.hbaseClientPool.release(this.hbaseClient);

                this.hbaseClient = undefined;
            } catch (err) {
                this.emit('error', err);
            }
        }

        if (closeByError !== undefined) {
            this.emit('error', closeByError);
        }

        try {
            scannerClosedCallback && scannerClosedCallback();
        } catch (err) {
            this.emit('error', err);
        }
    }
}

module.exports = ScanStream;
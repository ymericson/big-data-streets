"use strict";

const _ = require('underscore');
const serde = require('./serde');
const Int64 = require('node-int64');

class Scan {
    constructor(options) {
        Object.assign(this, this.getDefaultOptions(), options);
    }

    getDefaultOptions() {
        return {
            startRow: undefined,
            stopRow: undefined,
            maxVersions: 1,
            filterString: undefined,
            columns: [],
            columnTypes: {},
            chunkSize: 250
        };
    }

    setStartRow(startRow) {
        this.startRow = startRow;
        return this;
    };

    setStopRow(stopRow) {
        this.stopRow = stopRow;
        return this;
    };

    setLimit(numRows) {
        this.numRows = numRows;
        return this;
    };

    setMaxVersions(maxVersions) {
        if (maxVersions <= 0) {
            maxVersions = 1;
        }
        this.maxVersions = maxVersions;
        return this;
    };

    setFilterString(filterString) {
        this.filterString = filterString;
        return this;
    };

    setChunkSize(chunkSize) {
        this.chunkSize = chunkSize;
        return this;
    };

    add(family, qualifier, timestamp) {
        var familyMap = {};
        familyMap.family = family;
        if (qualifier) {
            if (typeof qualifier === 'object') {
                familyMap.qualifier = qualifier.name;
                const columnFullName = family + qualifier.name;
                this.columnTypes[columnFullName] = qualifier.type;
            }
            else {
                familyMap.qualifier = qualifier;
            }
        }

        if (timestamp) {
            familyMap.timestamp = new Int64(timestamp);
        }
        this.columns.push(familyMap);
        return this;
    };

    objectsFromData(hbaseRowsData) {
        if (_.isEmpty(this.columnTypes)) {
            return hbaseRowsData;
        }

        return _.map(hbaseRowsData, rowData => {
            const obj = {};
            obj.rowkey = rowData.row.toString();
            _.each(rowData.columnValues, colVal => {
                const family = colVal.family.toString();
                const qualName = colVal.qualifier.toString();
                const columnFullName = family + qualName;
                const columnType = this.columnTypes[columnFullName];
                obj[family] = obj[family] || {};
                obj[family][qualName] = serde.deserialize(colVal.value, columnType);
            });

            return obj;
        });
    }
}

module.exports = Scan;
"use strict";
const _ = require('underscore');
var Int64 = require('node-int64');

const serde = require('./serde');

class Get {
    constructor(row, options) {
        this.row = row;
        this.setMaxVersions(options && options.maxVersions);
        this.setTimeRange(options && options.timeRange);
        this.columns = [];
        this.columnTypes = {};
    }

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
    }

    objectFromData(hbaseRowData) {
        if (_.isEmpty(this.columnTypes)) {
            return hbaseRowData;
        }

        const obj = {};
        obj.rowkey = hbaseRowData.row ? hbaseRowData.row.toString() : null;
        _.each(hbaseRowData.columnValues, colVal => {
            const family = colVal.family.toString();
            const qualName = colVal.qualifier.toString();
            const columnFullName = family + qualName;
            const columnType = this.columnTypes[columnFullName];
            obj[family] = obj[family] || {};
            obj[family][qualName] = serde.deserialize(colVal.value, columnType);
        });

        return obj;
    }

    addFamily(family) {
        var familyMap = {};
        familyMap.family = family;
        this.columns.push(familyMap);
        return this;
    }

    addColumn(family, qualifier) {
        return this.add(family, qualifier);
    }

    addTimestamp(family, qualifier, timestamp) {
        return this.add(family, qualifier, timestamp);
    }

    // default to 1 for performance, HBase default is 3
    setMaxVersions(maxVersions) {
        if (!maxVersions || maxVersions <= 0) {
            maxVersions = 1;
        }
        this.maxVersions = maxVersions;
        return this;
    }

    setTimeRange(timeRange) {
        this.timeRange = timeRange;
        return this;
    }
}

module.exports = Get;
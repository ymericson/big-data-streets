"use strict";

const HBaseTypes = require('../gen-nodejs/hbase_types');

const Int64 = require('node-int64');

const serde = require('./serde');

const Mutate = require('./mutate');

class Put extends Mutate {

    static getThriftType() {
        return HBaseTypes.TPut;
    }

    static getThriftColumnType() {
        return HBaseTypes.TColumnValue;
    }

    add(family, qualifier, value, timestamp) {
        var familyMap = {};
        familyMap.family = family;
        familyMap.qualifier = qualifier;
        familyMap.value = serde.serialize(value);

        if (timestamp) {
            familyMap.timestamp = new Int64(timestamp);
        }

        this.columns.push(familyMap);
        return this;
    }

    addObject(family, object, timestamp) {
        for (const prop in object) {
            const value = object[prop];
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    this.add(family, prop, {type: 'json', value}, timestamp);
                } else if (typeof value === 'object') {
                    this.addObject(family, value, timestamp);
                } else {
                    this.add(family, prop, value, timestamp);
                }
            }
        }
    }

}


module.exports = Put;
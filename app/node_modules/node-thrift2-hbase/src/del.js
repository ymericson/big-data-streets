"use strict";

const Mutate = require('./mutate');

class Del extends Mutate {

    add(family, qualifier, timestamp) {
        var familyMap = {};
        familyMap.family = family;
        if (qualifier) {
            familyMap.qualifier = qualifier;
        }
        if (timestamp) {
            familyMap.timestamp = timestamp;
        }
        this.columns.push(familyMap);
        return this;
    }

    addFamily(family) {
        var familyMap = {};
        familyMap.family = family;
        this.columns.push(familyMap);
        return this;
    }

    addColumn(family, qualifier) {
        var familyMap = {};
        familyMap.family = family;
        familyMap.qualifier = qualifier;
        this.columns.push(familyMap);
        return this;
    }

    addTimestamp(family, qualifier, timestamp) {
        var familyMap = {};
        familyMap.family = family;
        familyMap.qualifier = qualifier;
        familyMap.timestamp = timestamp;
        this.columns.push(familyMap);
        return this;
    }
}

module.exports = Del;
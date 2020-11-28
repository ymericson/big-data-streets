"use strict";

const HBaseTypes = require('../gen-nodejs/hbase_types');

const Mutate = require('./mutate');

class Inc extends Mutate {

    static getThriftType() {
        return HBaseTypes.TIncrement;
    }

    static getThriftColumnType(){
        return HBaseTypes.TColumnIncrement;
    }

    add(family, qualifier, amount) {
        const familyMap = {};
        familyMap.family = family;
        familyMap.qualifier = qualifier;
        familyMap.amount = (amount === 0) ? 0 : (amount || 1);
        this.columns.push(familyMap);
        return this;
    }

}

module.exports = Inc;
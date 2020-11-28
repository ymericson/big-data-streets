"use strict";

class Mutate {

    static getThriftType() {
        throw new Error('UNIMPLEMENTED');
    }

    static getThriftColumnType(){
        throw new Error('UNIMPLEMENTED');
    }

    constructor(row) {
        this.row = row;
        this.columns = [];
    }

    setDurability(type) {
        this.durability = type;
    }

    setSkipWalDurability() {
        this.setDurability(1);
    }

    setAsyncWalDurability() {
        this.setDurability(2);
    }

    setSyncWalDurability() {
        this.setDurability(3);
    }

    setFSyncWalDurability() {
        this.setDurability(4);
    }

    setAttributes(attributeMap) {
        this.attributes = attributeMap;
    }

    createThriftArgs() {

        const ThriftColumnType =  this.constructor.getThriftColumnType();

        const thriftArgs = {
            row: this.row,
            durability: this.durability,
            attributes: this.attributes
        };

        const qcolumns = [];
        if (this.columns && this.columns.length > 0) {
            for (const col of this.columns) {
                qcolumns.push(new ThriftColumnType(col));
            }
            thriftArgs.columns = qcolumns;
        }

        thriftArgs.columnValues = qcolumns;

        return thriftArgs;
    }

    createThriftObject() {

        const args = this.createThriftArgs();

        const ThriftType = this.constructor.getThriftType();

        return new ThriftType(args);
    }

}

module.exports = Mutate;
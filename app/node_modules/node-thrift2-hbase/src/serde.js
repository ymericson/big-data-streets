const Int64 = require('node-int64');

function serialize(valueObj) {
    if (typeof valueObj != 'object') {
        return new Buffer(valueObj.toString());
    }

    switch (valueObj.type) {
        case "string":
            return new Buffer(valueObj.value.toString());
        case "json":
            return new Buffer(JSON.stringify(valueObj.value));
        case "integer":
        case "integer32":
            var buf = new Buffer(4);
            buf.writeInt32BE(valueObj.value, 0);
            return buf;
        case "float":
            var buf = new Buffer(4);
            buf.writeFloatBE(valueObj.value, 0);
            return buf;
        case 'double':
            var buf = new Buffer(8);
            buf.writeDoubleBE(valueObj.value, 0);
            return buf;
        case "number":
        case "integer48":
            var buf = new Buffer(8);
            buf.writeIntBE(valueObj.value, 2, 6);
            return buf;
        case "UInteger48":
            var buf = new Buffer(6);
            buf.writeUIntBE(valueObj.value, 0);
            return buf;
        case "int64":
            return valueObj.value.buffer;
        default:
            return new Buffer(valueObj.toString());
    }
}

function deserialize(buf, type) {
    switch (type) {
        case "string":
            return buf.toString();
        case "json":
            return JSON.parse(buf.toString());
        case "integer":
        case "integer32":
            return buf.readInt32BE();
        case "float":
            return buf.readFloatBE();
        case 'double':
            return buf.readDoubleBE();
        case "number":
        case "integer48":
            return buf.readIntBE(2, 6);
        case "UInteger48":
            return buf.readUIntBE(0);
        case "int64":
            return new Int64(buf);
        default:
            return buf.toString();
    }
}

module.exports = {
    serialize,
    deserialize
};
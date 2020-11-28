A simple, performant, connection-pooled, cached and promisified HBase client library for NodeJS.
---

# API 
## Instantiating the HBase client
```javascript
const config = {
    hosts: ["master"],
    port: "9090",
};

const HBase = require('node-thrift2-hbase')(config);
```

## Get

```javascript
var get = HBase.Get('row1');    //row1 is rowKey
get.addFamily('cf');
// get.add('cf'); identical to addFamily

get.addColumn('info', 'name');
// get.add('info', 'name'); identical to addColumn

get.addTimestamp('info', 'name', 1414385447707);
// get.add('info', 'name', 1414385447707); identical to addTimestamp

get.setMaxVersions(3);

//last ten days as timerange
get.setTimeRange({
    minStamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    maxStamp: Date.now()
});

HBase.getAsync('users', get)
    .then(function (data) {
        console.log("Data for user with key 'row1':");
        console.log('==============================');
        _.each(data[0].columnValues, function (colVal, index) {
            console.log('Column value #', index);
            console.log('family:', colVal.family.toString());
            console.log('qualifier:', colVal.qualifier.toString());
            console.log('value:', colVal.value.readInt32BE(0, 4));
        });
    })
    .catch(function (err) {
        console.log('error:', err);
    });

HBase.get('users', get, function (err, data) { //get users table
    if (err) {
        console.log('error:', err);
        return;
    }

    console.log("Data for user with key 'row1':");
    console.log('==============================');
    _.each(data[0].columnValues, function (colVal, index) {
        console.log('Column value #', index);
        console.log('family:', colVal.family.toString());
        console.log('qualifier:', colVal.qualifier.toString());
        console.log('value:', colVal.value.readInt32BE(0, 4));
    });
});
```
A shorthand version is the `getRow` function:
```javascript
HBase.getRow('users', 'row1', ['info:name', 'ecf'], 1,
    function (err, data) {
        if (err) {
            console.log('error:', err);
            return;
        }
        console.log("Data for user with key 'row1':");
        console.log('==============================');
        _.each(data[0].columnValues, function (colVal, index) {
            console.log('Column value #', index);
            console.log('family:', colVal.family.toString());
            console.log('qualifier:', colVal.qualifier.toString());
            console.log('value:', colVal.value.readInt32BE(0, 4));
        });
    });

HBase.getRowAsync('users', 'row1', ['info:name', 'ecf'], 1)
    .then(function (data) {
        console.log("Data for user with key 'row1':");
        console.log('==============================');
        _.each(data[0].columnValues, function (colVal, index) {
            console.log('Column value #', index);
            console.log('family:', colVal.family.toString());
            console.log('qualifier:', colVal.qualifier.toString());
            console.log('value:', colVal.value.readInt32BE(0, 4));
        });
    })
    .catch(function (err) {
        console.log('error:', err);
    });
```

### Qualifier serialization/deserialization:
When adding a qualifier via `add` methods to `Get`, `Put` and `Scan` objects you can specify the type of value expected for that qualifier. That means that instead of reading the value of the qualifier's buffer yourself, the library can do it for you. For example:
```javascript
var get = HBase.Get('row1');    //row1 is rowKey
// column family "f", qualifier "q1", value is a float
get.add('f', {name: 'q1', type: 'float'});
// column family "f", qualifier "q2", value is a json object
get.add('f', {name: 'q2', type: 'json'});
// column family "f", qualifier "q3" type unspecified - default is string
get.add('f', 'q3');

HBase.get("table", get).then(rowData => console.log(rowData));
shouldEqual(rowData, {
    rowkey: "row1", 
    d:{
        q1: 123.321
        q2: {prop:"val"},
        q3: "123.321"
    }
});
```

The following types are supported:
`string` (if type is unspecified, defaults to `string`)
`json` (parses the value as a JSON string)
`integer` (alias: `integer32`)
`float`
`double`
`number` (alias: `integer48`)
`UInteger48`
`int64`

## Put

```javascript
var put = HBase.Put('row1');

//        cf   qualifier              value
put.add('info', 'money', {type: 'float', value: 12.34});

put.add('info', 'click', {type: 'integer', value: 100});

//string values don't need a wrapper object
put.add('ecf', 'name', 'zhudaxian');

//                                   timestamp
put.add('info', 'name', 'beijing', new Date().getTime());


HBase.put('users', put, function (err) {
    if (err) {
        console.log('error:', err);
        return;
    }
    
    console.log('Put is successful.');
});

HBase.putAsync('users', put)
    .then(function () {
        console.log('Put is successful.');
    })
    .catch(function (err) {
        console.log('error:', err);
    });
```
A shorthand version is the `putRow` function:
```javascript
HBase.putRow('users', 'row1', 'info:name', 'phoneqq.com', 1414140874929,
    function (err) {
        if (err) {
            console.log('error:', err);
            return;
        }
        console.log('Put is successfull.');
    });

HBase.putRowAsync('users', 'row1', 'info:name', 'phoneqq.com', 1414140874929)
    .then(function () {
        console.log('Put is successfull.');
    })
    .catch(function (err) {
        console.log('error:', err);
    });
```

# Inc
```javascript

var inc = hbaseClient.Inc('row1');    //row1 is rowKey

inc.add('info','counter');

inc.add('info','counter2');

hbaseClient.inc('users',inc,function(err,data){ 
    //inc users table

    if(err){
        console.log('error:',err);
        return;
    }

    console.log(err,data);

});

```

# Del
```javascript

var del = hbaseClient.Del('row1');    //row1 is rowKey

//del.addFamily('ips');   //delete family ips
//del.addColumn('info','click2'); //delete family and qualifier info:click2
//del.addTimestamp('info','click3',1414136046864); //delete info:click3 and timestamp

//or Recommend this function add

del.add('info');    //delete all family info
del.add('info','name');   //delete family and qualifier info:name
del.add('info','tel',1414136046864); //delete info:tel and timestamp

del.add('ecf'); //delete other family ecf
del.add('ecf','name');  //delete family and qualifier ecf:name
del.add('ecf','tel',1414136119207); //delete info:tel and timestamp

//del.add('ips'); //is error ,because this family ips is not exist

hbaseClient.del('users',del,function(err){ //put users table
    if(err){
        console.log('error:',err);
        return;
    }
    console.log(err,'del is successfully');
});

```

# Scan
```javascript

var scan = hbaseClient.Scan();

//get.addFamily('cf');  //add not found column is error

//scan.addFamily('info');  //add all family

//scan.addStartRow('row1');   //start rowKey

//scan.addStopRow('row1p');   //stop rowKey

//scan.addColumn('info','name');  //add family and qualifier

//scan.addColumn('ecf','name');   //add other family

//scan.setMaxVersions(1); //set maxversions

//scan.addNumRows(10); //search how much number rows

//or Recommend this function add

scan.addStartRow('row1');   //start rowKey

scan.addStopRow('row1p');   //stop rowKey

scan.add('info');    //scan all family info

scan.add('info','name');   //scan family and qualifier info:name

scan.add('ecf'); //scan other family ecf

scan.add('ecf','name');  //scan family and qualifier ecf:name

scan.setMaxVersions(1); //set maxversions

scan.addNumRows(10); //search how much number rows

hbaseClient.scan('users',scan,function(err,data){ //get users table
    if(err){
        console.log('error:',err);
        return;
    }
    console.log(err,data);

//    console.log(err,data[0].columnValues);
});

```

# Scan Stream
```javascript
const tableName = 'test:test_table';

const scanObject = 
    hbaseClient.Scan({
        family: 'f',                //  Column family
        qualifier: 'test',          //  Qualifier
        startRow: 'test.row.1',     //  Start scan row key (STARTROW)
        stopRow: 'test.row.100',    //  Stop scan row key (STOPROW)
        numRows: 50,                //  Max total rows to fetch (LIMIT)
        chunkSize: 10               //  Max rows to fetch for one batch
    });

hbaseClient
    .createScanStream(tableName, scanObject)
    .on('data', rows => {
        console.log(`Received ${rows.length} rows...`);
    })
    .on('error', err => {
        errorHandler(err);
    })
    .on('end', () => {
        console.log('scan ended');
    });
```

# Table Salting
What is "salting"? The term is taken from the encryption nomenclature, but for our purposes it just means adding a predictable string to a key. The way HBase stores rows means that if the keys are not spread across the string spectrum, then the data will physically be kept in a "not spread" manner - for example, having most rows of a table on very few `Region Server`s. So if your keys are well-spread, so is your data. This allows for faster and more parallel reads/writes en-masse. The only problem is keeping track of which table has its keys salted, and exactly how were the keys salted. We have a solution for that:

```javascript
var hbase = require('node-thrift2-hbase')(hbaseConfig);
hbase.saltMap = {
    'myTable1': hbase.saltFunctions.saltByLastKeyCharCode,
    'myTable2': hbase.saltFunctions.saltByLastKeyCharCode
};
```

All `get` and `put` operations for tables specified in the `saltMap` will be 
salted using the given function. `hbase.saltFunctions` contains some ready-made salt functions. If you have a salt function you find useful, don't hesitate to make a PR adding it!


---
#### Working HBase-Thrift compiler combinations
The code supplied here used Thrift 0.9.3 to generate code for HBase 0.98.4.
If you'd like to use this library with different versions, download the desired HBase Thrift definition file and compile it using the Thrift compiler of your choice into the project's `gen-nodejs` folder.
If you are successfully working with different HBase/Thrift compiler combination please tell us and we'll add the info here.

HBase     |Thrift Compiler  |
:--------:|:----------------:
0.98.4    | 0.9.3           |
1.1.2     | 0.9.3           |
1.1.2     | 0.10.0          |

---

**This library was initially based on https://www.npmjs.com/package/node-thrift-hbase but 
due to that library's abandonment by the author we had to republish it with our contributions.**
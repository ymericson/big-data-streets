/**
 * Created by rubinus on 14-10-20.
 */
var HBase = require('../');

var config = {
    host: 'master',
    port: 9090
};

var hbaseClient = HBase.client(config);

var del = hbaseClient.Del('row1');    //row1 is rowKey

//del.addFamily('ips');   //delete family ips
//del.addColumn('info','name'); //delete family and qualifier info:name
//del.addTimestamp('info','tel',1414136046864); //delete info:tel and timestamp

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


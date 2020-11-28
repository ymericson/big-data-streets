/**
 * Created by rubinus on 14-10-20.
 */
var HBase = require('../');

var config = {
    host: 'master',
    port: 9090
};

var hbaseClient = HBase.client(config);

var inc = hbaseClient.Inc('row1');    //row1 is rowKey

inc.add('info','counter');

inc.add('info','counter2');

hbaseClient.inc('users',inc,function(err,data){ //inc users table
    if(err){
        console.log('error:',err);
        return;
    }
    console.log(err,data);
});


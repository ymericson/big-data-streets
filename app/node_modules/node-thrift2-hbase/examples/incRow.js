/**
 * Created by rubinus on 14-10-20.
 */
var HBase = require('../');

var config = {
    host: 'master',
    port: 9090
};

var hbaseClient = HBase.client(config);


hbaseClient.incRow('users','row1','info:counter',function(err,data){ //inc users table
    if(err){
        console.log('error:',err);
        return;
    }
    console.log(err,data);
});


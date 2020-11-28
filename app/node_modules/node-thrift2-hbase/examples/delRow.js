/**
 * Created by rubinus on 14-10-20.
 */
var HBase = require('../');

var config = {
    host: 'master',
    port: 9090
};

var hbaseClient = HBase.client(config);

hbaseClient.delRow('users','row1','info:name',1414137991649,function(err){ //put users table
    if(err){
        console.log('error:',err);
        return;
    }
    console.log(err,'del is successfully');
});


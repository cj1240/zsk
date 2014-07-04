'use strict';
/*global require, module, Buffer, ccs*/

var mongoIp = ccs.conf.MongodbIp || '127.0.0.1',
    mongoPort = ccs.conf.MongodbPort || 27017,
    mongoDbName = ccs.conf.MongodbDefaultDbName || 'ccs';

module.exports = {
    db: ccs.module.mongoskin.db(mongoIp + ':' + mongoPort + '/?auto_reconnect=true', {
        database: mongoDbName
    })
};
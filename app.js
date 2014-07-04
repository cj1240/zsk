'use strict';
/*global global, require, process, module, ccs, _restConfig*/

var fs = require('fs'),
    path = require('path'),
    zlib = require('zlib'),
    util = require('util'),
    http = require('http'),
    domain = require('domain'),
    serverDm = domain.create(),
    processPath = path.dirname(process.argv[1]);

global.ccs = {}; // 注册全局变量ccs
module.exports.conf = require('./config/config'); // 注册rrestjs配置文件
module.exports.conf_dev = require('./config/config_dev'); // 注册开发模式配置文件

serverDm.on('error', function (err) {
    delete err.domain;
    ccs.serverlog.error(err);
});
serverDm.run(function () {
    ccs.module = {};
    ccs.module.os = require('os');
    ccs.module.xss = require('xss');
    ccs.module.then = require('thenjs');
    ccs.module.marked = require('marked');
    ccs.module.rrestjs = require('rrestjs');
    ccs.module.mongoskin = require('mongoskin');
    ccs.module.nodemailer = require('nodemailer');
    ccs.serverlog = ccs.module.rrestjs.restlog;
    ccs.conf = ccs.module.rrestjs.config;
    ccs.lib = {};
    ccs.lib.msg = require('./lib/msg.js');
    ccs.lib.json = require('./lib/json.js');
    ccs.lib.tools = require('./lib/tools.js');
    ccs.lib.email = require('./lib/email.js');
    ccs.lib.redis = require('./lib/redis.js');
    ccs.lib.CacheLRU = require('./lib/cacheLRU.js');
    ccs.lib.converter = require('./lib/anyBaseConverter.js');
    ccs.Err = ccs.lib.tools.Err;
    ccs.dao = {};
    ccs.dao.db = require('./dao/mongoDao.js').db;
    ccs.dao.tag = require('./dao/tagDao.js');
    ccs.dao.test = require('./dao/testDao.js');//dw2014
    ccs.dao.user = require('./dao/userDao.js');
    ccs.dao.index = require('./dao/indexDao.js');
    ccs.dao.article = require('./dao/articleDao.js');
    ccs.dao.message = require('./dao/messageDao.js');
    ccs.dao.collection = require('./dao/collectionDao.js');
    ccs.thenErrLog = function (defer, err) {
        ccs.serverlog.error(err);
    };

    var redis = ccs.lib.redis,
        then = ccs.module.then,
        each = ccs.lib.tools.each,
        CacheLRU = ccs.lib.CacheLRU,
        extend = ccs.lib.tools.extend,
        resJson = ccs.lib.tools.resJson,
        TimeLimitCache = ccs.lib.redis.TimeLimitCache;

    redis.connect().then(function (defer) {
        redis.initConfig(ccs.lib.json.GlobalConfig, defer); // 初始化config缓存
    }).then(function (defer, config) {
        ccs.config = config;
        if (process.argv.indexOf('install') > 0) { // 带'install'参数启动则初始化MongoDB
            require('./api/install.js')().all(defer);
        } else { // Redis config缓存未赋值，则从MongoDB取值
            ccs.dao.index.getGlobalConfig(defer);
        }
    }).then(function (defer, config) {
        each(ccs.config, function (value, key, list) {
            if (key in config) {
                list[key] = config[key]; // 写入config缓存
                //console.log( "aaaaa" + list[key]);
                //console.log( "bbbbb" + key);
            }
        });
        defer(null, ccs.config);
    }).then(function (defer, config) {
        var api = ['index', 'user', 'article', 'tag', 'collection', 'message', 'rebuild','test'];
            //console.log(ccs.config.tagCache);
            //console.log(config.listCache);
        ccs.cache = {};
        ccs.cache.test = new CacheLRU(100);//dw2014
        ccs.cache.tag = new CacheLRU(config.tagCache);
        ccs.cache.user = new CacheLRU(config.userCache);
        ccs.cache.list = new CacheLRU(config.listCache);
        ccs.cache.article = new CacheLRU(config.articleCache);
        ccs.cache.comment = new CacheLRU(config.commentCache);
        ccs.cache.message = new CacheLRU(config.messageCache);
        ccs.cache.collection = new CacheLRU(config.collectionCache);
        ccs.cache.timeInterval = new TimeLimitCache(config.TimeInterval, 'string', 'interval', false);
        ccs.cache.pagination = new TimeLimitCache(config.paginationCache, 'array', 'pagination', true);
        ccs.robotReg = new RegExp(config.robots || 'Baiduspider|Googlebot|BingBot|Slurp!', 'i');
        ccs.api = {};

        each(api, function (x) {
            ccs.api[x] = {}; // 初始化api引用，从而各api内部可提前获取其它api引用
           // console.log(ccs.api[x]);
        });
        each(api, function (x) {
            extend(ccs.api[x], require('./api/' + x + '.js')); // 扩展各api的具体方法

        });

        fs.readFile(processPath + '/package.json', 'utf8', defer); // 读取软件信息

    }).then(function (defer, data) {
        data = JSON.parse(data);
        data.nodejs = process.versions.node;
        data.rrestjs = _restConfig._version;
        ccs.config.info = data;
        redis.userCache.index.total(defer); // 读取user缓存

    }).then(function (defer, users) {
        var rebuild = ccs.api.rebuild;
        if (!users) { // user缓存为空，则判断redis缓存为空，需要初始化
            // 初始化redis缓存
            then(function (defer2) {
                rebuild.user().all(defer2);
            }).then(function (defer2) {
                rebuild.tag().all(defer2);
            }).then(function (defer2) {
                rebuild.article().all(defer);
            }).then(function (defer2) {
                    rebuild.test().all(defer);
                }).fail(defer);
        } else {
            defer();
        }

    }).then(function (defer) {
        http.createServer(function (req, res) {
            var dm = domain.create();
            function errHandler(err, res, dm) {
                delete err.domain;

                try {
                    res.on('finish', function () {
                        //ccs.dao.db.close();
                        process.nextTick(function () {
                            dm.dispose();
                        });
                    });
                    if (err.hasOwnProperty('name')) {
                        res.sendjson(resJson(err));
                    } else {
                        ccs.serverlog.error(err);
                        res.sendjson(resJson(ccs.Err(ccs.lib.msg.MAIN.requestDataErr)));
                    }
                } catch (error) {
                    delete error.domain;
                    ccs.serverlog.error(error);
                    dm.dispose();
                }
            }

            function router(req, res) {
                if (req.path[0] === 'api' && ccs.api[req.path[1]]) {
                   // console.log("ffff"+req.path[0]+req.path[1]);
                    ccs.api[req.path[1]][req.method.toUpperCase()](req, res); // 处理api请求
                } else if (req.path[0].toLowerCase() === 'sitemap.xml') {
                    ccs.api.article.sitemap(req, res); // 响应搜索引擎sitemap，动态生成
                } else if (req.path[0].slice(-3).toLowerCase() === 'txt') {
                    // 直接响应static目录的txt文件，如robots.txt
                    then(function (defer) {
                        fs.readFile(processPath + ccs.conf.staticFolder + req.path[0], 'utf8', defer);
                    }).then(function (defer, txt) {
                        res.setHeader('Content-Type', 'text/plain');
                        res.send(txt);
                    }).fail(res.throwError);
                } else if (ccs.robotReg.test(req.useragent)) {
                    ccs.api.article.robot(req, res); // 处理搜索引擎请求
                } else {
                    ccs.config.visitors = 1; // 访问次数+1
                    res.setHeader('Content-Type', 'text/html');
                    if (ccs.cache.indexTpl) {
                        res.send(ccs.cache.indexTpl); // 响应首页index.html
                    } else {
                        then(function (defer) {
                            fs.readFile(processPath + ccs.conf.staticFolder + '/index.html', 'utf8', defer);
                        }).then(function (defer, tpl) {
                            ccs.cache.indexTpl = tpl;
                            res.send(ccs.cache.indexTpl);
                        }).fail(res.throwError);
                    }
                }
            }

            res.throwError = function (defer, err) { // 处理then.js捕捉的错误
                if (!util.isError(err)) {
                    err = ccs.Err(err);
                }
                errHandler(err, res, dm);
            };
            dm.on('error', function (err) { // 处理domain捕捉的错误
                errHandler(err, res, dm);
            });
            dm.run(function () {
                router(req, res); // 运行
            });
        }).listen(ccs.conf.listenPort);
        console.log('ccs start at ' + ccs.conf.listenPort);
    }).fail(function (defer, err) {
        throw err;
    });
});

'use strict';
/*global require, module, Buffer, process, ccs*/

var tagAPI = ccs.api.tag,
    userAPI = ccs.api.user,
    ccsCache = ccs.cache,
    os = ccs.module.os,
    then = ccs.module.then,
    ccsConfig = ccs.config,
    userCache = ccsCache.user,
    msg = ccs.lib.msg,
    redis = ccs.lib.redis,
    tools = ccs.lib.tools,
    each = tools.each,
    union = tools.union,
    equal = tools.equal,
    resJson = tools.resJson,
    toArray = tools.toArray,
    checkUrl = tools.checkUrl,
    intersect = tools.intersect,
    checkEmail = tools.checkEmail,
    removeItem = tools.removeItem,
    errorHandler = tools.errorHandler,
    configSetTpl = ccs.lib.json.ConfigSetTpl,
    configPublicTpl = ccs.lib.json.ConfigPublicTpl;

function getIndex(req, res) {
    var Uid;

    then(function (defer) {
        if (req.session.Uid) {
            userCache.getP(req.session.Uid).all(defer);
        } else if (req.cookie.autologin) {
            userAPI.cookieLogin(req).then(function (defer2, _id) {
                Uid = _id;
                userAPI.cookieLoginUpdate(Uid).all(defer2);
            }).then(function (defer2, cookie) {
                res.cookie('autologin', cookie, {
                    maxAge: 259200000,
                    path: '/',
                    httpOnly: true
                });
                userCache.getP(Uid).all(defer);
            }).fail(defer);
        } else {
            defer();
        }
    }).all(function (defer, err, user) {
        var config = union(configPublicTpl);

        // 自动登录更新session
        if (Uid && !req.session.Uid && user) {
            req.session.Uid = Uid;
            req.session.role = user.role;
            req.session.logauto = true;
        }
        if (user) {
            var upyun = union(ccs.conf.upyun);
            upyun.expiration += Math.ceil(Date.now() / 1000);
            upyun['save-key'] = '/' + user._id + upyun['save-key'];
            user.upyun = {
                url: ccsConfig.upyun.url + (ccsConfig.upyun.bucket || upyun.bucket),
                policy: tools.base64(JSON.stringify(upyun)),
                allowFileType: ccs.conf.upyun['allow-file-type']
            };
            user.upyun.signature = tools.MD5(user.upyun.policy + '&' + ccsConfig.upyun.form_api_secret);
        }

        // 更新在线用户
        then(function (defer2) {
            redis.onlineCache(req, defer2);
        }).then(function (defer2, onlineUser, onlineNum) {
            ccsConfig.onlineUsers = onlineUser > 1 ? onlineUser : 2;
            ccsConfig.onlineNum = onlineNum > 1 ? onlineNum : 2;
            if (ccsConfig.onlineNum > ccsConfig.maxOnlineNum) {
                ccsConfig.maxOnlineNum = ccsConfig.onlineNum;
                ccsConfig.maxOnlineTime = Date.now();
            }
        });

        then(function (defer2) {
            intersect(config, ccsConfig);
            redis.tagCache.index(0, 20, defer2);
        }).all(function (defer2, err, tags) {
            tagAPI.convertTags(tags).all(defer2);
        }).all(function (defer2, err, tags) {
            config.tagsList = tags || [];
            config.user = user || null;
            return res.sendjson(resJson(null, config));
        });
    }).fail(res.throwError);
}

function getGlobal(req, res) {
    var config = union(ccsConfig);
    then(function (defer) {
        if (req.session.role >= 4) {
            config.sys = {
                uptime: Math.round(process.uptime()),
                cpus: os.cpus(),
                platform: process.platform,
                node: process.versions,
                memory: process.memoryUsage(),
                user: userCache.info(),
                article: ccsCache.article.info(),
                comment: ccsCache.comment.info(),
                list: ccsCache.list.info(),
                tag: ccsCache.tag.info(),
                collection: ccsCache.collection.info(),
                message: ccsCache.message.info()
            };
            ccsCache.pagination.info(defer);
        } else {
            defer(null, ccs.Err(msg.USER.userRoleErr));
        }
    }).then(function (defer, info) {
        config.sys.pagination = info;
        ccsCache.timeInterval.info(defer);
    }).then(function (defer, info) {
        config.sys.timeInterval = info;
        delete config.smtp.auth.pass;
        return res.sendjson(resJson(null, config, null, {
            configTpl: union(configSetTpl)
        }));
    }).fail(res.throwError);
}

function setGlobal(req, res) {
    var body = {},
        defaultObj = union(configSetTpl),
        setObj = intersect(union(configSetTpl), req.apibody);

    function checkArray(x, i, list) {
        x = x > 0 ? +x : 0;
        list[i] = x;
    }

    then(function (defer) {
        if (req.session.role !== 5) {
            defer(ccs.Err(msg.USER.userRoleErr));
        }
        if (setObj.domain && !checkUrl(setObj.domain)) {
            defer(ccs.Err(msg.MAIN.globalDomainErr));
        }
        if (setObj.url) {
            if (!checkUrl(setObj.url)) {
                defer(ccs.Err(msg.MAIN.globalUrlErr));
            } else {
                setObj.url = setObj.url.replace(/(\/)+$/, '');
            }
        }
        if (setObj.email && !checkEmail(setObj.email)) {
            defer(ccs.Err(msg.MAIN.globalEmailErr));
        }
        if (setObj.TimeInterval && setObj.TimeInterval < 5) {
            setObj.TimeInterval = 5;
        }
        each(['UsersScore', 'ArticleStatus', 'ArticleHots', 'paginationCache'], function (x) {
            each(setObj[x], checkArray);
        });
        if (setObj.robots) {
            ccs.robotReg = new RegExp(setObj.robots, 'i');
        }
        if (setObj.smtp) {
            setObj.smtp = union(ccsConfig.smtp, setObj.smtp);
        }
        if (setObj.upyun) {
            setObj.upyun = union(ccsConfig.upyun, setObj.upyun);
        }
        userCache.capacity = setObj.userCache || userCache.capacity;
        ccsCache.article.capacity = setObj.articleCache || ccsCache.article.capacity;
        ccsCache.comment.capacity = setObj.commentCache || ccsCache.comment.capacity;
        ccsCache.list.capacity = setObj.listCache || ccsCache.list.capacity;
        ccsCache.tag.capacity = setObj.tagCache || ccsCache.tag.capacity;
        ccsCache.collection.capacity = setObj.collectionCache || ccsCache.collection.capacity;
        ccsCache.message.capacity = setObj.messageCache || ccsCache.message.capacity;
        ccsCache.pagination.timeLimit = setObj.paginationCache || ccsCache.pagination.timeLimit;
        ccsCache.timeInterval.timeLimit = setObj.TimeInterval || ccsCache.timeInterval.timeLimit;
        each(setObj, function (value, key, list) {
            ccsConfig[key] = value;
        });
        intersect(defaultObj, ccsConfig);
        delete defaultObj.smtp.auth.pass;
        return res.sendjson(resJson(null, defaultObj));
    }).fail(res.throwError);
}

module.exports = {
    GET: function (req, res) {
        switch (req.path[2]) {
        case 'admin':
            return getGlobal(req, res);
        default:
            return getIndex(req, res);
        }
    },
    POST: function (req, res) {
        switch (req.path[2]) {
        case 'admin':
            return setGlobal(req, res);
        }
    }
};

'use strict';
/*global require, module, Buffer, ccs*/

var msg = ccs.lib.msg,
    then = ccs.module.then,
    UserPublicTpl = ccs.lib.json.UserPublicTpl,
    UserPrivateTpl = ccs.lib.json.UserPrivateTpl,
    each = ccs.lib.tools.each,
    union = ccs.lib.tools.union,
    SHA256 = ccs.lib.tools.SHA256,
    HmacMD5 = ccs.lib.tools.HmacMD5,
    HmacSHA256 = ccs.lib.tools.HmacSHA256,
    isJSON = ccs.lib.tools.isJSON,
    resJson = ccs.lib.tools.resJson,
    toArray = ccs.lib.tools.toArray,
    checkUrl = ccs.lib.tools.checkUrl,
    gravatar = ccs.lib.tools.gravatar,
    intersect = ccs.lib.tools.intersect,
    checkEmail = ccs.lib.tools.checkEmail,
    removeItem = ccs.lib.tools.removeItem,
    checkUserID = ccs.lib.tools.checkUserID,
    errorHandler = ccs.lib.tools.errorHandler,
    checkUserName = ccs.lib.tools.checkUserName,
    filterSummary = ccs.lib.tools.filterSummary,
    paginationList = ccs.lib.tools.paginationList,
    checkTimeInterval = ccs.lib.tools.checkTimeInterval,
    tagAPI = ccs.api.tag,
    redis = ccs.lib.redis,
    testDao = ccs.dao.test,
    testCache = ccs.cache.test,
    articleAPI = ccs.api.article,
    cache = ccs.lib.redis.userCache,
    convertUserID = testDao.convertID,
    paginationCache = ccs.cache.pagination;

testCache.getP = function (ID) {
    var that = this,
        inCache = false;
    return then(function (defer) {
        if (ID >= 0) {
            var test = that.get(ID);
            if (test) {
                inCache = true;
                return defer(null, test);
            } else {
                return testDao.gettestIndex(ID, defer);
            }
        } else {
            defer(ccs.Err(msg.TAG.tagNone));
        }
    }).then(function (defer, tag) {
            if (!inCache) {
                that.put(ID, tag);
            }
            defer(null, tag);
        }).fail(errorHandler);
};
function adduser(userObj) {


    console.log("uuuuuuuuuu"+userObj.a);

    return then(function (defer) {
            testDao.setNewtest(
                userObj
            , function (err, user) {
                if (user) {
                }
                defer(err, user);
            });
        }).fail(errorHandler);
}
function test(req, res) {
    var data = req.apibody;
    console.log("fsdafdasf");
          then(function (defer) {
            adduser(data).all(defer);
        }).fail(res.throwError);
}
function gettest(req, res) {
    then(function (defer) {
        if (req.session.role !== 5) {
            defer(ccs.Err(msg.USER.testRoleErr));
        } else {
            cache.index(0, -1, defer);
        }
    }).then(function (defer, list) {
            paginationList(req, list, testCache, defer);
        }).fail(res.throwError);
}
module.exports = {

    GET: function (req, res) {
        console.log(req.path[2]);
        switch (req.path[2]) {
            case undefined:
            case 'add':
                return gettest(req, res);
            default:
                return gettest(req, res);
        }
    },
    POST: function (req, res) {
        console.log("here");
        switch (req.path[2]) {
            case undefined:
            case 'add':
                return test(req, res);
            default:
                return test(req, res);
        }
    }
};
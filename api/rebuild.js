'use strict';
/*global require, module, Buffer, ccs*/

// rebuild redis cache

var redis = ccs.lib.redis,
    then = ccs.module.then,
    resJson = ccs.lib.tools.resJson,
    errorHandler = ccs.lib.tools.errorHandler;

module.exports = {
    user: function () {
        return then(function (defer) {
            redis.userCache.removeAll(defer);
        }).then(function (defer) {
            var users = 0;
            ccs.dao.user.getUsersIndex(function (err, doc) {
                if (err) {
                    defer(err);
                } else if (doc) {
                    redis.userCache.update(doc);
                    users += 1;
                } else {
                    ccs.config.users = users;
                    defer(null, users);
                }
            });
        }).fail(errorHandler);
    },
    tag: function () {
        return then(function (defer) {
            redis.tagCache.removeAll(defer);
        }).then(function (defer) {
            var tags = 0;
            ccs.dao.tag.getTagsIndex(function (err, doc) {
                if (err) {
                    defer(err);
                } else if (doc) {
                    redis.tagCache.update(doc);
                    tags += 1;
                } else {
                    defer(null, tags);
                }
            });
        }).fail(errorHandler);
    },
    article: function () {
        return then(function (defer) {
            redis.articleCache.removeAll(defer);
        }).then(function (defer) {
            var total = {
                comments: 0,
                articles: 0
            };

            ccs.dao.article.getArticlesIndex(function (err, doc) {
                if (err) {
                    defer(err);
                } else if (doc) {
                    redis.articleCache.update(doc);
                    total[doc.status === -1 ? 'comments' : 'articles'] += 1;
                } else {
                    ccs.config.comments = total.comments;
                    ccs.config.articles = total.articles;
                    redis.articleCache.clearup();
                    console.log('redis cache rebuild success!');
                    defer(null, total.comments + total.articles);
                }
            });
        }).fail(errorHandler);
    },
    test: function () {
        return then(function (defer) {
            redis.testCache.removeAll(defer);
        }).then(function (defer) {
                var test = 0;
                ccs.dao.test.gettestIndex(function (err, doc) {
                    if (err) {
                        defer(err);
                    } else if (doc) {
                        redis.testCache.update(doc);
                        test += 1;
                    } else {
                        defer(null, test);
                    }
                });
            }).fail(errorHandler);
    },
    GET: function (req, res) {
        var that = this;
        then(function (defer) {
            if (req.session.role !== 5) {
                defer(ccs.Err(ccs.lib.msg.USER.userRoleErr));
            } else if (['user', 'tag', 'article', 'test'].indexOf(req.path[2]) >= 0) {
                that[req.path[2]].then(function (defer2, num) {

                    return res.sendjson(resJson(null, {
                        update: num
                    }));
                }).fail(defer);
            } else {
                defer(ccs.Err(ccs.lib.msg.MAIN.resetInvalid));
            }
        }).fail(res.throwError);
    }
};
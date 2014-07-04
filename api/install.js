'use strict';
/*global require, module, Buffer, ccs*/

var then = ccs.module.then,
    errorHandler = ccs.lib.tools.errorHandler;

module.exports = function () {
    var globalConfig;
    return then(function (defer) {
        ccs.dao.db.createCollection('global', {
            w: 1
        }, defer);
    }).then(function (defer, collection) {
        collection.ensureIndex({
            _id: -1
        }, {
            background: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.index.initGlobalConfig(defer);
    }).then(function (defer,err,config) {
        globalConfig = config;
        ccs.dao.db.createCollection("articles", {
            w: 1
        }, defer);
    }).then(function (defer, collection) {
        collection.ensureIndex({
            _id: -1
        }, {
            background: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.command({
            collMod: "articles",
            usePowerOf2Sizes: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.createCollection("collections", {
            w: 1
        }, defer);
    }).then(function (defer, collection) {
        collection.ensureIndex({
            _id: -1
        }, {
            background: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.command({
            collMod: "collections",
            usePowerOf2Sizes: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.createCollection("messages", {
            w: 1
        }, defer);
    }).then(function (defer, collection) {
        collection.ensureIndex({
            _id: -1
        }, {
            background: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.command({
            collMod: "messages",
            usePowerOf2Sizes: true
        }, defer);
    }).then(function (defer) {
            ccs.dao.db.createCollection("test", {
                w: 1
            }, defer);
        }).then(function (defer, collection) {
            collection.ensureIndex({
                _id: -1
            }, {
                background: true
            }, defer);
        }).then(function (defer) {
            ccs.dao.db.command({
                collMod: "test",
                usePowerOf2Sizes: true
            }, defer);
        }).then(function (defer) {
        ccs.dao.db.createCollection("tags", {
            w: 1
        }, defer);
    }).then(function (defer, collection) {
        collection.ensureIndex({
            _id: -1
        }, {
            background: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.command({
            collMod: "tags",
            usePowerOf2Sizes: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.createCollection("users", {
            w: 1
        }, defer);
    }).then(function (defer, collection) {
        collection.ensureIndex({
            _id: -1
        }, {
            background: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.db.command({
            collMod: "users",
            usePowerOf2Sizes: true
        }, defer);
    }).then(function (defer) {
        ccs.dao.user.setNewUser({
            _id: ccs.dao.user.convertID('Uadmin'), // 超级管理员的用户Uid，请勿修改
            name: 'admin', // 超级管理员的用户名，请勿修改
            email: 'admin@ccs.org', // 超级管理员的邮箱，请自行修改
            passwd: ccs.lib.tools.SHA256('admin@ccs.org'), // 超级管理员的初始密码，请自行修改
            role: 5, // 超级管理员最高权限，请勿修改
            avatar: ccs.lib.tools.gravatar('admin@ccs.org'), // 超级管理员的gravatar头像，请自行修改
            desc: '基于社交圈子的营销管理系统 By joe' // 超级管理员的个人简介，请自行修改
        }, defer);
    }).then(function (defer) {
            ccs.dao.test.setNewtest({
                _id: 0,
                a: '1',
                b: '2',
                c: '3'
            }, defer);
        }).then(function (defer) {
        defer(null, globalConfig);
    }).fail(errorHandler);
};
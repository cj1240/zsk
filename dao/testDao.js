'use strict';
/*global require, module, Buffer, ccs*/

/*
用户数据 mongodb 访问层
convertID(id); 用户显示Uid与MongoDB内部_id之间的转换;
getUsersNum(callback); 获取用户总数量;
getUsersIndex(callback); 获取所有用户的{_id:_id,name:name,email:email}，用于内存缓存以便快速索引;
getLatestId(callback); 获取最新注册用户的_id;
getAuth(_id, callback); 根据_id获取对应用户的认证数据;
getSocial(_id, callback); 根据_id获取对应用户的社交媒体认证数据（weibo\qq\google\baidu）;
getUserInfo(_id, callback); 根据_id获取对应用户详细信息;
setUserInfo(userObj, callback); 批量设置用户信息;
setLoginAttempt(userObj); 记录用户尝试登录的次数（未成功登录）;
setLogin(userObj); 记录用户成功登录的时间和IP;
setSocial(userObj, callback); 设置用户的社交媒体认证数据
setFans(userObj); 增加或减少用户粉丝;
setFollow(userObj, callback); 增加或减少用户关注对象;
setArticle(userObj, callback); 增加或减少用户主题;
setCollection(userObj, callback); 增加或减少用户合集;
setMark(userObj, callback); 增加或减少用户收藏;
setMessages(userObj); 增加或重置用户未读信息;
setReceive(userObj); 增加或减少用户接收的消息;
setSend(userObj); 增加或减少用户发送的消息;
setNewUser(userObj, callback); 注册新用户;
*/
var union = ccs.lib.tools.union,
    intersect = ccs.lib.tools.intersect,
    UIDString = ccs.lib.json.UIDString,
    defauttest = ccs.lib.json.test,
    callbackFn = ccs.lib.tools.callbackFn,
    wrapCallback = ccs.lib.tools.wrapCallback,
    converter = ccs.lib.converter;

var that = ccs.dao.db.bind('test', {

    getLatestId: function (callback) {
        callback = callback || callbackFn;
        that.findOne({}, {
            sort: {
                _id: -1
            },
            hint: {
                _id: 1
            },
            fields: {
                _id: 1
            }
        }, callback);
    },
    gettestIndex: function (callback) {
        callback = callback || callbackFn;
        that.find({}, {
            sort: {
                _id: -1
            },
            hint: {
                _id: 1
            },
            fields: {
                _id: 1,
                a: 1,
                b: 1,
                c: 1
            }
        }).each(callback);
    },
    setNewtest: function (messageObj, callback) {

        var message = union(defauttest),
            newMessage = union(defauttest);
        callback = callback || callbackFn;

        newMessage = intersect(newMessage, messageObj);
        newMessage = union(message, newMessage);
        /*
        that.insert(
            newMessage, {
                w: 1
            }, wrapCallback(callback));*/

        that.getLatestId(function (err, doc) {
            if (err) {
                return callback(err, null);
            }
            if (!doc) {
                newMessage._id = 1;
            } else {
                newMessage._id = doc._id + 1;
            }

            that.findAndModify({
                _id: newMessage._id
            }, [], newMessage, {
                w: 1,
                upsert: true,
                new: true
            }, wrapCallback(callback));
        });

    }
});

module.exports = {
    gettestIndex: that.gettestIndex,
    setNewtest: that.setNewtest
};
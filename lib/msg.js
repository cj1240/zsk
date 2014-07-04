'use strict';
/*global require, module*/

module.exports = {
    MAIN: {
        err: '错误提示',
        dbErr: '数据库错误',
        registerClose: '暂时关闭注册，请稍后再来！',
        globalDomainErr: '域名错误',
        globalUrlErr: '网站网址错误',
        globalEmailErr: '管理员Email错误',
        requestDataErr: '请求数据错误',
        requestOutdate: '请求数据已过期',
        requestSent: '请求成功，验证链接已发送到您的邮箱，有效期24小时，请及时验证！',
        resetInvalid: '请求无效',
        resetOutdate: '请求已过期',
        timeIntervalErr: '操作太快啦，休息几秒再来'
    },
    USER: {
        UidNone: '用户Uid不存在',
        userNone: '用户不存在',
        userNameNone: '用户名不存在',
        userNameErr: '用户名格式错误',
        userNameExist: '用户名已存在',
        userEmailNone: 'Email不存在',
        userEmailErr: 'Email格式错误',
        userEmailExist: 'Email已存在',
        userEmailNotMatch: 'Email与用户名不匹配',
        userPasswd: '密码错误',
        userNeedLogin: '需要登录才能操作',
        userLocked: '用户已被锁定',
        userRoleErr: '权限不够',
        userRole0: '您已被禁言！',
        userFollowed: '已关注！',
        userUnfollowed: '已取消关注',
        userMarked: '已标记',
        userUnmarked: '已取消标记',
        userFavor: '已支持',
        userUnfavor: '已取消支持',
        userOppose: '已反对',
        userUnoppose: '已取消反对',
        loginAttempts: '登录失败超过5次，用户被锁定',
        logNameErr: '该用户不存在，请使用用户名、用户邮箱或用户UID登录',
    },
    TAG: {
        tagNone: '标签不存在'
    },
    ARTICLE: {
        articleNone: '文章不存在',
        articleDisplay1: '文章已屏蔽',
        articleDisplay2: '文章已删除',
        articleMinErr: '内容太短了',
        titleMinErr: '标题太短了'
    },
    MESSAGE: {
        at: '(%userName)[%userUrl] 在 (%articleTitle)[%articleUrl] 中提到了你',
        reply: '(%userName)[%userUrl] 在 (%articleTitle)[%articleUrl] 中回复了你',
        mark: '(%userName)[%userUrl] 收藏了你的文章 (%articleTitle)[%articleUrl]',
        favor: '(%userName)[%userUrl] 支持了你的文章 (%articleTitle)[%articleUrl]',
        oppose: '(%userName)[%userUrl] 反对了你的文章 (%articleTitle)[%articleUrl]',
        follow: '(%userName)[%userUrl] 关注了你',
        message: '(%userName)[%userUrl] 给你发来了新消息 (%articleTitle)[%articleUrl]',
        edit: '%role (%userName)[%userUrl] 编辑了你的文章 (%articleTitle)[%articleUrl]',
        hide: '%role (%userName)[%userUrl] 屏蔽了你的文章 (%articleTitle)[%articleUrl]，内容不合要求，请重新编辑再提交',
        remove: '%role (%userName)[%userUrl] 删除了你的文章 (%articleTitle)[%articleUrl]，内容太水啦',
    }
};
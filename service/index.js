/**
 * Created by jason on 2017/12/20.
 */

const co = require("zco");

const crawler = require("../crawler");

/**
 * 处理初始化
 * */
function init() {
    return co.brief(function *() {
       let success = yield crawler.init();
       return {
           "success":success,
           "msg":success?"初始化成功":"初始化失败",
           "qr_config":success ? this.ctx.session.qr_config:null
       };
    });
}
/**
 * 初始状态查询
 * */
function processStatus() {
    return co.brief(function *() {
       return yield crawler.processStatus();
    });
}

/**
 * 查询爬取结果
 * */
function queryResult() {
    return co.brief(function *() {

    })
}

exports.init = init;
exports.processStatus = processStatus;

exports.query = queryResult;
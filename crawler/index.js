/**
 * Created by jason on 2017/12/20.
 */
const co = require("zco");
const request = require("../utils/request");
const cheerio = require("cheerio");

/**
 * 初始化扫码登陆：
 *  1.初始化cookie
 *  2.获得二维码的初始化参数
 *  @return {Boolean}
 *  @api public
 * */
function init() {
    return co.brief(function *() {
        let opt = {
            "url":'https://auth.alipay.com/login/homeB.htm?redirectType=parent',
            "method":"GET",
            "headers":{
                "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                "Connection":"keep-alive",
                "Host":"auth.alipay.com",
                "Upgrade-Insecure-Requests":"1",
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
            },
            "gzip":true
        };

        let [_,body] = yield request(opt);

        let pattern = /s\.barcode\s*,\s*(\{[^\}]*)/;
        let matcher = pattern.exec(body.toString());
        if(matcher){
            /**
             * 解析出二维码的参数,将结果存放到此次授权的上下文
             * */
            let config = Function("return "+matcher[1]+"};")();
            this.ctx.session = this.ctx.session || {};
            this.ctx.session.qr_config = {};

            this.ctx.session.qr_config.text = config.barcode;
            this.ctx.session.qr_config.size = config.size;
            this.ctx.session.qr_config.imageSize = config.imageSize;
            this.ctx.session.qr_config.image = config.image;
            this.ctx.session.qr_config.correctLevel = config.correctLevel;

            this.ctx.session.securityId = config.securityId;

            let $ = cheerio.load(body.toString());

            let inputs = $("form[name=loginForm] input");

            let loginForm = {};

            for(let i =0;i<inputs.length;i++){
                let name = $(inputs[i]).attr("name");
                if(name){
                    loginForm[name] = $(inputs[i]).attr("value");
                }
            }

            this.ctx.session.loginForm = loginForm;

            return true;
        }

        return false;

    });
}

/**
 * 抓取账户信息
 * @return {Object} userinfo
 * @api private
 * */
function parse() {
    return co.brief(function *() {
        /**
         * 扫码成功还需要几个请求来完成登陆
         *
         * */
        let opt = {
            "url":"https://authem14.alipay.com/login/homeB.htm",
            "method":"POST",
            "headers":{
                "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                "Cache-Control":"max-age=0",
                "Connection":"keep-alive",
                "Content-Type":"application/x-www-form-urlencoded",
                "Host":"authem14.alipay.com",
                "Origin":"https://auth.alipay.com",
                "Referer":"https://auth.alipay.com/login/homeB.htm?redirectType=parent",
                "Upgrade-Insecure-Requests":"1",
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
            },
            "form":this.ctx.session.loginForm,
            "gzip":true,
            "followRedirect":false
        };

        let [res,body] = yield request(opt);

        let Max = 10;

        while (true){
            if( !res.headers.location || Max <0){
                break;
            }

            Max --;
            opt = {
                "url":res.headers.location,
                "method":"GET",
                "headers":{
                    "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Encoding":"gzip, deflate, br",
                    "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                    "Cache-Control":"max-age=0",
                    "Connection":"keep-alive",
                    "Referer":"https://auth.alipay.com/login/homeB.htm?redirectType=parent",
                    "Upgrade-Insecure-Requests":"1",
                    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
                },
                'gzip':true
            };

            [res,body] = yield request(opt);
        }

        let url_pattern = /location\.href\s*=\s*['"]([^'^"]*)/;
        let token_pattern = /['"]*token['"]*\s*:\s*['"]([^'^"]*)/;
        let redirect_url = null;
        let token = null;
        let matcher = url_pattern.exec(body);
        if(matcher){
            redirect_url = matcher [1];
        }else {
           throw new Error("Unexpected Response");
        }
        matcher = token_pattern.exec(body);

        if(matcher){
            token = matcher[1];
        }else{
            throw new Error("Unexpected Response");
        }

        opt = {
             "url":"https://passport.alibaba.com/mini_apply_st.js?token="+token+"&site=1&_input_charset=utf-8&r="+Date.now()+"&callback=arale.cache.callbacks.jsonp2",
             "method":"GET",
             "headers":{
                  "Accept":"*/*",
                  "Accept-Encoding":"gzip, deflate, br",
                 "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                  "Connection":"keep-alive",
                 "Host":"passport.alibaba.com",
                  "Referer":"https://authem14.alipay.com/login/loginResultDispatch.htm",
                  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
             },
             'gzip':true
         };

        [res,body] = yield request(opt);

        opt = {
            "url":redirect_url,
            "method":"GET",
            "headers":{
                "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                "Connection":"keep-alive",
                "Referer":"https://authem14.alipay.com/login/loginResultDispatch.htm",
                "Upgrade-Insecure-Requests":"1",
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
            },
            "gzip":true
        };

        [res,body] = yield  request(opt);

        Max = 10;
        while (true){
            if( !res.headers.location || Max <0){
                break;
            }

            Max --;
            opt = {
                "url":res.headers.location,
                "method":"GET",
                "headers":{
                    "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Encoding":"gzip, deflate, br",
                    "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                    "Cache-Control":"max-age=0",
                    "Connection":"keep-alive",
                    "Referer":"https://authem14.alipay.com/login/loginResultDispatch.htm",
                    "Upgrade-Insecure-Requests":"1",
                    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
                },
                'gzip':true
            };

            [res,body] = yield request(opt);
        }
        /**
         * 登陆成功会跳到主页，可以拿到相关的账户信息，下面是解析账户信息
         * */
        let $ = cheerio.load(body.toString());

        let name = $(".userName a").attr("title");



        let account = $("#J-userInfo-account-userEmail").attr("title");

        let assets = $(".i-assets-container");

        let balance ,huabei_available,huabei_total , yuebao ;

        for(let i=0;i<assets.length;i++){

            if($(assets[i]).text().indexOf("账户余额")>-1){
                let account = $(".amount",assets[i]);

                if(account && account.length >0){
                    balance = $(account).text();

                }
            }
            if($(assets[i]).text().indexOf("花呗")>-1){
                let account = $(".amount",assets[i]);
                if(account && account.length >1){
                    huabei_available = $(account[0]).text();
                    huabei_total = $(account[1]).text();
                }
            }
            if($(assets[i]).text().indexOf("余额宝")>-1){
                let account = $(".amount",assets[i]);
                if(account && account.length >0){
                    yuebao = $(account[0]).text();
                }
            }
        }
        return {
            "name":name,
            "account":account,
            "balance":balance,
            "huabei_available":huabei_available,
            "huabei_total":huabei_total,
            "yuebao":yuebao
        };
    });
}

/**
 * 查询二维码状态
 * @return {Mixed}
 * @api public
 * */
function processStatus() {
    return co.brief(function *() {
        let opt = {
            "url":"https://securitycore.alipay.com/barcode/barcodeProcessStatus.json?securityId="+encodeURIComponent(this.ctx.session.securityId)+"&_callback=callback",
            "method":"GET",
            "headers":{
                "Accept":"*/*",
                "Accept-Encoding":"gzip, deflate, br",
                "Accept-Language":"zh-CN,zh;q=0.9,en;q=0.8",
                "Connection":"keep-alive",
                "Host":"securitycore.alipay.com",
                "Referer":"https://auth.alipay.com/login/homeB.htm?redirectType=parent",
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36"
            },
            "gzip":true
        };

        let [_,body] = yield request(opt);
        let pattern = /callback\(([^\)]*)/;
        let matcher = pattern.exec(body.toString());
        if(matcher){
            let result = JSON.parse(matcher[1]);

            if(result.barcodeStatus === "confirmed"){

               let userInfo =  yield parse();

               return {
                   "stat":"success",
                   "userInfo":userInfo
               };
            }
            return result;
        }
        return null;
    });
}



exports.init = init;
exports.processStatus = processStatus;
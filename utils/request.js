/**
 * Created by jason on 2017/12/20.
 */
const co = require("zco");
const request = require("request");
const Cookie = require("./cookie");


/**
 * 新的设计，将cookie管理对象放到上下文里
 * @param {Object} option (request option)

 * @retrun {Array} [res,content]
 * @api public
 * */
const request_proxy = function (option) {
    return co(function *(resume) {

        if(!this.ctx.cookieStore){

            if(option.headers && (option.headers.Cookie || option.headers.cookie)){
                this.ctx.cookieStore = Cookie.init((option.headers.Cookie || option.headers.cookie));
            }else{
                this.ctx.cookieStore = Cookie.init();
            }
        }


        if (option.headers ) {
            /**
             * 带上cookie
             * */
            option.headers.Cookie = this.ctx.cookieStore.toString();
        }


        let err,res,body;

        /**
         * 如果失败则重试
         * */
        for(let i=0;i<2;i++){


            [err,res,body] = yield request(option,resume);

            if(err){
                yield setTimeout(resume,100);
            }else{
                break;
            }
        }

        if (err) {

            throw err;
        }
        /**
         * 更新cookie
         * */
        this.ctx.cookieStore.merge(res.headers);


        return [res,body];

    });
};

module.exports = request_proxy;
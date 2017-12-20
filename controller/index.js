/**
 * Created by jason on 2017/12/20.
 */
const co = require("zco");
const db = require("../db");
const uuid = require("uuid/v4");
const Cookie = require("../utils/cookie");

/**
 * 包装请求句柄，提供公共的上下文处理逻辑
 * */

function wrap(handler) {
    return function (req,res) {
        co.brief(function *() {

            if(req.query.id){
                this.ctx.session =  db.session.findOne({"transaction_id":req.query.id});
                this.ctx.cookieStore = Cookie.init(this.ctx.session.cookie);
            }else{
                this.ctx.session = {};
                this.ctx.session.transaction_id  = uuid();
                this.ctx.cookieStore = Cookie.init();
            }

            let result = yield handler();

            result.tran_id = this.ctx.session.transaction_id;
            /**
             * 更新cookie 到session
             * */
            this.ctx.session.cookie = this.ctx.cookieStore.toString();

            db.session.update({"transaction_id":result.tran_id},this.ctx.session,{ multi:false,upsert:true});

            return result;
        })(function (err,response) {
            if(err){
                console.log(err.stack);
                response = {
                    "success":false,
                    "msg":err.message
                };
            }
            try{
                res.json(response);
            }catch (e){}
        })
    }
}

exports.wrap = wrap;
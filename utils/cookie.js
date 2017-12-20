/**
 * Created by jason on 2017/12/20.
 */
/**
 * 简单的cookie管理工具，
 * init方法可接受一个http返回的header对象，返回一个cookie对象,该cookie对象有merge方法，接收一个header，toString方法，get方法取对应的一个cookie的值
 *
 * */
let parseCookieInHeader=function (headers) {
    let cookies=headers["set-cookie"];

    if(cookies){
        var  obj={};
        for(var  i=0;i<cookies.length;i++){
            var kv=cookies[i].split(";")[0];
            var index=kv.indexOf("=");
            if(index>0){
                obj[kv.slice(0,index)]=kv.slice(index+1,kv.length);
            }
        }
        return obj;
    }
    return {};
};
let toStr=function () {
    let self=this;
    let str="";
    for(var p in self){
        if("[object String]"===Object.prototype.toString.call(self[p]) && p != ""){
            str+=p+"="+self[p]+";";
        }
    }
    return str.substring(0,str.length-1);
};
let get=function (key) {
    return this[key];
};

let set=function (key,value) {
    this[key]=value;
};
let del = function (key) {
    delete  this[key];
};
let merge=function (headers) {
    let self=this;

    let cookies=parseCookieInHeader(headers);
    for(var p in cookies){
        self[p]=cookies[p];
    }

    return self;
};

let init=function (initData) {
    let obj={
        "toString":toStr,
        "merge":merge,
        "get":get,
        "set":set,
        "del":del
    };
    if("[object Object]"===Object.prototype.toString.call(initData)){
        obj.merge(initData);
    }
    if("[object String]"===Object.prototype.toString.call(initData)){
        obj.merge({
            "set-cookie":initData.split(";")
        });
    }
    return obj;
};

exports.init=init;


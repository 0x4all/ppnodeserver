var protocol = require("./pomelo-protocol");
var coder = require("./commands/coder");
var Package = protocol.Package;

var plugin = function(){
    this.coder = new coder();
};

module.exports = function(){
    return new plugin();
};

plugin.prototype.message_handler =  function(message, next){
    var pkg = message.data;
    console.log("message enter:");
    this.coder.decode(pkg,function(data){
        message.data = data;
        console.log("message decoded:")
        next();
    });
}

/**
 * 
 * @param {{msg:string,opts:Object}}} data 发送的数据对象
 * @param {function} next 
 */
plugin.prototype.send_handler =  function(data, next){
    console.log("message send:",data.msg);
    var ptype = Package.TYPE_DATA;
    if(data.opts && data.opts.ptype) {
        ptype = data.opts.ptype;
    }
    if(ptype == Package.TYPE_DATA) {
        //非正常逻辑，notify不应该有机会走导致:
        // push 没有msgid，response 有msgid；
        if(!data.opts.msgid && !data.opts.isPush) { //notify: 没有msgid，不需要回复
            console.warn("illegal notify! notify should not response message.");
            next();
            return;
        }
        //response, push;
        //dict process,protobuf process.
        this.coder.encode(data.opts.msgid,data.opts.msgroute, data.msg ,function(msg){
            data.msg = msg;
            console.log("message encoded:");
            next();
            return;
        });
    }
    else{
        next();
    }
}


plugin.prototype.config = function(conf) {
    this.coder.config(conf);
}
var protocol = require("./pomelo-protocol");
var Handshake = require("./commands/handshake")
var Package = protocol.Package;

var plugin = function(){
    this._configs = {};
    this.handshake = new Handshake();
};
module.exports = function(){
    return new plugin();
};
plugin.prototype.message_handler =  function(message, next){
    var pkg = message.data;
    console.log("handshake: enter");
    if(pkg.type === Package.TYPE_HANDSHAKE) {
        var body = JSON.parse(protocol.strdecode(pkg.body));
        //接受客户端的版本数据 ，将服务器 的proto等协议配置信息发送给客户端
        console.log("handshake:",body);
        this.handshake.process(message.connection.socket,body);
        return;
    }
    else if(pkg.type == Package.TYPE_HANDSHAKE_ACK) {
        console.log("handshake ack:");
        message.connection.ack = true;
        pkg.type = Package.TYPE_HEARTBEAT; // 执行一次心跳
        next();
        return;
    }
    next();
}

/**
 * 将需要和客户端交换的数据配置进来
 * protos
 * dicts
 * heartbeat
 * checkClient: 客户端版本配置
 * useCrypto
 */
plugin.prototype.config = function(configs) {
    this._configs = configs;
    this.handshake.config(configs);
}

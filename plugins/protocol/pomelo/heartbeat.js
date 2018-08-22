var protocol = require("./pomelo-protocol");
var Heartbeat = require("./commands/heartbeat")
var Package = protocol.Package;
var plugin = function() {
    this.heartbeat = new Heartbeat();
};

module.exports = function(){
    return new plugin();
};


plugin.prototype.message_handler =  function(message, next){
    var pkg = message.data;
    console.log("heartbeat enter:",pkg.type)
    if(pkg.type == Package.TYPE_HEARTBEAT) {
        console.log("heartbeat: received.")
        //接受客户端的版本数据 ，将服务器 的proto等协议配置信息发送给客户端
        this.heartbeat.process(message.connection.socket);
        return;
    }
    next();
}

/**
 * 将需要和客户端交换的数据配置进来
 * timeout:
 * heartbeat:
 * disconnectOnTimeout
 * @param {HeartBeatConfig} configs
 */
plugin.prototype.config = function(configs) {
    this.heartbeat.config(configs);
}

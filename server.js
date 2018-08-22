var server = require("tcpserver");
var pomelo = require("./plugins/protocol/pomelo");
var plugins = server.plugins;

var tcpserver = function(port, host, opts){
    if(!(this instanceof tcpserver)) {
        return new tcpserver(port, host, opts);
    }
    opts = opts || {};
    opts.checkPkgHeader = pomelo.util.checkPkgHeader;
    this.server = server(port,host,opts);
    this._setup_server();
}

module.exports = tcpserver;

tcpserver.prototype.route = function(svcname,svc){
    this.router.route(svcname, svc);
}

tcpserver.prototype.blockip = function(ip) {
    this.ipblocker.config(ip);
}

tcpserver.prototype.start = function(){
    this.error((err, next) => {
        console.log("error:", err)
        next();
    });

    this.server.start();
}

tcpserver.prototype.error = function(errhandler){
    this.server.error(errhandler);
}

tcpserver.prototype._setup_server = function() {
    var server = this.server;
    this.blocker = plugins.ipblocker();
    this.session = plugins.session();
    this.package = pomelo.package();
    this.message = pomelo.message();
    this.heartbeat = pomelo.heartbeat();
    this.handshake = pomelo.handshake();
    this.router = pomelo.router();

    this.blocker.config("192.168.1.1");
    server.connection(this.blocker.connection_handler.bind(this.blocker));
    


    //使用pomelo的协议decode 数据
    server.message(this.package.message_handler.bind(this.package));

    var config = {
        heartbeat:3,
        checkClient: (clientType,version)=>{ console.log("client from:",clientType, version); return true;},
    }
    this.handshake.config(config)
    server.message(this.handshake.message_handler.bind(this.handshake));

    this.heartbeat.config({heartbeat:config.heartbeat});
    server.message(this.heartbeat.message_handler.bind(this.heartbeat));

    //建立session
    server.message(this.session.message_handler.bind(this.session));
    //attach session.push() method;
    var push = pomelo.push();
    server.message(push.message_handler.bind(push));

    //正常消息解码
    server.message(this.message.message_handler.bind(this.message));
    //消息分发，路由
    server.message(this.router.message_handler.bind(this.router));

    server.send(this.message.send_handler.bind(this.message));
    //使用pomelo的协议encode 数据
    server.send(this.package.send_handler.bind(this.package));

}

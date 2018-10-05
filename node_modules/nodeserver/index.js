/**
 * 提供长连接服务
 * 1. 管理handlers
 * 2. 处理消息
 * 3. 处理黑名称
 * 
 */

var Acceptor = require("./acceptor");
var xutil = require("./util/util");

var tcpserver = function(port, host, opts) {
   return new server(port, host, opts);
}

module.exports = tcpserver;

tcpserver.plugins = {};
tcpserver.plugins.session = require("./plugin/session");
tcpserver.plugins.ipblocker = require("./plugin/ipblocker");


var server = function(port, host, opts) {
   this._connectionHandlers = []; // <servicename. => handler.js>
   this._packageHandlers = [];
   this._messageHandlers = []; //接受connection，接受消息，构建session，触发消息，处理handler
   this._sendHandlers = [];
   this._errorHandlers = [];
   this._routeHandlers = {}; //消息路由 service name/ service

   this._acceptor = new Acceptor(port, host, opts);
   this._acceptor.on("connection", _handle_connection.bind(null,this));
   this._acceptor.on("error",_handle_error.bind(null,this));
}

server.prototype.route = function(servicename, service) {
    if(!handler) {
        return;
    }
    this._routeHandlers[servicename] = service;
}


/**
 * 为当前server的connection阶段添加插件
 * @param {Object} handler 
 */
server.prototype.connection = function(handler) {
    if(!handler) {
        return;
    }
    this._connectionHandlers.push(handler);
}

/**
 * 为当前server收到数据包的阶段添加插件：对应data事件
 * @param {(data:Buffer,next:Function)=>void} handler 
 */
server.prototype.package = function(handler) {
    if(!handler) {
        return;
    }
    this._packageHandlers.push(handler);
}

/**
 * 为当前server的 收到消息 阶段添加插件
 * @param {(message:Buffer|String, next:(err)=>void )=>void} handler 
 */
server.prototype.message = function(handler) {
    if(!handler) {
        return;
    }
    this._messageHandlers.push(handler);
}

/**
 * 添加当前server出现error阶段的处理插件
 * @param {(error:Object, next:Function)=>void} handler 处理错误的handler
 */
server.prototype.error = function(handler) {
    if(!handler) {
        return;
    }
    this._errorHandlers.push(handler);
}
/**
 * 为当前server的 发送消息 阶段添加插件, 添加到建立好的socket连接上，在socket发生send的时候，先处理handler后在send
 * @param {Object} handler 
 */
server.prototype.send = function(handler) {
    if(!handler) {
        return;
    }
    this._sendHandlers.push(handler);
}

/**
* @param {Number} port 端口号
*/
server.prototype.start = function() {
   this._acceptor.start();
}

/**
 * 
 */
server.prototype.stop = function() {
    this._acceptor.stop();
    this._sendHandlers = [];
    this._messageHandlers =[];
    this._connectionHandlers = [];
 }

var _handle_connection = function(_this, socket) {
    var connection = {socket};
    // console.debug("connected.",_this, socket, _this._connectionHandlers);
    xutil.foreachhandler(_this._connectionHandlers, connection,(err)=>{
        //为connection的消息处理添加 handler
        socket.on("message",(data)=>{
            var message = {connection, data};
            _handle_message(_this, message);
        });
        var _socket_send = socket.send.bind(socket);
        socket.send = (msg, opts, cb) => {
            _handle_send(_this, {msg,opts}, function(data){
                _socket_send(data,null, cb);
            });
        }
    })
}

/**
 * 处理来自客户端的消息
 * 1. doHandle: 找到对应的handle，处理消息
 * 2. response：将处理消息的结果反馈给客户端
 * 3. handleError：处理过程中产生了错误，errhandler
 * @param {Object} session 
 * @param {Object} message 消息
 * @param {Function} cb 
 */
var _handle_message = function(_this, message) {
    xutil.foreachhandler(_this._messageHandlers, message, (err)=>{
        console.log("message handled.")
    })
}

var _handle_error = function(_this, err) {
    xutil.foreachhandler(_this._errorHandlers, err, (err)=>{
    })
}


var _handle_send = function(_this, _data, cb) {
    var data = _data;
    xutil.foreachhandler(_this._sendHandlers, data, (err)=>{
        if(err) {
            console.warn("send handle message failed.",err)
            return;
        }
        console.log("message send complete.",data.msg)
        cb(data.msg);
    })
}
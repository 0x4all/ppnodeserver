/**
 * 提供构建session的插件
 * Session就是保持 在socket的绑定的信息
 * 1. 在接受到 connection的过程中， 建立session
 * 2. 保存session，下次可以用socketid来查询session
 */

 var SessionManager = require("./lib/mgr");

 var plugin = function() {
   this.sessionManager = new SessionManager();
 };
 module.exports = function(){
   return new plugin();
 };

 plugin.prototype.connection_handler = function(connection, next){
    var socket = connection.socket;
    var sid = socket.id;
    var session = this.sessionManager.get(sid);
    if (session) {
      next();
      return;
    }
    session = this.sessionManager.createSession(socket);
    connection.session = session;
    console.debug("session created.")
    next();
 }

 // 建立握手后，在创建session
 plugin.prototype.message_handler = function(message, next){
  var connection = message.connection;
  var ack = connection.ack;
  if(ack && !connection.session) {
    var socket = connection.socket;
    var sid = socket.id;
    var session = this.sessionManager.get(sid);
    if (session) {
      connection.session = session;
      next();
      return;
    }
    session = this.sessionManager.createSession(socket);
    connection.session = session;
    console.debug("session created.")
    message.connection.ack = false;
  }

  next();
}

  
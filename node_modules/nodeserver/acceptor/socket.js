var util = require('util');
var EventEmitter = require('events').EventEmitter;

var ST_INITED = 0;
var ST_CLOSED = 1;

/**
 * Socket class that wraps socket and websocket to provide unified interface for up level.
 * TCPSocket 通过封装读包逻辑，将每个package读出来后再抛出来，
 * 使得和websocket的行为一致，抛到上层都是1个完整的包
 * properties:
 *    
 * methods:
 *    send(msg,cb): 通过原生socket发送数据
 *    disconnect(); 关闭原生socket，触发disconnect事件
 * events：
 *    disconnect: socket 关闭了
 *    error: socket error:
 *    message: 收到 message消息:
 */
var Socket = function(id, socket) {
  EventEmitter.call(this);
  this.id = id;
  this.socket = socket;

  if(!socket._socket) { //websocket server 的socket
    this.remoteAddress = {
      ip: socket.address().address,
      port: socket.address().port
    };
  } else { //tcp server 的 socket
    this.remoteAddress = {
      ip: socket._socket.remoteAddress,
      port: socket._socket.remotePort
    };
  }

  socket.once('close', this.emit.bind(this, 'disconnect'));
  socket.on('error', this.emit.bind(this, 'error'));
  socket.on('message', (data)=> {
    // console.debug(data);
    this.emit('message',data);
  });

  this.state = ST_INITED;
};

util.inherits(Socket, EventEmitter);

module.exports = Socket;


/**
 * Send message to client no matter whether handshake.
 * @api private
 */
Socket.prototype.send = function(msg, opts, cb) {
  if(this.state === ST_CLOSED) {
    return;
  }
  this.socket.send(msg, {binary: true},cb);
};


/**
 * Close the connection.
 *
 * @api private
 */
Socket.prototype.disconnect = function() {
  if(this.state === ST_CLOSED) {
    return;
  }
  this.state = ST_CLOSED;
  this.socket.emit('close');
  this.socket.close();
};
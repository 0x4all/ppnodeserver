var EventEmitter = require('events').EventEmitter;
var util = require('util');
var TcpSocket = require('./tcpsocket');

var ST_STARTED = 1;
var ST_CLOSED = 2;

// private protocol, no need exports

/**
 * websocket protocol processor
 */
var Processor = function(opts) {
  EventEmitter.call(this);
  this.closeMethod = opts.closeMethod;
  this.checkPkgHeader = opts.checkPkgHeader;
  this.state = ST_STARTED;
};
util.inherits(Processor, EventEmitter);

module.exports = Processor;

Processor.prototype.add = function(socket, data) {
  if(this.state !== ST_STARTED) {
    return;
  }
  var tcpsocket = new TcpSocket(socket, {closeMethod: this.closeMethod, checkPkgHeader:this.checkPkgHeader});
  this.emit('connection', tcpsocket);
  socket.emit('data', data);
};

Processor.prototype.close = function() {
  if(this.state !== ST_STARTED) {
    return;
  }
  this.state = ST_CLOSED;
};
var Stream = require('stream');
var util = require('util');

var HEAD_SIZE = 4;

/**
 * Work states
 */
var ST_HEAD = 1;      // wait for head
var ST_BODY = 2;      // wait for body
var ST_CLOSED = 3;    // closed

/**
 * Tcp socket wrapper with package compositing.
 * Collect the package from socket and emit a completed package with 'data' event.
 * Uniform with ws.WebSocket interfaces.
 * 
 * 将data 事件转化为 message事件： 分包：： websocket已经做好了分包： 如果
 * events:
 *    message:
 *    close:
 *    error:
 *    end:
 *
 * @param {Object} socket origin socket from node.js net module
 * @param {Object} opts   options parameter.
 *                        opts.headSize size of package head
 *                        opts.headHandler(headBuffer) handler for package head. caculate and return body size from head data.
 */
var Socket = function(socket, opts) {
  if(!(this instanceof Socket)) {
    return new Socket(socket, opts);
  }

  if(!socket || !opts) {
    throw new Error('invalid socket or opts');
  }
  // stream style interfaces.
  // TODO: need to port to stream2 after node 0.9
  Stream.call(this);
  this.readable = true;
  this.writeable = true;

  this._socket = socket;
  this.headSize = HEAD_SIZE;
  this.headHandler = _headHandler;
  this.closeMethod = opts.closeMethod;
  this.checkPkgHeader = opts.checkPkgHeader || (()=>true);
  this.headBuffer = new Buffer(opts.headSize);

  this.headOffset = 0;
  this.packageOffset = 0;
  this.packageSize = 0;
  this.packageBuffer = null;

  // bind event form the origin socket
  this._socket.on('data', ondata.bind(null, this));
  this._socket.on('end', onend.bind(null, this));
  this._socket.on('error', this.emit.bind(this, 'error'));
  this._socket.on('close', this.emit.bind(this, 'close'));

  this.state = ST_HEAD;
};

util.inherits(Socket, Stream);

module.exports = Socket;

Socket.prototype.send = function(msg, encode, cb) {
  this._socket.write(msg, encode, cb);
};

Socket.prototype.close = function() {
  if(!!this.closeMethod && this.closeMethod === 'end') {
    this._socket.end();
  } else {
    try { 
      this._socket.destroy(); 
    } catch (e) {
      console.error('socket close with destroy error:', e.stack);
    }
  }
};

var ondata = function(socket, chunk) {
  if(socket.state === ST_CLOSED) {
    throw new Error('socket has closed');
  }

  if(typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
    throw new Error('invalid data');
  }

  if(typeof chunk === 'string') {
    chunk = new Buffer(chunk, 'utf8');
  }

  var offset = 0, end = chunk.length;

  while(offset < end && socket.state !== ST_CLOSED) {
    if(socket.state === ST_HEAD) {
      offset = readHead(socket, chunk, offset);
    }

    if(socket.state === ST_BODY) {
      offset = readBody(socket, chunk, offset);
    }
  }

  return true;
};

var onend = function(socket, chunk) {
  if(chunk) {
    socket._socket.write(chunk);
  }

  socket.state = ST_CLOSED;
  reset(socket);
  socket.emit('end');
};

/**
 * Read head segment from data to socket.headBuffer.
 *
 * @param  {Object} _this Socket instance
 * @param  {Object} data   Buffer instance
 * @param  {Number} offset offset read star from data
 * @return {Number}        new offset of data after read
 */
var readHead = function(_this, data, offset) {
  var hlen = _this.headSize - _this.headOffset;
  var dlen = data.length - offset;
  var len = Math.min(hlen, dlen);
  var dend = offset + len;

  data.copy(_this.headBuffer, _this.headOffset, offset, dend);
  _this.headOffset += len;

  if(_this.headOffset === _this.headSize) {
    // if head segment finished
    var size = _this.headHandler(_this.headBuffer);
    if(size < 0) {
      throw new Error('invalid body size: ' + size);
    }
    // check if header contains a valid type
    if(_this.checkPkgHeader(_this.headBuffer[0])) {
      _this.packageSize = size + _this.headSize;
      _this.packageBuffer = new Buffer(_this.packageSize);
      _this.headBuffer.copy(_this.packageBuffer, 0, 0, _this.headSize);
      _this.packageOffset = _this.headSize;
      _this.state = ST_BODY;
    } else {
      dend = data.length;
      console.error('close the connection with invalid head message, the remote:', _this._socket.remoteAddress, _this._socket.remotePort, data);
      _this.close();
    }

  }

  return dend;
};

/**
 * Read body segment from data buffer to socket.packageBuffer;
 *
 * @param  {Object} socket Socket instance
 * @param  {Object} data   Buffer instance
 * @param  {Number} offset offset read star from data
 * @return {Number}        new offset of data after read
 */
var readBody = function(socket, data, offset) {
  var blen = socket.packageSize - socket.packageOffset;
  var dlen = data.length - offset;
  var len = Math.min(blen, dlen);
  var dend = offset + len;

  data.copy(socket.packageBuffer, socket.packageOffset, offset, dend);

  socket.packageOffset += len;

  if(socket.packageOffset === socket.packageSize) {
    // if all the package finished
    var buffer = socket.packageBuffer;
    socket.emit('message', buffer);
    reset(socket);
  }

  return dend;
};

var reset = function(_this) {
  _this.headOffset = 0;
  _this.packageOffset = 0;
  _this.packageSize = 0;
  _this.packageBuffer = null;
  _this.state = ST_HEAD;
};


var _headHandler = function(headBuffer) {
  var len = 0;
  for(var i=1; i<HEAD_SIZE; i++) {
    if(i > 1) {
      len <<= 8;
    }
    len += headBuffer.readUInt8(i);
  }
  return len;
};


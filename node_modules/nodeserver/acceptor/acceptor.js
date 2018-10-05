var util  = require("util");
var net = require("net");
var tls = require("tls");
var EventEmitter = require('events').EventEmitter;
var Socket = require("./socket");
var WSProcessor = require("./processor/ws/wsprocessor");
var TCPProcessor = require("./processor/tcp/tcpprocessor");

var HTTP_METHODS = ["GET","POST","PUT","DELETE","HEAD"];
var STATE_INITED = 0;
var STATE_STARTED = 1;
var STATE_STOPED = 2;

var DEFAULT_TIMEOUT = 90;
var curId = 1;
/**
 * 接受 tcp或者websocket的连接
 * 
 * 1.在tcp层接收数据：
 * 2.如果发现是http数据，就将该socket转移到一个内部的websocketServer处理，进入websocket的处理机制
 * 3.将tcp连接的socket 和 websocket的 socket 合并到 新的抽象socket，在触发 connection
 * 
 * methods:
 *    start()
 *    stop();
 * 事件:
 *    connection:(socket)
 *    error:(error)
 * @param {Number} port 在该端口监听客户端连接
 * @param {String} host 当显式指定绑定ip的时候使用该host绑定
 * @param {Object} opts 其他配置项{{ssl:boolean,timeout:Number,setNoDelay:boolean,distinctHost:boolean,closeMethod:String,checkPkgHeader:Function}}
 */
var Acceptor = function(port, host, opts) {
  if (!(this instanceof Acceptor)) {
    return new Acceptor(port, host, opts);
  }
  EventEmitter.call(this);

  this.port = port;
  this.host = host;
  this.opts = opts;
  this.ssl = opts.ssl;
  this.timeout = (opts.timeout || DEFAULT_TIMEOUT) * 1000;
  this.setNoDelay = opts.setNoDelay;
  this.distinctHost = opts.distinctHost;

  // 创建server 实现，接受连接
  if(!this.ssl) {
    this.server = net.createServer();
    this.server.on('connection', _onAccept.bind(null,this));
    this.server.on("error",this.emit.bind(this,"error"));
  } else {
    this.server = tls.createServer(this.ssl);
    this.server.on('secureConnection', _onAccept.bind(null,this));
    this.server.on('clientError', function(e, tlsSo) {
      console.warn('an ssl error occured before handshake established: ', e);
      tlsSo.destroy();
    });
  }

  //转化为 hybird 连接
  this.wsprocessor = new WSProcessor();
  this.tcpprocessor = new TCPProcessor(opts);
  this.wsprocessor.on('connection', _onConnect.bind(null,this));
  this.tcpprocessor.on('connection',_onConnect.bind(null,this));

  this.state = STATE_INITED;
}

util.inherits(Acceptor, EventEmitter);

module.exports = Acceptor;


/**
 * 启动监听
 */
Acceptor.prototype.start = function() {
  if(this.state !== STATE_INITED) {
    return;
  }
  if(!!this.distinctHost) {
    this.server.listen(this.port, this.host);
  } else {
    this.server.listen(this.port);
  }

  console.log("acceptor listening on:", this.port)
  this.state = STATE_STARTED;
}

/**
 * 关闭服务
 */
Acceptor.prototype.stop = function() {
  if(this.state !== STATE_STARTED) {
    return;
  }
  this.state = STATE_STOPED;
  this.server.close();
  this.wsprocessor.close();
  this.tcpprocessor.close();
}

/**
 * 接受连接,区分http的数据和 tcp的数据
 * @param {Object} _this 
 * @param {Object} rawSocket 原生socket
 */
var _onAccept = function(_this, rawSocket) {
  if(_this.state !== STATE_STARTED) {
    return;
  }
  rawSocket.setTimeout(_this.timeout, function() {
     console.warn('connection is timeout without communication, the remote address:',rawSocket.remoteAddress, rawSocket.remotePort);
     rawSocket.destroy();
  });

  //第一次接收到数据的时候，确认connection，
  rawSocket.once('data', function(data) {
    console.log("data:",data.toString());
    // FIXME: handle incomplete HTTP method
    if(isHttp(data)) {
      _this.wsprocessor.add(rawSocket, data);
    } else {
      if(!!_this.setNoDelay) {
        rawSocket.setNoDelay(true);
      }
      _this.tcpprocessor.add(rawSocket, data);
    }
  });
};

/**
 * 将websocket和同化后的tcpsocket触发出去
 * @param {Acceptor} _this 
 * @param {TcpSocket|WebSocket}} _socket 
 */
var _onConnect = function(_this, _socket) {
    var socket = new Socket(curId++, _socket);
    _this.emit('connection', socket);
}

/**
 * 判断当前数据是否是http协议层的数据
 * @param {Buffer} data 
 */
var isHttp = function(data) {
  var head = data.toString('utf8', 0, 4);
  for(var i=0, l= HTTP_METHODS.length; i<l; i++) {
    if(head.indexOf(HTTP_METHODS[i]) === 0) {
      return true;
    }
  }
  return false;
};


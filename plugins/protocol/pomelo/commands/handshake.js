var Package = require('../pomelo-protocol').Package;

var CODE_OK = 200;
var CODE_USE_ERROR = 500;
var CODE_OLD_CLIENT = 501;

/**
 * Process the handshake request.
 *
 * @param {Object} opts option parameters
 *                      opts.handshake(msg, cb(err, resp)) handshake callback. msg is the handshake message from client.
 *                      opts.hearbeat heartbeat interval (level?)
 *                      opts.version required client level
 */
var Command = function() {};

module.exports = Command;

Command.prototype.config = function(opts) {
  opts = opts || {};
  this.opts = opts;
}

///{"sys":{"type":"js-websocket","version":"0.0.1"}}
Command.prototype.process = function(socket, msg) {
  if(!msg.sys) {
    processError(socket, CODE_USE_ERROR);
    return;
  }
  var config = this.opts;

  if(typeof config.checkClient === 'function') {
    if(!msg || !msg.sys || !config.checkClient(msg.sys.type, msg.sys.version)) {
      processError(socket, CODE_OLD_CLIENT);
      return;
    }
  }


  //heartbeat
  var sysOpts = { heartbeat : config.heartbeat };

  //dictionary: msg.route encode
  if(config.useDict) {
    var dictVersion = config.dictVersion;
    if(!msg.sys.dictVersion || msg.sys.dictVersion !== dictVersion){

      // may be deprecated in future
      sysOpts.dict = config.dict;

      sysOpts.routeToCode = config.dict;
      sysOpts.codeToRoute = config.abbrs;
      sysOpts.dictVersion = dictVersion; 
    }
    sysOpts.useDict = true;
  }

  //protobuf: msg.body encode
  if(config.useProtobuf) {
    var protoVersion = config.protoVersion;
    if(!msg.sys.protoVersion || msg.sys.protoVersion !== protoVersion){
      sysOpts.protos = config.protos;
    }
    sysOpts.protoVersion = protoVersion;
    sysOpts.useProto = true;
  }

  //user handshake data;
  if(typeof config.userHandshake === 'function') {
    //msg,function,socket;
    config.userHandshake(msg, function(err, userOpts) {
      if(err) {
        process.nextTick(function() {
          processError(socket, CODE_USE_ERROR);
        });
        return;
      }
      process.nextTick(function() {
        response(socket, sysOpts, userOpts);
      });
    }, socket);
    return;
  }

  //response to client
  process.nextTick(function() {
    response(socket, sysOpts);
  });
};


var response = function(socket, sysOpts, userOpts) {
  var res = {
    code: CODE_OK,
    sys: sysOpts
  };
  if(userOpts) {
    res.user = userOpts;
  }
  console.debug("handshake response:",res);
  socket.send(new Buffer(JSON.stringify(res)),{ptype: Package.TYPE_HANDSHAKE});
};

var processError = function(socket, code) {
  var res = {
    code: code
  };
  console.debug("handshake response:",res);
  socket.send(new Buffer(JSON.stringify(res)),{ptype: Package.TYPE_HANDSHAKE});
  process.nextTick(function() {
    socket.disconnect();
  });
};

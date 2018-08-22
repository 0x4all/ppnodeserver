var Message = require('../pomelo-protocol').Message;

var coder = function(){
  this._config = {};
};
module.exports = coder;

coder.prototype.config = function(_conf) {
  this._config = _conf ? _conf : {};
}

coder.prototype.encode = function(reqId, route, msg, cb) {
  if(!!reqId) {
    return composeResponse(this._config, reqId, route, msg, cb);
  } else {
    return composePush(this._config, route, msg, cb);
  }
};

coder.prototype.decode = function(msg, cb) {
  msg = Message.decode(msg.body);
  var route = msg.route;

  var config = this._config;
  // decode use dictionary
  if(!!msg.compressRoute) {
    if(!!config.dictionary) {
      var abbrs = config.dictionary.getAbbrs();
      if(!abbrs[route]) {
        logger.error('dictionary error! no abbrs for route : %s', route);
        return null;
      }
      route = msg.route = abbrs[route];
    } else {
      logger.error('fail to uncompress route code for msg: %j, server not enable dictionary.', msg);
      return null;
    }
  }

  // decode use protobuf
  if(!!config.protobuf && !!config.protobuf.getProtos().client[route]) {
    msg.body = config.protobuf.decode(route, msg.body);
  } else if(!!config.decodeIO_protobuf && !!config.decodeIO_protobuf.check("client", route)) {
    msg.body = config.decodeIO_protobuf.decode(route, msg.body);
  } else {
    try {
      msg.body = JSON.parse(msg.body.toString('utf8'));
    } catch (ex) {
      msg.body = {};
    }
  }

  cb(msg);
};

var composeResponse = function(config, msgId, route, msgBody, cb) {
  if(!msgId || !route || !msgBody) {
    cb(null);
    return;
  }
  msgBody = encodeBody(config, route, msgBody,function(msgBody){
    var msg  = (Message.encode(msgId, Message.TYPE_RESPONSE, 0, null, msgBody));
    cb(msg);
  });
};

var composePush = function(config, route, msgBody, cb) {
  if(!route || !msgBody){
    cb(null);
    return;
  }
  encodeBody(config, route, msgBody, function(msgBody){
    // encode use dictionary
    var compressRoute = 0;
    if(!!config.dictionary) {
      var dict = config.dictionary.getDict();
      if(!!dict[route]) {
        route = dict[route];
        compressRoute = 1;
      }
    }
    var msg = Message.encode(0, Message.TYPE_PUSH, compressRoute, route, msgBody);
    cb(msg);
  });
  
};

var encodeBody = function(config, route, msgBody, cb) {
    // encode use protobuf
  if(!!config.protobuf && !!config.protobuf.getProtos().server[route]) {
    msgBody = config.protobuf.encode(route, msgBody);
  } else if(!!config.decodeIO_protobuf && !!config.decodeIO_protobuf.check("server", route)) {
     msgBody = config.decodeIO_protobuf.encode(route, msgBody);
  } else {
    msgBody = new Buffer(JSON.stringify(msgBody), 'utf8');
  }
  cb(msgBody);
};


var Package = require('../pomelo-protocol').Package;

/**
 * Process heartbeat request.
 *
 * @param {Object} opts option request
 *                      opts.heartbeat heartbeat interval
 */
var Command = function() {
  this.opts = {};
};

module.exports = Command;


/**
 * 配置心跳参数
 * @param {HeartBeatConfig} opts 
 */
Command.prototype.config = function(opts) {
  opts = opts || {};
  this.heartbeat = null;
  this.timeout = null;

  this.disconnectOnTimeout = opts.disconnectOnTimeout;

  if(opts.heartbeat) {
    this.heartbeat = opts.heartbeat * 1000; // heartbeat interval
    this.timeout = opts.timeout * 1000 || this.heartbeat * 2;      // max heartbeat message timeout
    this.disconnectOnTimeout = true;
  }


  this.timeouts = {};
  this.clients = {};
}

Command.prototype.process = function(socket) {
  if(!this.heartbeat) {
    // no heartbeat setting
    return;
  }

  var self = this;

  if(!this.clients[socket.id]) {
    // clear timers when socket disconnect or error
    this.clients[socket.id] = 1;
    socket.once('disconnect', clearTimers.bind(null, this, socket.id));
    socket.once('error', clearTimers.bind(null, this, socket.id));
  }

  // clear timer
  if(self.disconnectOnTimeout) {
    this.clear(socket.id);
  }

  //echo heartbeat
  socket.send(null,{ptype: Package.TYPE_HEARTBEAT});

  //reset timer
  if(self.disconnectOnTimeout) {
    self.timeouts[socket.id] = setTimeout(function() {
      console.info('client heartbeat timeout.', socket.id);
      socket.disconnect();
    }, self.timeout);
  }
};

Command.prototype.clear = function(id) {
  var tid = this.timeouts[id];
  if(tid) {
    clearTimeout(tid);
    delete this.timeouts[id];
  }
};

var clearTimers = function(self, id) {
  delete self.clients[id];
  var tid = self.timeouts[id];
  if(tid) {
    clearTimeout(tid);
    delete self.timeouts[id];
  }
};

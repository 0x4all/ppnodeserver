var util = require("util");
var EventEmitter = require("events").EventEmitter;

var ST_INITED = 0;
var ST_CLOSED = 1;
/**
 * 管理该socket绑定的数据
 * @param {Number} sid 
 * @param {Object} socket 
 */
var Session = function(sid, socket) {
    EventEmitter.call(this);
    this.id = sid;          // r
    this._socket = socket;
    this._state = ST_INITED;

    this.uid = null;        // r
    this._settings = {};
  
    // bind events for session
    socket.on('disconnect', this.closed.bind(this));
    socket.on('error', this.closed.bind(this));

    console.log("session:",this.id, "created.")

  };
  
  util.inherits(Session, EventEmitter);
  
  module.exports = Session;
  
  /**
   * Bind the session with the the uid.
   *
   * @param {Number} uid User id
   * @api public
   */
  Session.prototype.bind = function(uid) {
    this.uid = uid;
    this.emit('bind', uid);
  };
  
  /**
   * Unbind the session with the the uid.
   *
   * @param {Number} uid User id
   * @api private
   */
  Session.prototype.unbind = function(uid) {
    this.uid = null;
    this.emit('unbind', uid);
  };


  
  /**
   * Set values (one or many) for the session.
   *
   * @param {String|Object} key session key
   * @param {Object} value session value
   * @api public
   */
  Session.prototype.set = function(key, value) {
    this._settings[key] = value;
  };
  
  /**
   * Remove value from the session.
   *
   * @param {String} key session key
   * @api public
   */
   Session.prototype.remove = function(key) {
    delete this[key];
  };
  
  /**
   * Get value from the session.
   *
   * @param {String} key session key
   * @return {Object} value associated with session key
   * @api public
   */
  Session.prototype.get = function(key) {
    return this._settings[key];
  };
  
  /**
   * Send message to the session.
   *
   * @param  {Object} msg final message sent to client
   */
  Session.prototype.send = function(msg, opts, cb) {
    this._socket.send(msg, opts, cb);
  };

  
  /**
   * Closed callback for the session which would disconnect client in next tick.
   *
   * @api public
   */
  Session.prototype.closed = function(reason) {
    if(this._state === ST_CLOSED) {
      return;
    }
    this._state = ST_CLOSED;
    this.emit('closed', this, reason);
    console.log("session:",this.id, "closed.")
    process.nextTick(()=> {
      this._socket.disconnect();
    });
  };
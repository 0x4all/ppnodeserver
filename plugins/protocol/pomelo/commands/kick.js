var Package = require('../pomelo-protocol').Package;

module.exports.process = function(socket, reason) {
// websocket close code 1000 would emit when client close the connection
  if(typeof reason === 'string') {
    var res = {
      reason: reason
    };
    socket.send(new Buffer(JSON.stringify(res)), { ptype: Package.TYPE_KICK } );
  }
};

var protocol = require("./pomelo-protocol");
var Package = protocol.Package;
var util = {};
module.exports = util;
util.checkPkgHeader = function(data) {
    return data === Package.TYPE_HANDSHAKE || data === Package.TYPE_HANDSHAKE_ACK || data === Package.TYPE_HEARTBEAT || data === Package.TYPE_DATA || data === Package.TYPE_KICK;
}
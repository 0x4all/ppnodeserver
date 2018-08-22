var protocol = require("./pomelo-protocol");
var Package = protocol.Package;

var plugin = function(){};

module.exports = function(){
    return new plugin();
};

plugin.prototype.message_handler =  function(message, next){
    message.data = Package.decode(message.data);
    console.log("=============package received:",message.data.type);
    next();
};

plugin.prototype.send_handler =  function(data, next){
    console.log("package send:",data.msg);
    var ptype = Package.TYPE_DATA;
    if(data.opts && data.opts.ptype) {
        ptype = data.opts.ptype;
    }
    data.msg = Package.encode(ptype, data.msg);
    next();
};
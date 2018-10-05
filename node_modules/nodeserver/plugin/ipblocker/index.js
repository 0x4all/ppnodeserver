
var plugin = function() {
    this.blacklist = [];
};

module.exports = function(){
    return new plugin();
};

plugin.prototype.connection_handler = function(connection, next){
   var socket = connection.socket;
   var address = socket.remoteAddress;
   console.log(this,this.blacklist);
   if(this.blacklist.indexOf(address.ip) >= 0 ) {
        console.log(address,"was rejected by blacklist.");
        socket.disconnect();
       return;
   }
   console.log("connected:",address);
   next();
};

var _add_item = function(arr, item) {
    if(arr.indexOf(item) < 0) {
        arr.push(item);
    }
};

plugin.prototype.config = function(blackhost) {
    if(typeof blackhost == "string"){
        _add_item(this.blacklist,blackhost);
        _add_item(this.blacklist,"::ffff:" + blackhost);
    }
    else if(blackhost instanceof Array) {
        for(var i =0, l = blackhost.length;i < blackhost; ++i) {
            var host = blackhost[i];
            if(host.indexOf(":") == 0 ){ //ipv6
                _add_item(this.blacklist,host);
            }
            else {
                _add_item(this.blacklist,host);
                _add_item(this.blacklist,"::ffff:" + host);
            }
        }
    }
    console.log(this.blacklist);
}

 
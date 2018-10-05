var plugin = function(){
    this.routers = {};
};

module.exports = function(){
    return new plugin();
};

plugin.prototype.message_handler = function(message, next) {
    var msg = message.data;
    console.log("route",msg.route);

    var route = msg.route;
    if(route) {
        var lastDotIndex = route.lastIndexOf(".");
        var servicename = route.substring(0,lastDotIndex);
        var method = route.substr(lastDotIndex+1);
        var service = this.routers[servicename];
        if(service) {
            var handler = service[method];
            console.log("servicehandler:",servicename,method,handler);
            if(handler && typeof handler == "function" ) {
                handler = handler.bind(service);
                handler(msg.body, message.connection.session, function(err,result){
                    if(!msg.id) { //notify
                        return;
                    }
                    var socket = message.connection.socket;
                    socket.send(result, {msgid: msg.id, msgtype: msg.type, msgroute: msg.route});
                    return;
                })
            }
        }
        else {
            console.debug("service:", servicename, "not found.")
            return;
        }
    }

    next();
};

plugin.prototype.route = function(servicename, service) {
    this.routers[servicename] = service;
};

plugin.prototype.get = function(servicename) {
    return this.routers[servicename];
};

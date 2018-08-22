
/**
 * 为session方法添加push方法，发送pomelo推送消息
 */
var plugin = function() {};

module.exports = function(){
    return new plugin();
};

plugin.prototype.connection_handler = function(connection, next){
    var session = connection.session;
    if(session) {
        session.push = function(route, msg , cb) {
            var opts = {
                msgroute:route,
                isPush:true
            }
            connection.socket.send(msg, opts, cb);
        };
    }
    console.debug("session.push() created.")
    next();
}
 
plugin.prototype.message_handler = function(message, next){
    var connection = message.connection;
    var session = connection.session;
    if(session) {
        session.push = function(route, msg , cb) {
            var opts = {
                msgroute:route,
                isPush:true
            }
            connection.socket.send(msg, opts, cb);
        };
    }
    console.debug("session.push() created.")
    next();
}
 
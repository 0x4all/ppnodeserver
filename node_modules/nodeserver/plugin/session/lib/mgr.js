var Session = require("./session");

var SessionManager = function(){   
    this.sessions = {};
};

module.exports = SessionManager;

SessionManager.prototype.createSession = function(socket) {
    var sid = socket.id;
    var session = new Session(sid, socket);
    this.sessions[sid] = session;
    session.on("closed",(session, reason)=>{
        this.remove(session.id);
    })
    return session;
}

SessionManager.prototype.get = function(sid) {
    return this.sessions[sid];
}

SessionManager.prototype.remove = function(sid) {
    delete this.sessions[sid];
}
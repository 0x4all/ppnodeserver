var plugins = {};

module.exports = plugins;

plugins.handshake = require("./handshake");
plugins.heartbeat = require("./heartbeat");
plugins.package = require("./package");
plugins.message = require("./message");
plugins.push = require("./push");
plugins.router = require("./router");
plugins.util = require("./util");


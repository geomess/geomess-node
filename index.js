var GeoMessServer = function() {
	this.log = require('./lib/log');
	this.serverAuth = require('./lib/serverAuth');
	this.clientAuth = require('./lib/clientAuth');
	this.login = require('./lib/login');
	this.routing = require('./lib/routing');
	this.dbcalls = require('./lib/dbcalls');
};

GeoMessServer.prototype.setBayeux = function(val){
	this.login.setBayeux(val);
	this.routing.setBayeux(val);
	this.dbcalls.setBayeux(val);
};

GeoMessServer.prototype.setDb = function(val) {
	this.clientAuth.setDb(val);
	this.login.setDb(val);
	this.routing.setDb(val);
	this.dbcalls.setDb(val);
};

GeoMessServer.prototype.setServerPassword = function(val){
	this.serverAuth.setServerPassword(val);
	this.routing.setServerPassword(val);
};

GeoMessServer.prototype.setDebugMeta = function(val){
	this.log.setDebugMeta(val);
};

GeoMessServer.prototype.setDebugMessages = function(val){
	this.log.setDebugMessages(val);
};

/* simple message log */
GeoMessServer.prototype.getLogInterceptor = function(){
	return this.log.logInterceptor;
};

/*server authentication*/
GeoMessServer.prototype.getRestrictSubscriptionToServer = function(){
	return this.serverAuth.restrictSubscriptionToServer;
};

/*client authentication*/
GeoMessServer.prototype.getAuthInterceptor = function(){
	return this.clientAuth.authInterceptor;
};

/*client login*/
GeoMessServer.prototype.getLoginHandler = function(){
	return this.login.handleLogin;
};

/*http router*/
GeoMessServer.prototype.getHTTPRouter = function(){
	return this.routing.router;
};

/*db methods - agents by app*/
GeoMessServer.prototype.getAgentsByApp = function(){
	return this.dbcalls.getAgents;
};

/*db methods - agent types*/
GeoMessServer.prototype.getAgentTypes = function(){
	return this.dbcalls.getAgentTypes;
};

module.exports.GeoMessServer = GeoMessServer;
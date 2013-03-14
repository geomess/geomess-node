var GeoMessServer = function() {
	this.log = require('./lib/log');
	this.serverAuth = require('./lib/serverAuth');
	this.clientAuth = require('./lib/clientAuth');
	this.rest = require('./lib/rest');
	this.faye = require('./lib/faye');
};

GeoMessServer.prototype.setBayeux = function(val){
	this.rest.setBayeux(val);
	this.faye.setBayeux(val);
};

GeoMessServer.prototype.setDb = function(val) {
	this.clientAuth.setDb(val);
	this.rest.setDb(val);
	this.faye.setDb(val);
};

GeoMessServer.prototype.setServerPassword = function(val){
	this.serverAuth.setServerPassword(val);
	this.rest.setServerPassword(val);
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

/*http - rest services*/
GeoMessServer.prototype.getHTTPRouter = function(){
	return this.rest.router;
};

/*faye - client login*/
GeoMessServer.prototype.getLoginHandler = function(){
	return this.faye.handleLogin;
};

/*faye - agents by app*/
GeoMessServer.prototype.getAgentsByApp = function(){
	return this.faye.getAgents;
};

/*faye - agent types*/
GeoMessServer.prototype.getAgentTypes = function(){
	return this.faye.getAgentTypes;
};

module.exports.GeoMessServer = GeoMessServer;
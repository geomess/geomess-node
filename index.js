/* simple message log */
var log = require('./lib/log');
exports.logInterceptor = log.logInterceptor;

/*server authentication*/
var serverAuth = require('./lib/serverAuth');
exports.restrictSubscriptionToServer = serverAuth.restrictSubscriptionToServer;

/*client authentication*/
var clientAuth = require('./lib/clientAuth');
exports.authInterceptor = clientAuth.authInterceptor;

/*client login*/
var login = require('./lib/login');
exports.handleLogin = login.handleLogin;

/*http router*/
var routing = require('./lib/routing');
exports.router = routing.router;

exports.setBayeux = function(val){
	login.setBayeux(val);
	routing.setBayeux(val);
};

exports.setDb = function(val) {
	clientAuth.setDb(val);
	login.setDb(val);
	routing.setDb(val);
};

exports.setServerPassword = function(val){
	serverAuth.setServerPassword(val);
	routing.setServerPassword(val);
};

exports.setDebugMeta = function(val){
	log.setDebugMeta(val);
};

exports.setDebugMessages = function(val){
	log.setDebugMessages(val);
};
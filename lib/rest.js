var director = require('director');
var url = require('url') ;
var mongodb = require('mongodb');
var dao = require('./dao');

var bayeux;
var secretServerPassword;
var client;

var dbClient = new dao.GeoMessDAO();

dbClient.on('login-error', function (message, responseHash, response, bayeux) {
	response.end('{"response":"error", "message":"'+message+'"}');
});

dbClient.on('login-success', function (user, app, responseHash, response, bayeux) {
	response.end('{"response":"success", "token":"'+user.token+'"}');
});
//generic error
dbClient.on('error', function (message, responseHash, response, bayeux) {
	response.end('{"response":"error", "message":"'+message+'"}');
});
//get agents
dbClient.on('get-agents-response', function (agents, responseHash, response, bayeux) {
	response.end('{"response":"success", "message":"ok", "agents":'+JSON.stringify(agents)+'}');
});
//update position
dbClient.on('update-position-response', function (appalias, agentid, latitude, longitude, responseHash, response, bayeux) {

		bayeux.getClient().publish('/server/'+appalias+'/map', {
  			"event":"update-position",
  			"agentid":""+agentid,
  			"lat":latitude,
  			"lng":longitude
  		});

	   response.end('{"response":"success", "message":"position updated"}');

});
//update status
dbClient.on('update-status-response', function (appalias, agentid, status, responseHash, response, bayeux) {

	bayeux.getClient().publish('/server/'+appalias+'/map', {
			"event":"update-status",
			"agentid":""+agentid,
			"status":status
		});
	
	response.end('{"response":"success", "message":"status updated"}');
});

exports.setServerPassword = function(val){
	secretServerPassword = val;
};

exports.setDb = function(val) {
	dbClient.setDb(val);
};

exports.setBayeux = function(val){
	bayeux = val;

	//FIXME: why need this???
	//TODO: protect publications to /server/[]/map?
	client = bayeux.getClient();

	client.addExtension({
			  outgoing: function(message, callback) {
				message.ext = message.ext || {};
				message.ext.serverpassword = secretServerPassword;
			    callback(message);
			  }
			});
	
};

function login(){
    this.res.writeHead(200, { 'Content-Type': 'application/json' });
    var url_parts = url.parse(this.req.url, true);

    var appalias = url_parts.query.app;
    var username = url_parts.query.username;
    var password = url_parts.query.password;
    
    dbClient.login(appalias, username, password, null, this.res, null);
}

function updatePosition(){
	this.res.writeHead(200, { 'Content-Type': 'application/json' });
	var url_parts = url.parse(this.req.url, true);
    
    var username = url_parts.query.username;
    var appalias = url_parts.query.app;

    var agentid = url_parts.query.agentid;
    var latitude = url_parts.query.latitude;
    var longitude = url_parts.query.longitude;
    var timestamp = url_parts.query.timestamp;
    
    var hashSubmitted = url_parts.query.hash;
    
    dbClient.updatePosition(username, appalias, agentid, latitude, longitude, timestamp, hashSubmitted, null, this.res, bayeux);

}

function getAgents(){
	this.res.writeHead(200, { 'Content-Type': 'application/json' });
	var url_parts = url.parse(this.req.url, true);
    
    var username = url_parts.query.username;
    var appalias = url_parts.query.app;
    
    dbClient.getAgents(appalias, username, null, this.res, null);
    
}

function updateStatus(){
	//TODO: limit possibile statuses by app
	this.res.writeHead(200, { 'Content-Type': 'application/json' });
	var url_parts = url.parse(this.req.url, true);
    
    var appalias = url_parts.query.app;
    var agentid = url_parts.query.agentid;
    var status = url_parts.query.status;

    var timestamp = url_parts.query.timestamp;
    var username = url_parts.query.username;
    var hashSubmitted = url_parts.query.hash;
    
    dbClient.updateStatus(username, appalias, agentid, status, timestamp, hashSubmitted, null, this.res, bayeux);
    
}

function home(){
	this.res.writeHead(200, { 'Content-Type': 'text/html' });
	this.res.end('Geo\Mess');
}

var router = new director.http.Router({
	'/' : {get: home, post: home},
    '/login': { get: login, post: login },
    '/updatePosition': { get:updatePosition, post: updatePosition },
    '/getAgents': { get: getAgents, post: getAgents },
    '/updateStatus': { get:updateStatus, post: updateStatus }
});

exports.router = router;
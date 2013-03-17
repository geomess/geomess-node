var mongodb = require('mongodb');
var dao = require('./dao');

var bayeux;

var dbClient = new dao.GeoMessDAO();

dbClient.on('login-error', function (message, responseHash, response, bayeux) {
	
	bayeux.getClient().publish('/api/response/'+responseHash, {
		'event': 'login-error',
		'message': message
	});
	
});

dbClient.on('login-success', function (user, app, responseHash, response, bayeux) {
	
	bayeux.getClient().publish('/api/response/'+responseHash, {
		'event': 'login-success',
		'message': 'authentication successful',
		'token': user.token,
		'username': user.username,
		'app': app.alias
	});
	
});

//generic error
dbClient.on('error', function (message, responseHash, response, bayeux) {

	bayeux.getClient().publish('/api/response/'+responseHash, {
		'event': 'generic-error',
		'message': message
	});
	
});
//get agents
dbClient.on('get-agents-response', function (agents, responseHash, response, bayeux) {

	bayeux.getClient().publish('/api/response/'+responseHash, {
		'event': 'agent-list-response',
		'agents': agents
	});
	
});

//get agent types
dbClient.on('get-agent-types-response', function (agentTypesArray, responseHash, response, bayeux) {

	bayeux.getClient().publish('/api/response/'+responseHash, {
		event: 'agent-types-list-response',
		agentTypes: agentTypesArray
	});

});

exports.setDb = function(val) {
	dbClient.setDb(val);
};

exports.setBayeux = function(val){
	bayeux = val;
};

exports.handleLogin = {
		incoming: function(message, callback) {
			if (message.channel.match(/^\/api\/login-request/)) {
				if(message.data){
					//console.log(" * received login message: %j", message);
					var password = message.data.password;
					var username = message.data.username;
					var appalias = message.data.app;
					var responseHash = message.data.responseHash;
					
					dbClient.login(appalias, username, password, responseHash, null, bayeux);
				}

			}
					
		    callback(message);
		  },
		outgoing: function(message, callback) {
			if (message.data){
				delete message.data.password;
				delete message.data.responseHash;
			}
			callback(message);
		}
	};

exports.getAgentTypes = {
		incoming: function(message, callback) {
			if (message.channel.match(/^\/api\/get-agent-types/)) {
				if(message.data){
					
					var responseHash = message.data.responseHash;
					
					dbClient.getAgentTypes(responseHash, null, bayeux);

				}
			}
			
			 callback(message);
		}
};

exports.getAgents = {
	incoming: function(message, callback) {
		if (message.channel.match(/^\/api\/get-agents/)) {
			if(message.data){
				var username = message.data.username;
				var appalias = message.data.app;
				var responseHash = message.data.responseHash;
				var status=null;
				var centerLat=null;
				var centerLon=null;
				var radius=null;
				
				dbClient.getAgents(appalias, username, status, centerLat, centerLon, radius, responseHash, null, bayeux);

			}

		}
				
	    callback(message);
	  }
};
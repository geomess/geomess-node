var mongodb = require('mongodb');

var bayeux;
var db;

exports.setDb = function(val) {
	db = val;
};

exports.setBayeux = function(val){
	bayeux = val;
};
exports.getAgentTypes = {
		incoming: function(message, callback) {
			if (message.channel.match(/^\/api\/get-agent-types/)) {
				if(message.data){
					
					var responseHash = message.data.responseHash;
					
					db.collection('agent_types').find({}, function(err, cursor){
						
						cursor.toArray(function(err, agentTypesArray) {
						
							bayeux.getClient().publish('/api/response/'+responseHash, {
								event: 'agent-types-list-response',
								agentTypes: agentTypesArray
							});
					    });
						
					});

				}
			}
			
			 callback(message);
		}
};

exports.getAgents = {
	incoming: function(message, callback) {
		if (message.channel.match(/^\/api\/get-agents/)) {
			if(message.data){
				var appalias = message.data.app;
				var responseHash = message.data.responseHash;
				
				db.collection('apps').findOne({"alias":appalias}, function(err1, appCheck){
					if(appCheck==null){
						
						bayeux.getClient().publish('/api/response/'+responseHash, {
							event: 'generic-error',
							message: 'cannot find app '+appalias
						});
						
					}else{

						//find all users of the app
						db.collection('users').find({"app":appCheck._id}, function(err, userCursor){
							
							userCursor.toArray(function(err, users) {
								
								var userids= [];
								for(var idx in users){
								//	console.log(" * found user: ",users[idx]);
									userids.push(users[idx]._id);
								}
								//console.log(" * tot users found: "+userids.length);

								//find all agents of users
								db.collection('agents').find({"user":{'$in':userids}}, function(err, cursor){
									
									cursor.toArray(function(err, agentsArray) {
									
										bayeux.getClient().publish('/api/response/'+responseHash, {
											event: 'agent-list-response',
											agents: agentsArray
										});
								    });
									
								});

							});
							
						});
					
					}
				});

			}

		}
				
	    callback(message);
	  }
};
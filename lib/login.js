var mongodb = require('mongodb');

var bayeux;
var db;

exports.setDb = function(val) {
	db = val;
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
				
				db.collection('apps').findOne({"alias":appalias}, function(err1, appCheck){
					if(appCheck==null){
						
						bayeux.getClient().publish('/api/response/'+responseHash, {
							event: 'login-error',
							message: 'cannot find app '+appalias
						});
						
					}else{
						//console.log(" * found app: %j",app);
						db.collection('users').findOne({"username":username,"password":password,"app":appCheck._id}, function(err, user){
							if(user!=null){
								
								bayeux.getClient().publish('/api/response/'+responseHash, {
									event: 'login-success',
									message: 'authentication successful',
									token: user.token,
									username: user.username,
									app: appCheck.alias
								});
								
							}else{
								
								bayeux.getClient().publish('/api/response/'+responseHash, {
									event: 'login-error',
									response: 'error',
									message: 'authentication failure'
								});
								
							}
						});
					}
				});

			}

		}
				
	    callback(message);
	  },
	outgoing: function(message, callback) {
		if (message.data){
			delete message.data.password;
			delete message.data.username;
			delete message.data.app;
			delete message.data.responseHash;
		}
		callback(message);
	}
};
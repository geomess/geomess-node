var mongodb = require('mongodb');

var db;

exports.setDb = function(val) {
	db = val;
};

/**
 * test client per-message authentication
 */
exports.authInterceptor = {
	incoming: function(message, callback) {
		message.ext = message.ext || {};

		//leave /meta without authentication
		//if (message.channel === '/meta/handshake' || message.channel === '/meta/connect' || message.channel === '/meta/subscribe') {
		if(message.channel.match(/^\/meta\//)){
			
			callback(message);
		
		}else{
			db.collection('test_users').findOne({"_id":new mongodb.ObjectID(message.ext.userId), "token":message.ext.token}, function(err, check){
				if(err){
					console.log("error: %j", err);
					message.error = '403::Authentication required - error checking credentials';
				}
					
				if(check==null){
					console.log(" * authentication failed, cannot find user with id: "+message.ext.userId+" and token: "+message.ext.token);
					message.error = '403::Authentication required';
				}

				callback(message);

			});
		}
	},
		outgoing: function(message, callback) {
		    if (message.ext)
		    		delete message.ext.token;
		    callback(message);
		  }
};

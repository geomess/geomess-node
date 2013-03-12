var secretServerPassword;

exports.setServerPassword = function(val){
	secretServerPassword = val;
};

exports.restrictSubscriptionToServer = {
	incoming: function(message, callback) {
		
		/*
		 * only client with <b>secretServerPassword</b> can
		 *  - publish directly to /server/*
		 *  - publish to /** (no-one should do)
		 *  - subscribe to /api/login-request (users can send message to /api/login but only server can read them)
		 *  - cannot subscribe to wildcarded /api/response
		 */
		if (	message.channel.match(/^\/server/) 
				|| message.channel == '/**' 
				|| (message.channel === '/meta/subscribe' && message.subscription === '/api/*')
				|| (message.channel === '/meta/subscribe' && message.subscription === '/api/**')
				|| (message.channel === '/meta/subscribe' && message.subscription === '/api/login-request')
				|| (message.channel === '/meta/subscribe' && message.subscription === '/api/response/*')
				|| (message.channel === '/meta/subscribe' && message.subscription === '/api/response/**')
			) {
			var password = message.ext && message.ext.serverpassword;
			if (password !== secretServerPassword)
				message.error = '403::Password required';
		}
				
	    callback(message);
	  },
	outgoing: function(message, callback) {
		if (message.ext)
			delete message.ext.serverpassword;
		callback(message);
	}
};
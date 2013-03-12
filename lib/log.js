var debugMeta = false;
var debugMessages = true;

exports.setDebugMeta = function(val){
	debugMeta = val;
};

exports.setDebugMessages = function(val){
	debugMessages = val;
};

/**
 * debugs meta & messages
 */
exports.logInterceptor = {
	incoming: function(message, callback) {
		
		if(debugMeta==true)
			console.log(" <- message: %j", message);
		else if (!message.channel.match(/^\/meta\//) && debugMessages)
			console.log(" <- message: %j", message);
			
		callback(message);
	},
	outgoing: function(message, callback) {
		
		if(debugMeta==true)
			console.log(" -> message: %j", message);
		else if (!message.channel.match(/^\/meta\//) && debugMessages)
			console.log(" -> message: %j", message);

		callback(message);
	}
};
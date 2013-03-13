var director = require('director');
var url = require('url') ;
var mongodb = require('mongodb');
var crypto = require('crypto');

var db;
var bayeux;
var secretServerPassword;
var client;

exports.setServerPassword = function(val){
	secretServerPassword = val;
};

exports.setDb = function(val) {
	db = val;
};

exports.setBayeux = function(val){
	bayeux = val;

	client = bayeux.getClient();

	client.addExtension({
			  outgoing: function(message, callback) {
				message.ext = message.ext || {};
				message.ext.serverpassword = secretServerPassword;
			    callback(message);
			  }
			});
	
};

function helloWorld() {
    this.res.writeHead(200, { 'Content-Type': 'text/plain' });
    this.res.end('hello world');
}

function byeWorld() {
    this.res.writeHead(200, { 'Content-Type': 'text/plain' });
    this.res.end('bye world');
}

/*

url_parts: {
	"search":"?username=pippo&password=pluto&app=paperino",
	"query":{
		"username":"pippo",
		"password":"pluto",
		"app":"paperino"
	},
	"pathname":"/login",
	"path":"/login?username=pippo&password=pluto&app=paperino",
	"href":"/login?username=pippo&password=pluto&app=paperino"
}
 */
function login(){
    this.res.writeHead(200, { 'Content-Type': 'application/json' });
    var url_parts = url.parse(this.req.url, true);

    var appalias = url_parts.query.app;
    var username = url_parts.query.username;
    var password = url_parts.query.password;
    var response = this.res;
    
	db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			response.end('{"response":"error", "message":"cannot find app '+appalias+'"}');
			
		}else{

			db.collection('users').findOne({"username":username,"password":password,"app":app._id}, function(err, user){
				if(user!=null){
					
					response.end('{"response":"success", "message":"authentication successful", "token":"'+user.token+'"}');
										
				}else{
					
					response.end('{"response":"error", "message":"authentication failure"}');
					
				}
			});
		}
	});
    
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

    var response = this.res;
    
   
	db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			response.end('{"response":"error", "message":"cannot find app '+appalias+'"}');
			
		}else{
			db.collection('users').findOne({"username":username,"app":app._id}, function(err, userExtracted){
				if(userExtracted!=null){

				    var messageToHash = 'updatePosition|'+agentid+'|'+latitude+'|'+longitude+'|'+timestamp;
				    
				    var hashCalculated = crypto.createHmac('md5', userExtracted.token).update(messageToHash).digest('hex');
					
				    if(hashSubmitted===hashCalculated){
				    	
				    	db.collection('agents').update(
				    			   { _id: mongodb.ObjectID(agentid), user: userExtracted._id },
				    			   { $set: { 'loc': [parseFloat(longitude), parseFloat(latitude)] } },
				    			   function(err, records){
				    				   if(err){
				    					   console.log("error: %j",err);
				   							response.end('{"response":"error", "message":"error: "'+error.message+'}');
				    				   }else{

				    					   client.publish('/server/'+appalias+'/map', {
				    						   			"event":"update-position",
				    						   			"agentid":""+agentid,
				    						   			"lat":latitude,
				    						   			"lng":longitude
				    						   		});
				    					   
				    					   response.end('{"response":"success", "message":"position updated"}');

				    				   }
				    			   });
				    	
				    	
				    }else{
						response.end('{"response":"error", "message":"hash not matching"}');
				    }
				    
										
				}else{
					
					response.end('{response:"error", "message":"cannot find user:'+username+'"}');
					
				}
			});
		}
	});

}

function getAgents(){
	this.res.writeHead(200, { 'Content-Type': 'application/json' });
	var url_parts = url.parse(this.req.url, true);
    
    var username = url_parts.query.username;
    var appalias = url_parts.query.app;
    
    var response = this.res;
    
    db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			response.end('{"response":"error", "message":"cannot find app '+appalias+'"}');
			
		}else{

			db.collection('users').findOne({"username":username,"app":app._id}, function(err, user){
				if(user!=null){

					db.collection('agents').find({"user":user._id}, function(err, cursor){
					
						cursor.toArray(function(err, agents) {
							response.end('{"response":"success", "message":"ok", "agents":'+JSON.stringify(agents)+'}');
					    });
						
					});
					
				}else{
					response.end('{"response":"error", "message":"cannot find user '+username+'"}');
				}
				
			});
		}
	});

    
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
    
    var response = this.res;

        
	db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			response.end('{"response":"error", "message":"cannot find app '+appalias+'"}');
			
		}else{
			db.collection('users').findOne({"username":username,"app":app._id}, function(err, userExtracted){
				if(userExtracted!=null){

				    var messageToHash = 'updateStatus|'+agentid+'|'+status+'|'+timestamp;
				    
				    var hashCalculated = crypto.createHmac('md5', userExtracted.token).update(messageToHash).digest('hex');

				    if(hashSubmitted===hashCalculated){
				    	
				    	db.collection('agents').update(
				    			   { _id: mongodb.ObjectID(agentid), user: userExtracted._id },
				    			   { $set: { 'status': status } },
				    			   function(err, records){
				    				   
				    				   console.log(" * updateStatus(), updated records: "+records);
				    				   
				    				   if(err){
				    					   console.log("error: %j",err);
				   							response.end('{"response":"error", "message":"error: "'+error.message+'}');
				    				   }else{

				    					   client.publish('/server/'+appalias+'/map', {
				    						   			"event":"update-status",
				    						   			"agentid":""+agentid,
				    						   			"status":status
				    						   		});
				    					   
				    					   response.end('{"response":"success", "message":"status updated"}');

				    				   }
				    			   });
				    	
				    	
				    }else{
						response.end('{"response":"error", "message":"hash not matching"}');
				    }
				    
										
				}else{
					
					response.end('{response:"error", "message":"cannot find user:'+username+'"}');
					
				}
			});
		}
	});
}

var router = new director.http.Router({
    '/hello': { get: helloWorld },
    '/bye': { get: byeWorld },
    '/login': { get: login, post: login },
    '/updatePosition': { get:updatePosition, post: updatePosition },
    '/getAgents': { get: getAgents, post: getAgents },
    '/updateStatus': { get:updateStatus, post: updateStatus }
});

exports.router = router;
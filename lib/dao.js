var mongodb = require('mongodb');
var util = require("util");
var events = require('events');
var crypto = require('crypto');
var distance = require('./distance');
var debugEnabled = false;

var db;

var GeoMessDAO = function() {
	events.EventEmitter.call(this);	
};

util.inherits(GeoMessDAO, events.EventEmitter);

GeoMessDAO.prototype.setDb = function(val) {
	db = val;
};

GeoMessDAO.prototype.login = function(appalias, username, password, responseHash, response, bayeux){
	var self = this;
	
	db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			self.emit('login-error',"cannot find app "+appalias,responseHash, response, bayeux);
			
		}else{

			db.collection('users').findOne({"username":username,"password":password,"app":app._id}, function(err, user){
				if(user!=null){
					
					self.emit('login-success',user, app, responseHash,response, bayeux);
										
				}else{
					
					self.emit('login-error',"authentication failure", responseHash ,response, bayeux);
					
				}
			});

		}
	});
    
};

GeoMessDAO.prototype.getAgentTypes = function(responseHash, response, bayeux){
	var self = this;

	db.collection('agent_types').find({}, function(err, cursor){
		
		cursor.toArray(function(err, agentTypesArray) {

			self.emit('get-agent-types-response', agentTypesArray, responseHash, response, bayeux);

		});
		
	});

};

GeoMessDAO.prototype.getAgents = function(appalias, username, responseHash, response, bayeux){
	var self = this;
	
    db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			self.emit('error',"cannot find app "+appalias, responseHash, response, bayeux);
			
		}else{

			//find all users of the app
			db.collection('users').find({"app":app._id}, function(err, userCursor){
				
				userCursor.toArray(function(err, users) {
					
					var userids= [];
					for(var idx in users){
						//if username is specified, find only agents belonging to that username.
						if(username!=null && username == users[idx].username)
							userids.push(users[idx]._id);
						//if username is not specified, find all agents by app
						else if(username==null)
							userids.push(users[idx]._id);
					}

					//find all agents of users
					db.collection('agents').find({"user":{'$in':userids}}, function(err, cursor){
						
						cursor.toArray(function(err, agentsArray) {
						
							self.emit('get-agents-response',agentsArray, responseHash, response, bayeux);

						});
						
					});

				});
				
			});

		}
	});
};


GeoMessDAO.prototype.updatePosition = function(username, appalias, agentid, latitude, longitude, timestamp, hashSubmitted, responseHash, response, bayeux){
	var self = this;

	db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){

			self.emit('error',"cannot find app "+appalias, responseHash, response, bayeux);
			
		}else{
			db.collection('users').findOne({"username":username,"app":app._id}, function(err, userExtracted){
				if(userExtracted!=null){

				    var messageToHash = 'updatePosition|'+agentid+'|'+latitude+'|'+longitude+'|'+timestamp;
				    
				    var hashCalculated = crypto.createHmac('md5', userExtracted.token).update(messageToHash).digest('hex');
					
				    if(debugEnabled){
					    console.log(" * message: ["+messageToHash+"]");
					    console.log(" * hash submitted: ["+hashSubmitted+"]");
					    console.log(" * hash calculated: ["+hashCalculated+"]");
				    }
				    
				    if(hashSubmitted===hashCalculated){
				    	
				    	db.collection('agents').findOne({ _id: mongodb.ObjectID(agentid), user: userExtracted._id }, function(err, agentFound){
				    		if(agentFound==null){
				    			self.emit('error',"cannot find agent "+agentid+", username: "+username, responseHash, response, bayeux);
				    		}else{
						    	db.collection('agents').update(
						    			   { _id: mongodb.ObjectID(agentid), user: userExtracted._id },
						    			   { $set: { 'loc': [parseFloat(longitude), parseFloat(latitude)], 'date': new Date()} },
						    			   function(err, records){
						    				   if(err){
						    					   console.log("error: %j",err);
						   							self.emit('error',"error: "+error.message, responseHash, response, bayeux);
						    				   }else{

						    					   //calc the distance
						    					   var distanceTraveled = distance.getDistance({'latitude':agentFound.loc[1], 'longitude':agentFound.loc[0] }, {'latitude':latitude, 'longitude':longitude });
						    					   //calc the speed
						    					   var prevDate = agentFound.date;
						    					   var kmh = "";
						    					   if(prevDate!=null){
						    						   var diffTime = (new Date().getTime() - prevDate.getTime())/1000;
						    						   kmh = distanceTraveled * 3600 / diffTime;
						    					   }
						    					   
						    					   self.emit( 'update-position-response',appalias,agentid,latitude,longitude, distanceTraveled, kmh, responseHash, response, bayeux);
						    					   
						    					   try{
						    						   var history = {
						    								   'agent': mongodb.ObjectID(agentid),
						    								   'loc': [parseFloat(longitude), parseFloat(latitude)],
						    								   'date': new Date()
						    						   };
						    						   db.collection('history').insert(history);
						    						   
						    						   if(debugEnabled)
						    							   console.log(" * inserting history: %j ",history);
						    						   
						    					   }catch (e) {
						    						   console.log(" * exception inserting history: "+e);
						    					   }
						    					   
						    				   }
						    			});
				    		}
				    	});
				    	

				    	
				    	
				    }else{
						self.emit('error',"hash not matching", responseHash, response, bayeux);
				    }
				    
										
				}else{
					self.emit('error',"cannot find user: "+username, responseHash, response, bayeux);
				}
			});
		}
	});

};


GeoMessDAO.prototype.updateStatus = function(username, appalias, agentid, status, timestamp, hashSubmitted, responseHash, response, bayeux){
	var self = this;

	db.collection('apps').findOne({"alias":appalias}, function(err1, app){
		if(app==null){
	
			self.emit('error',"cannot find app "+appalias, responseHash, response, bayeux);
			
		}else{
			db.collection('users').findOne({"username":username,"app":app._id}, function(err, userExtracted){
				if(userExtracted!=null){
	
				    var messageToHash = 'updateStatus|'+agentid+'|'+status+'|'+timestamp;
				    
				    var hashCalculated = crypto.createHmac('md5', userExtracted.token).update(messageToHash).digest('hex');
	
				    if(debugEnabled){
						console.log(" * message: ["+messageToHash+"]");
					    console.log(" * hash submitted: ["+hashSubmitted+"]");
					    console.log(" * hash calculated: ["+hashCalculated+"]");
				    }
				    
				    if(hashSubmitted===hashCalculated){
				    	
				    	db.collection('agents').update(
				    			   { _id: mongodb.ObjectID(agentid), user: userExtracted._id },
				    			   { $set: { 'status': status } },
				    			   function(err, records){
				    				   
				    				   if(err){
				    					   console.log("error: %j",err);
				    					   self.emit('error',"error: "+error.message, responseHash, response, bayeux);
				    				   }else{
	
				    					   self.emit( 'update-status-response',appalias,agentid,status, responseHash, response, bayeux);
	
				    				   }
				    			   });
				    	
				    	
				    }else{
				    	self.emit('error',"hash not matching", responseHash, response, bayeux);
				    }
				    
										
				}else{
					
					self.emit('error',"cannot find user: "+username, responseHash, response, bayeux);
					
				}
			});
		}
	});

};

exports.GeoMessDAO = GeoMessDAO;
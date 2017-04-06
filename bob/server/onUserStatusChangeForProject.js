var updateUserStatusforProject = require('./updateUserStatusforProject');
var  publishUserStatusUpdateforProject = require('./publishUserStatusUpdateforProject');
let client = require('./connections/redisclient.js');
 const pub = client.duplicate();
module.exports=function(project,username,status,callback){
	var projectName=project;
	var Username=username;
	
  console.log(project,"in updateUserStatusforProject");
   publishUserStatusUpdateforProject(projectName,username,status);
  updateUserStatusforProject(project,username,status,callback);
 
 
	}
let client = require('./connections/redisclient.js');
 const pub = client.duplicate();
module.exports=function(projectname,username,status, callback){

	if(status =="offline"){
		pub.hdel(projectname+":s3",username,status,callback);
	}
	else
    pub.hmset(projectname+":s3",username,status,callback);  
}


let client = require('./connections/redisclient.js');
 const pub = client.duplicate();
  const sub = client.duplicate();
module.exports=function(projectName,username,status){
		
     const projectname = projectName;
     const userName = username;
     const Status = status;
     const obj={};
     obj.userName = userName;
     obj.Status =Status;
    // sub.subscribe(projectname);
     pub.publish(projectname,JSON.stringify(obj));

     
	   console.log("4 method called");


}
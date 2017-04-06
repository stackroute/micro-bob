var onUserstatusChangeforProject = require('./onUserStatusChangeForProject');
//var getStatus = require('./getUserStatusForProject');
const ChannelInfo = require('./model/channelinfo.schema.js');
let client = require('./connections/redisclient.js');
let async = require('async');
 const pub = client.duplicate();
 
module.exports=function(username,status){
  const channels=[];
  let projects =[];
	var userName = username;
    var status = status;
     ChannelInfo.find({},function(err,rep){
                var channel;
                
                rep.forEach(function(data,i){
                  if(data.members.includes(username)){
                     // console.log(data.channelName,"channnel are ");
                      channels.push(data.channelName.split('#')[0]);
                  }
              })
                projects = channels.filter(function(item,index,projects){
                  return projects.indexOf(item) ==index;
                });
          // console.log(projects,"here channel");
          async.each(projects,function onUserstatusChange(project,callback){
       
          onUserstatusChangeforProject(project,userName,status,callback);
         // callback();
         
      }, function(err) {
    
    if(err) 
    {
      console.log('failed to get status');
    } 
    else 
    {
     
      //  console.log(resultofusers,"array of objects");
      console.log("successfully set")
          
    }  
  });
 })
      
      	
}
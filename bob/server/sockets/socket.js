var mongoose = require('mongoose');
var ChatHistorymodel = require('./../model/chathistory.schema.js');
var db = require('./../connections/dbconnect.js'); //creating a connection to mongodb
let client = require('./../connections/redisclient.js');
var pushToRedis = require('./../PushToRedis');
let async = require('async');
let ajax = require('superagent');
var request = require('superagent-relative');
let UserInfo = require('./../model/userinfo.schema.js');
let LatList = require('./../model/lat.schema.js'),
    Feedback = require('./../model/feedback.schema.js'),
    Tasks = require('./../model/tasks.schema.js');
const ChannelInfo = require('./../model/channelinfo.schema.js');
let GoogleAToken = require('./../model/googleatoken.schema.js');
let bookmarkData = require('./../model/bookmarkSchema.js');
const GitChannel=require('./../model/gitchannel.schema.js');
let unreadCount = {};
let currentChannelName = "";
let currentUser = "";
var arr = [];
var recastai = require('recastai');
var aiclient = new recastai.Client('bd8975c331f2800dd57a331b25e2cc9a','en');

//Google Auth related variables ---------->
let google = require('googleapis'),
    calendar = google.calendar('v3'),
    OAuth2 = google.auth.OAuth2,
    clientId = '616007233163-g0rk4o8g107upgrmcuji5a8jpnbkd228.apps.googleusercontent.com',
    clientSecret = 'h0DIE4B8pncOEtgMfK2t9rcr',
    redirect = 'http://localhost:8000/oauth2callback',
    oauth2Client = new OAuth2(clientId, clientSecret, redirect);


module.exports = function(io, socket) {

    const sub = client.duplicate(); //subscriber will subscribe to all channels he is member of
    const pub = client.duplicate(); //only one publisher is enough

    //Below are the redis events that are catched.
    sub.on('message', handleMessage);
    sub.on('subscribe', handleSubscribe);
    sub.on('unsubscribe', handleUnsubscribe);

    //Below are the event handlers for socket events
    socket.on('send message', handleSendMessage); //handling message sent from user.
    socket.on('typing', handleTyping); //handling typing event from user.
    socket.on('disconnect', handleDisconnect); //handling disconnecting event from user.
    socket.on('getUnreadNotification', handlegetUnreadNotification); //request for unreadnotifications for a user.
    socket.on('receiveChatHistory', handleReceiveChatHistory); //request for sending chat history by user. FIXME:put new function from 6th sprint
    socket.on('getResetNotification', handleResetNotification); //request for resetting chat history. FIXMEput new function from 6th sprint.
    socket.on('feedback', feedbackManager);
    socket.on('newChannel', newChannel);
    socket.on('remainderAccepted', tokenSearch);
    socket.on('saveBookmarks', saveBookmarks);
    socket.on('deleteBookmarks', deleteBookmarks);
    socket.on('taskArray', saveTaskArray);
    socket.on('subscribeMe', handleSubscribeMe);
    socket.on('deleteMessage' , handleDeleteMessage);
    socket.on('editMessage', handleEditMessage);

    function handleSubscribeMe(channelName) {
        //console.log("subscribing socket: ", socket.id, " to ", channelName);
        sub.subscribe(channelName);
    }

    function saveTaskArray(channelName, tasks){
      Tasks.update({channelName:channelName},{$set:{tasks: tasks}}, {upsert: true}, function(err, reply){
        //console.log('Task saved : ', reply);
      });
    }


    function deleteBookmarks(booklist, userName, channelID) {
        // bookmarkData.find({userName:userName},function(err,reply){
        //     console.log("bookmarkData",reply[0].bookmark[0]);
        // })
        
        let a = {
            channelid: channelID,
            sender: booklist.sender,
            timestamp: booklist.TimeStamp,
            msg: booklist.msg
        };
        bookmarkData.update({ userName: userName }, { $pull: { bookmark: a } }, function(err, reply) {
        })
    }

    function handleDeleteMessage(message,username,channelID){
        let flag=0;
        if(username === message[0].sender){
            client.lrange(channelID, 0, -1, function(err, reply) {                       
                reply.map((item,i)=>{
                   var it = JSON.parse(item)
                    var sender = it[Object.keys(it)[0]];
                    var mesg = it[Object.keys(it)[1]];
                    var time = it[Object.keys(it)[2]];
                    var bookmarkStatus = it[Object.keys(it)[3]]
                    console.log(message[0].TimeStamp,time)
                    if(sender === message[0].sender && mesg === message[0].msg && time === message[0].TimeStamp && message[0].bookmarkStatus === bookmarkStatus)
                    {
                        console.log("message found");
                        flag=1;
                    }
                    else{
                        arr.push(item);
                    }
                    client.del(channelID);
                    arr.map((item,i)=>{
                        client.rpush(channelID, item,function(err, reply) { 
                        });
                    })
                });
            });
            arr=[]
            let msg = {
                sender:message[0].sender,
                msg:message[0].msg,
                TimeStamp:message[0].TimeStamp,
                bookmarkStatus:message[0].bookmarkStatus,
                _id:message[0]._id                
            }
            ChatHistorymodel.update({channelname:channelID}, { $pull: {msgs:msg}}, function (err, reply) {
            });
        }
    }

    function handleEditMessage(editedMsg,message,username,channelID){
        if(username === message[0].sender){
            client.lrange(channelID, 0, -1, function(err, reply) {                       
                reply.map((item,i)=>{
                    var it = JSON.parse(item)
                    var sender = it[Object.keys(it)[0]];
                    var mesg = it[Object.keys(it)[1]];
                    var time = it[Object.keys(it)[2]];
                    var bookmarkStatus = it[Object.keys(it)[3]];
                    //var id = it[Object.keys(it)[4]];
                    var new_msg = {
                        sender: sender,
                        msg: editedMsg,
                        TimeStamp: time
                    }
                    if(sender === message[0].sender && mesg === message[0].msg && time === message[0].TimeStamp && bookmarkStatus === message[0].bookmarkStatus)
                    {
                        arr.push(JSON.stringify(new_msg));
                    }
                    else{
                        arr.push(item);
                    }
                    client.del(channelID);
                    arr.map((item,i)=>{
                        client.rpush(channelID, item,function(err, reply) { 
                        });
                    })
                });
            });
            arr=[];

            //Edit if message is in Mongo
            ChatHistorymodel.update({channelname:channelID,'msgs._id':message[0]._id},{$set:{'msgs.$.msg':editedMsg}},function(err,reply){
                console.log("reply",reply)
            });
        }
    }

    function saveBookmarks(booklist, userName, channelID) {
        //Changing bookmark status in chathistory
        console.log(booklist)
        client.lrange(channelID, 0, -1, function(err, reply) {                       
            reply.map((item,i)=>{
                var it = JSON.parse(item)
                var sender = it[Object.keys(it)[0]];
                var mesg = it[Object.keys(it)[1]];
                var time = it[Object.keys(it)[2]];
                var bookmarkStatus = it[Object.keys(it)[3]]
                //var id = it[Object.keys(it)[4]];
                var new_msg = {
                    sender: sender,
                    msg: mesg,
                    TimeStamp: time,
                    bookmarkStatus:true
                }
                if(sender === booklist.sender && mesg === booklist.msg && time === booklist.TimeStamp && bookmarkStatus === booklist.bookmarkStatus)
                {
                    arr.push(JSON.stringify(new_msg));
                }
                else{
                    arr.push(item);
                }
                client.del(channelID);
                arr.map((item,i)=>{
                    client.rpush(channelID, item,function(err, reply) { 
                    });
                })
            });
        });
        arr=[];

        //Edit if booklist is in Mongo
        ChatHistorymodel.update({channelname:channelID,'msgs._id':booklist._id},{$set:{'msgs.$.bookmarkStatus':true}},function(err,reply){
            console.log("reply",reply)
        });
        //saving bookmark in bookmarkschema
        bookmarkData.findOne({ userName: userName }, function(err, reply) {
            //console.log("reply", reply, booklist);
            if (reply == null) {
                let a = {
                    channelid: channelID,
                    sender: booklist.sender,
                    timestamp: booklist.TimeStamp,
                    msg: booklist.msg
                };
                let bm = new bookmarkData({
                    userName: userName,
                    bookmark: a
                });
                bm.save(function(err, rply) {
                    if (err) {
                        console.log("error in saving bookmark");
                    } else {
                        console.log("Successfully data saved in bookmark");
                    }
                    socket.emit("receiveBoomarkHistory", rply);
                })
            } else {
                let a = {
                    channelid: channelID,
                    sender: booklist.sender,
                    timestamp: booklist.TimeStamp,
                    msg: booklist.msg
                };
                bookmarkData.update({ userName: userName }, { $push: { bookmark: a } }, function(err, reply) {
                    console.log("Updated");
                })
            }
        });
    }
    socket.on("bookmarkHistory",function(userName,channelName){
      bookmarkData.find({userName:userName},function(err,reply){
        socket.emit("receiveBoomarkHistory",reply);
      })
    })


    function tokenSearch(username, summary, location, sd, ed) {
        GoogleAToken.findOne({ username: username }, function(err, reply) {
            if (reply == null) {
                socket.emit('noToken', username, summary, location, sd, ed);
            } else {
                //console.log('else ', reply.token);
                gfunction(oauth2Client, username, summary, location, sd, ed);
            }
        });
    }

    function gfunction(oauth2Client, username, summary, location, sd, ed) {
        GoogleAToken.findOne({ username: username }, function(err, reply) {
            if (reply == null) {
                refreshToken(oauth2Client);
            } else {
                oauth2Client.credentials = reply.token;
                createEvent(oauth2Client, summary, location, sd, ed);
            }
        });
    }



    function refreshToken(oauth2Client) {
        oauth2Client.refreshAccessToken(function(err, token) {
            if (err) {
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            createEvent(oauth2Client, summary, location, sd, ed);

        });
    }

    function storeToken(username, token) {
        GoogleAToken.update({ username: username }, { $set: { token: token } }, { upsert: true }, function(err, reply) {});
    };

    function createEvent(auth, summary, location, sd, ed) {
        //console.log('sd : ', sd);
        //console.log('ed : ', ed);
        var event = {
            'summary': summary,
            'location': location,
            'description': 'Remainder created by BoB !!!',
            'start': {
                'dateTime': sd,
                'timeZone': 'America/Los_Angeles',
            },
            'end': {
                'dateTime': ed,
                'timeZone': 'America/Los_Angeles',
            },
            "reminders": {
                "useDefault": "useDefault"
            }
        };

        calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            resource: event,
        }, function(err, event) {
            if (err) {
                return;
            }
            socket.emit('eventCreated', event.htmlLink);
        });
    }

    function listEvents(auth) {
        var calendar = google.calendar('v3');
        calendar.events.list({
            auth: auth,
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        }, function(err, response) {
            if (err) {
                return;
            }
            var events = response.items;
            if (events.length == 0) {} else {
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    var start = event.start.dateTime || event.start.date;
                }
            }
        });
    }

    function newChannel(username, projectName, channelName, type) {
        //console.log("newChannelEvent parameters : ", username, projectName, channelName);
       
        let channel = projectName + '#' + channelName;
        let project = projectName + "#general";

        ChannelInfo.find({ channelName: channel }, (err, reply) => {
            if (!(reply == undefined || reply.length == 0))
                socket.emit('errorOccured', "Channel already present");
            else {
                if (type == "public") {

                    ChannelInfo.find({ channelName: project }, function(err, reply) {
                        addMembers(username, channel, reply[0].members, type);

                        let ob = {
                            newDM: projectName + "#" + channelName,
                            toId: reply[0].members,
                            lat: new Date()
                        }
                        //console.log("pushing this object via redis :", ob);
                        client.publish(projectName + "#general", JSON.stringify(ob)); //published chaaneel name via redis topic.
                        //added end here.
                        UserInfo.findOne({ username: username }, function(err, reply) {
                            socket.emit('updatedChannelList', reply.channelList);

                        })
                    })

                } else if (type == 'private') {
                    UserInfo.findOneAndUpdate({ username: username }, { $push: { channelList: channel } }, function(err, reply) {
                            let pn = channel;
                            let a = "lat." + pn;
                            var obj = {};
                            obj[a] = new Date();
                            LatList.update({ username: username }, { $set: obj }, function(err, reply) {
                                let a = [];
                                a.push(username);
                                let channelinfo = new ChannelInfo({
                                    channelName: channel,
                                    members: a,
                                    admin: username,
                                    requests: [],
                                    type: type
                                });
                                channelinfo.save(function(err, reply) {
                                    UserInfo.findOne({ username: username }, function(err, reply) {
                                        socket.emit('updatedChannelList', reply.channelList);
                                    })
                                })
                            })
                        })
                        let ob = {
                        newDM: channel,
                        toId: [username],
                        lat: new Date()
                    }
                    //console.log("pushing this object via redis :", ob);
                    client.publish(projectName + "#general", JSON.stringify(ob)); //published chaaneel name via redis topic.
                    //added end here.
                }
                sub.subscribe(channel);

            }
        });
    }

    function feedbackManager(obj) {
        let feedback = new Feedback({
            name: obj["name"],
            comment: obj['comment']
        });
        feedback.save(function(err, reply) {});
    }

    function handleMessage(channel, message) { //message is text version of the message object.
        message = JSON.parse(message);
        //console.log("received in redis topic: ", message);

        if (message.hasOwnProperty('newDM'))
            socket.emit('joinedNewChannel', message);
        else
            socket.emit('takeMessage', channel, message);
    }

    function handleSubscribe(channel, count) { //count is the total number channels user is subscribed to.
        //currently this is empty.
    }

    function handleUnsubscribe(channel, count) { //count is the number of remaining subscriptions.
        pub.publish('channel1', `User with socket id: ${socket.id} has unsubscribed`);
    }
    // FIXME: rewrite without using io
    function handleSendMessage(sender, channelID, msg) { //it will publish to the given channel and put it in database.FIXME:see 50 limit has reached
        let date = new Date();
        let obj = {};
        obj = {'sender': sender, 'msg': msg, 'TimeStamp': date, 'bookmarkStatus': false } //-and if reached put it to mongoDB. Better write this function again.
        pub.publish(channelID, JSON.stringify(obj));
        pushToRedis(channelID, obj);
        // let url = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/cfab6737-9b9c-4f38-9119-b834418fc8e8?subscription-key=2e2d4fc5300843e4a29b3bc644edad19" + "&q=" + msg + "&verbose=true",
        //     summary = '',
        //     location = '';
        //    ajax.get(url).end((error,response)=>{
        //   if(response){
        //     console.log('inside response');
        //     //Add Reminder START ---------->
        //     if(response.body.topScoringIntent.intent === "Add Reminder"){
        //       if(response.body.entities.length>=1){
        //         if (response.body.entities[0].type==="builtin.datetime.date") {
        //           summary='',location='';
        //         }
        //         else if(response.body.entities[0].type==="meeting::summary"){
        //           summary = response.body.entities[0].entity;
        //         }
        //         else if (response.body.entities[0].type==="meeting::location") {
        //           location = response.body.entities[0].entity;
        //         }
        //         else if (response.body.entities[1].type==="meeting::summary") {
        //           summary = response.body.entities[1].entity;
        //         }
        //         else if(response.body.entities[1].type==="meeting::location"){
        //           location = response.body.entities[1].entity;
        //         }
        //         socket.emit('confirmSetRemainder', response.body.dialog.status.toUpperCase(), summary, location);
        //       }
        //     }
        //     //Add Reminder END ---------->

        //     //Tasks START ---------->
        //     else if(response.body.topScoringIntent.intent === "showTask"){
        //       console.log('inside show task');
        //       Tasks.findOne({channelName: channelID}, function(err, reply){
        //         let task=[];
        //         if (reply!==null) {
        //           console.log('tasks : ',reply.tasks);
        //           socket.emit('confirmStickyTasks', reply.tasks);
        //         }
        //         else {
        //           console.log('empty task array');
        //           socket.emit('confirmStickyTasks', task);
        //         }
        //       });
        //     }
        //     //Tasks END ---------->
        //   }
        // });
    }

    function handleTyping(name, channelId) { //emit the typing event to all connected users.
        // io.emit('typing', name,channelId);
        pub.publish(channelId, JSON.stringify({ "typer": name }));
    }

    function handleDisconnect(socket) {
        let obj = {};
        let prev = 'lat.' + currentChannelName;
        obj[prev] = new Date();
        LatList.findOneAndUpdate({ username: currentUser }, { $set: obj }, function(err, reply) {

            UserInfo.findOneAndUpdate({ username: currentUser }, { $set: { currentChannel: currentChannelName } }, function(err, reply) {});
        });

    }

    function handlegetUnreadNotification(msg) { //FIXME: Write again.
        client.hgetall(msg.user + "/unreadNotifications", function(err, reply) {
            socket.emit('unreadNotification', reply);
        });
    }

    function handleReceiveChatHistory(msg) {
        if (msg.pageNo === "initial_primary") {
            getRedisHistory(msg);

        } else if (msg.pageNo === "initial_secondary") {
            getMongoHistory(msg);
        } else {
            getMongoHistory(msg);
        }

    }

    function handlegetUnreadNotification(msg) {
        client.hgetall(`${msg.user}/unreadNotifications`, function(err, value) {
            socket.emit('unreadNotification', value);
        });
    }

    function handleResetNotification(msg) {
        client.hset(msg.user + "/unreadNotifications", msg.key, "0");
        client.hgetall(msg.user + "/unreadNotifications", function(err, reply) {
            socket.emit('resetNotification', reply);
        });
    }

    //

    function getMongoHistory(msg) {

        if (msg.pageNo === "initial_secondary") {
            ChatHistorymodel.find({channelname:msg.channelName}).sort({ _id: -1 }).limit(1).exec((err, reply) => {
                if (reply.length === 0) {
                    socket.emit('historyEmpty');
                } else {
                    socket.emit('chatHistory', reply[0].msgs, reply[0]._id);
                }
            });

        } else {
            ChatHistorymodel.find({ _id: msg.pageNo }, function(err, reply) {
                if (reply[0].p_page === null) {
                    socket.emit('historyEmpty');
                } else {
                    ChatHistorymodel.find({ _id: reply[0].p_page }, function(err, reply) {
                        socket.emit('chatHistory', reply[0].msgs, reply[0]._id);
                    });
                }
            });
        }
    }

    function getRedisHistory(msg) {
        client.lrange(msg.channelName, 0, -1, function(err, reply) {
            if (reply == "") {

                socket.emit('pempty', "initial_secondary");

            } else {
                let messages = reply.map((element, i) => {
                    return JSON.parse(element);
                });
                socket.emit('chatHistory', messages, "initial_secondary");
            }
        });
    }

    socket.on('login', function(usrname) {
        //console.log("first line onlt", usrname,projectName);
        sub.subscribe('general');
        currentUser=usrname;
        let lat = null;
        let loginTime = new Date().getTime();
        let gitChannelStatus=false;
        let repos=[];
        //currentChannel=projectName+"#general";
        LatList.findOne({ username: usrname }, function(err, res) {
                if (res != null) {
                    lat = res.lat;
                    //console.log(lat,"This is lat")
                }

            //search the DB for username
        UserInfo.findOne({ username: usrname }, function(err, reply) {
            console.log(reply.gitChannelStatus,reply.repos,"Login Event");
            gitChannelStatus=reply.gitChannelStatus;
            currentChannelName=reply.currentChannel;
            repos=reply.repos;
            let avatars={};
            var botChannel = currentChannelName.split("#");
            if(botChannel[1] != 'Bob-Bot'){
                ChannelInfo.findOne({channelName:currentChannelName},function(err,rep){

            

                    console.log(usrname,currentChannelName,rep.members,"UsserNammeeee");
                    var channelList = reply.channelList;
                    async.each(reply.channelList, function(item, callback) {
                        sub.subscribe(item);
                        let a = item;
                        client.lrange(item, 0, -1, function(err, res) {
                            let count = 0;
                            res.forEach(function(item, i) {
                                item = JSON.parse(item);
                                if (new Date(item.TimeStamp).getTime() > new Date(lat[a]).getTime()) {
                                    count++;
                                }
                            });

                            unreadCount[a] = count;
                            callback();
                        });

                        },function(err){
                           async.each(rep.members,function(member,callback){
                              UserInfo.findOne({username:member},function(err,response){
                                //console.log(response.avatar);
                                avatars[member]=response.avatar;
                                //console.log(avatars);
                                 callback();
                              })
                             
                          },function(err){
                           // console.log(channelList,unreadCount,lat,currentChannelName,avatars,gitChannelStatus,repos);
                          socket.emit('channelList', channelList, unreadCount, lat,currentChannelName,avatars,gitChannelStatus,repos);
                        })
                })
           // function getAvatars(callback){
             
            //}
            // async.waterfall([getAvatars],function(err,reply){
            //   console.log(avatars,"Login");
              
            // })
                //client.lpush("###"+usrname,socket);
                //console.log("Login",avatars);
                
            });
            }
          });

         })
   })

    socket.on('currentChannel', function(currentChannel, prevChannel, userName) {

        let avatars = {}
        currentChannelName = currentChannel;
        let d = new Date();
        unreadCount[prevChannel] = 0;
        unreadCount[currentChannel] = 0;
        //prevChannelLAT=new Date();
        let prev = 'lat.' + prevChannel;
        let current = 'lat.' + currentChannel;
        let obj = {};
        obj[prev] = new Date();
        obj[current] = new Date();
        LatList.findOneAndUpdate({ username: userName }, { $set: obj }, function(err, reply) {});
        ChannelInfo.findOne({ channelName: currentChannel }, function(err, reply) {
            var botChannel = currentChannel.split("#");
            console.log('current channelName: ',botChannel)
            if(botChannel[1] != 'Bob-Bot'){
                async.each(reply.members, function(member, callback) {
                    //console.log(member,"0000");
                    UserInfo.findOne({ username: member }, function(err, res) {
                        //console.log(res.avatar);
                        avatars[member] = res.avatar;
                        //console.log(avatars);
                        callback();
                    })
                    }, function(err) {
                    //console.log(currentChannel,prevChannel,prevChannel,d,avatars,"Update");
                    socket.emit("updateUnread", currentChannel, prevChannel, d, avatars);

                })
            }

            
        })

        //console.log(avatars);

    });


    socket.on("getProjectName", function(userName) {
        ChannelInfo.find({}, function(err, reply) {
            var projectList = reply;
            var users = [];
            var projects = [];
            // var usersProjects=[];
            reply.map(function(item) {
                    if (projects.indexOf(item.channelName.split('#')[0]) == -1) {
                        projects.push(item.channelName.split('#')[0]);
                    }
                })
                //usersProjects=projects;

            // UserInfo.findOne({username:userName},function(err,res){
            //    res.channelList.map(function(item){
            //     if(usersProjects.indexOf(item.split('#')[0])==-1){
            //         usersProjects.push(item.split('#')[0]);
            //     }
            // })
            UserInfo.find({}, function(err, reply) {
                //console.log("Users",reply);
                reply.map(function(item) {
                        users.push(item.username);
                    })
                    //console.log(projects,"projects",usersProjects,"List of Projects");
                socket.emit("takeProjectList", projects, users);
            })

        })





    })

    function addMembers(userName, projectName, membersList, type) {
        let project = projectName;
        let obj = {};
        obj[project] = new Date();
        async.each(membersList, function(member, callback) {
            UserInfo.findOneAndUpdate({ username: member }, { $push: { channelList: project } }, function(err, reply) {
                let pn = project;
                let a = "lat." + pn;
                var obj = {};
                obj[a] = new Date();
                LatList.update({ username: member }, { $set: obj }, function(err, reply) {})
                callback();
            });
        }, function(err) {
            let channel = new ChannelInfo({
                channelName: project,
                members: membersList,
                admin: userName,
                requests: [],
                type: type
            });
            channel.save(function(err, reply) {})
        })
    }

    socket.on("addNewUser", function(userName, projectName, membersList, avatar) {
        let repositary=[];
      request.get("https://api.github.com/users/"+userName+"/repos").end((err,res)=>{
    async.each(res.body,function(repos,callback){
    repositary.push(repos.name);
    callback();
  },function(err){

  console.log("Repos ",repositary);

        UserInfo.findOne({ username: userName }, function(err, reply) {
            if (reply == null) {
               // console.log(avatar, "AAA");
                let a = [];
                a.push(projectName + "#general");
                a.push(projectName + "#Bob-Bot#" + userName);
                let user = new UserInfo({
                    username: userName,
                    channelList: a,
                    currentChannel: projectName + "#general",
                    avatar: avatar,
                    gitChannelStatus:false,
                    repos:repositary
                });
                user.save(function(err, reply) {
                    let pn = projectName + "#general";
                    let latob = {};
                    latob[pn] = new Date();
                    let lat = new LatList({
                        username: userName,
                        lat: latob
                    });
                    console.log("Channel Saving");
                    let channel = new ChannelInfo({
                        channelName: projectName + "#general",
                        members: membersList,
                        admin: userName,
                        requests: [],
                        type: "private"
                    });

                    channel.save(function(err, reply) {
                       let b=[];
                       b.push(userName);
                       let channelBot = new ChannelInfo({
                       channelName: projectName + "#Bob-Bot#"+userName,
                       members:b,
                       admin: userName,
                       requests: [],
                       type: "private"
                   });

                    channel.save(function(err, reply) {
                        lat.save(function(err, reply) {
                            let members = membersList;
                            let a = members.indexOf(userName);
                            members = members.splice(a, 1);
                            async.each(membersList, function(member, callback) {
                                UserInfo.findOneAndUpdate({ username: member }, { $push: { channelList: projectName + "#general" } }, function(err, reply) {
                                    let pn = projectName + "#general";
                                    let a = "lat." + pn;
                                    var obj = {};
                                    obj[a] = new Date();
                                    LatList.update({ username: member }, { $set: obj }, function(err, reply) {})
                                });
                            })
                            console.log("Channel Saved");
                        })

                    })
                })
                })
                console.log("sending added via channel ", "#general"); //sending via system gen channel."general"
                let ob = {
                    newDM: projectName + "#" + "general",
                    toId: membersList,
                    lat: new Date()
                }
                console.log("pushing this object via redis :", ob);
                client.publish("general", JSON.stringify(ob)); //published chaaneel name via redis topic.
                sub.subscribe(projectName + "#" + "general"); //subscribe the admin
            } else {
               addMembers(userName, projectName + "#general", membersList, "private");
                  console.log("sending added via channel ", "#general"); //sending via system gen channel."general"
                let ob = {
                    newDM: projectName + "#" + "general",
                    toId: membersList,
                    lat: new Date()
                }
                console.log("pushing this object via redis :", ob);
                client.publish("general", JSON.stringify(ob)); //published chaaneel name via redis topic.
                sub.subscribe(projectName + "#" + "general"); //subscribe the admin
            }
        })
        })
})
    })

    socket.on("getMembersList", function(channelName) {
        ChannelInfo.find({ channelName: channelName }, function(err, reply) {
            socket.emit("takeMembersList", reply[0].members);
        })
    })

    socket.on("addMembers", function(channelName, membersList) {
       console.log(channelName,"  ",membersList);
        let members = membersList;
        async.each(membersList, function(member, callback) {
            UserInfo.findOneAndUpdate({ username: member }, { $push: { channelList: channelName } }, function(err, reply) {
                let pn = channelName;
                let a = "lat." + pn;
                var obj = {};
                obj[a] = new Date();
                LatList.update({ username: member }, { $set: obj }, function(err, reply) {
                    ChannelInfo.findOneAndUpdate({ channelName: channelName }, { $push: { members: member } }, function(err, reply) {})
                })

            })
        })
        console.log("sending added via channel ", channelName); //sending via system gen channel."general"
        let ob = {
            newDM: channelName,
            toId: members,
            lat: new Date()
        }
        console.log("pushing this object via redis :", ob);
        client.publish(channelName.split('#')[0] + "#general", JSON.stringify(ob)); //published chaaneel name via redis topic.
    })

    socket.on("leaveGroup", function(projectName, userName) {
        //console.log(projectName,userName,"Inside Leave Group");
        UserInfo.findOne({ username: userName }, function(err, reply) {
            let a = reply.channelList;
            let b = a.indexOf(projectName);
            a.splice(b, 1);
            UserInfo.findOneAndUpdate({ username: userName }, { $set: { channelList: a } }, function(err, reply) {
                ChannelInfo.findOne({ channelName: projectName }, function(err, res) {
                    let c = res.members;
                    let d = c.indexOf(userName);
                    c.splice(d, 1);
                    ChannelInfo.findOneAndUpdate({ channelName: projectName }, { $set: { members: c } }, function(err, reply) {
                        UserInfo.findOne({ username: userName }, function(err, reply) {
                            //console.log(reply,"Emitting Channel List");
                            // reply.channelList = reply.channelList.filter((item, i) => {
                            // if ((item.split('#'))[0] === projectName.split("#")[0]) {
                            // return item;
                            //    }
                            //   });
                            socket.emit('updatedChannelList', reply.channelList,reply.gitChannelStatus);
                        });
                    })
                })
            })
        })
    })

    //Gowtham -- GetGitHubNotifications STARTS ---------->
    socket.on("createGitChannel",function(userName,projectName){
      //console.log(userName,projectName,repos);
      let channel = new ChannelInfo({
                    channelName: projectName+"#GitHub#"+userName,
                    members: userName,
                    admin:userName,
                    requests:[],
                    type:"private"
                });
                channel.save(function(err,reply){
                  UserInfo.findOneAndUpdate({username:userName},{$push:{channelList:projectName+"#GitHub#"+userName}},function(err,res){
                    UserInfo.findOneAndUpdate({username:userName},{$set:{gitChannelStatus:true}},function(err,res){
                      UserInfo.findOne({username:userName},function(err,reply){
                        socket.emit('updatedChannelList', reply.channelList,reply.gitChannelStatus);
                      })
                    })
                  })
                })
    })

   socket.on("GetGitHubNotifications",function(userName){
      console.log("Get "+userName+"'s Notifications");
      GitChannel.findOne({userName:userName},function(err,reply){
        if(reply!=null){
        console.log(reply.message);
        socket.emit("takeGitHubNotifications",reply.message);
    }
      })
    })
  //Gowtham -- GetGitHubNotifications END ---------->
socket.on("BotMessage",function(sender, channelID, msg){
    let date = new Date();
    var syntaxDB = ['c', 'c++', 'c#', 'java', 'javascript', 'python', 'ruby', 'swift', 'go'];
    console.log("date", date)
    let obj = {};
    let oxyReply="";
    obj = {'sender': sender, 'msg': msg, 'TimeStamp': date } //-and if reached put it to mongoDB. Belowtter write this function again.
     console.log(obj,"Object---->");
    pub.publish(channelID, JSON.stringify(obj));
    pushToRedis(channelID, obj);
    //console.log(msg);
    aiclient.textConverse(msg)
    .then(function(res) {
    // get the next reply your bot can respond
    console.log(res.entities,"----");
    let name=[];
    if(res.entities.length>0){
        for( i=0;i<res.entities.length;i++){
            name.push(res.entities[i].name);
        }
    }
    console.log(name,"Array of Names");
    //console.log(res.entities[0].name,"Bot's REply");
    if(res.entities.length==0){
        //console.log("NULLLL");sea of blue song
        obj = {'sender': "Bob-Bot", 'msg': "Please give any domain name!!!!!!", 'TimeStamp': date }
        pub.publish(channelID, JSON.stringify(obj));
        pushToRedis(channelID, obj);
    }
    else if(res.entities[0].name==='wish'){
        obj = {'sender': "Bob-Bot", 'msg': res.reply(), 'TimeStamp': date }
        pub.publish(channelID, JSON.stringify(obj));
        pushToRedis(channelID, obj);
    }
    else if(name.includes("concepts")){
        var a=[];
        var index=name.indexOf("concepts")
        let b=res.entities[index].value;
        console.log(b,"Domain Name");
        var item = b.toLowerCase().charAt(0).toUpperCase()+b.toLowerCase().substr(1);
        var language = item.toLowerCase();
        var concept = 'array';
        if(syntaxDB.indexOf(language.toLowerCase())>=0){            
            request.get('https://syntaxdb.com/api/v1/languages/'+language+'/concepts/search?q='+concept+'&fields=syntax&limit=1')
                .end((err, res) => {
                    console.log(err, res && res.body)
                })
        }


        a.push(item);
        request.post("http://oxygen.blr.stackroute.in/domain/documents/Java").send(
        {"domainName": item, "reqIntents": [], "reqConcepts": a, "allIntents": ["Learning"]}
        ).end((req,res)=>{
        console.log("Success-----Oxygen's Response",res.body);
      
        async.each(res.body,function(item,callback){
            //console.log("Inside async.each");
        oxyReply+=item.title+" "+item.url+"*#%&%#*";
        callback();
    },
    function(err){
        console.log("callback");
        obj = {'sender': "Bob-Bot", 'msg': {
            url:oxyReply,format:'oxygen'
        }, 'TimeStamp': date } //-and if reached put it to mongoDB. Better write this function again.
        pub.publish(channelID, JSON.stringify(obj));
        pushToRedis(channelID, obj);
    })
    })
    }
    else{
        obj = {'sender': "Bob-Bot", 'msg': "Please give any domain name!!!!!!", 'TimeStamp': date }
          pub.publish(channelID, JSON.stringify(obj));
           pushToRedis(channelID, obj);
    }
    
  
  })


   })

}

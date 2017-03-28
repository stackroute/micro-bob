import {List, ListItem,makeSelectable} from 'material-ui/List';
import { Grid, Row, Col} from 'react-flexbox-grid/lib';
import ChannelList from './ChannelList.jsx';
import ChatArea from './ChatArea.jsx';
import Header from './Header.jsx';
import RaisedButton from 'material-ui/RaisedButton';
import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import TextField from 'material-ui/TextField';
import async from 'async';
import cookie from 'react-cookie';
import ProjectsList from './ProjectsList.jsx';
import SwipeableViews from 'react-swipeable-views';

var base64 = require('base-64');
var utf8 = require('utf8');

export default class Bob extends React.Component{
  
  constructor(props)
  {
    super(props);
  
     var a=cookie.load("Token");
     var b=base64.decode(a.split('.')[1]);
     var c=utf8.decode(b);
     var d=a.split("#")[1];
    this.state={
      userName:c,
      channelsList:[],
      currentChannel:"",
      unreadCount:{},
      lat:{},
      avatars:{},
      snackbarData:"",
      openSnackbar:false,
      gitChannelStatus:false,
      repos:[],
      slideIndex:0,
      
    };
    this.toggleCurrentChannel=this.toggleCurrentChannel.bind(this);
    this.handleChange=this.handleChange.bind(this);
    this.resetCurrentChannelUnread=this.resetCurrentChannelUnread.bind(this);
    this.handleReposChange=this.handleReposChange.bind(this);
    this.handleToggle=this.handleToggle.bind(this);
  }
  componentDidMount(){
    let that=this;
    this.context.socket.on('channelList', function (list,unreadCount,lat,currentChannel,avatars,gitChannelStatus,repos) {
    that.setState({channelsList:list,unreadCount:unreadCount,lat:lat,currentChannel:currentChannel,avatars:avatars,gitChannelStatus:gitChannelStatus,repos:repos});
    cookie.save('projectName',currentChannel.split('#')[0]);
    that.resetCurrentChannelUnread(that.state.unreadCount);

    });

    this.context.socket.on("updateUnread",function(currentChannel,prevChannel,d,avatars){
      let temp=that.state.lat;
      let unread=that.state.unreadCount;
      temp[prevChannel]=d;
      unread[prevChannel]=0;
      that.setState({lat:temp,unreadCount:unread,avatars:avatars})
      that.resetCurrentChannelUnread(that.state.unreadCount);
    });

    this.context.socket.on("listenToMessage",function(channelList,channelName){
      if(channelList.indexOf(channelName)!=-1){
        var temp=that.state.unreadCount;
        temp[channelName]++;
        that.setState({unreadCount:temp});
      }

      that.resetCurrentChannelUnread(that.state.unreadCount);
    });

    this.context.socket.on('updatedChannelList', function(channel,status){
      let a=channel.length;
      if(channel[a-1].split("#")[1]=="GitHub"){
        that.setState({channelsList: channel,currentChannel:channel[a-2],gitChannelStatus:status});
      }
      else{
      that.setState({channelsList: channel,currentChannel:channel[a-1],gitChannelStatus:status});
      }
    });

    this.context.socket.on('joinedNewChannel',function(message){ 
      if(message.toId.includes(that.state.userName))
      {
        that.snackbar("You are added to a new Channel '"+message.newDM);  
        that.context.socket.emit('subscribeMe',message.newDM);
        that.setState((prevState,props)=>{
          prevState.channelsList.push(message.newDM);
          prevState.lat[message.newDM] = message.lat;
          prevState.unreadCount[message.newDM] = 0;
          return {channelsList:prevState.channelsList,lat:prevState.lat,unreadCount:prevState.unreadCount};
        });
      }
    });

    this.context.socket.on('errorOccured',function(data){
      that.snackbar(data);
    });
    this.context.socket.emit("login",this.state.userName,cookie.load('projectName'));
  }
  
  resetCurrentChannelUnread(unreadCount){
      var temp=unreadCount;
      var channel=this.state.currentChannel;
      let that=this;
      setTimeout(function(){
        temp[channel]=0;
        that.setState({unreadCount:temp});
       }.bind(this),500);
  }

  handleChange(e){
    this.setState({userName:e.target.value})
  }
  handleRequestClose(){
    this.setState({openSnackbar:false});
  }

  handleClick(){
    this.context.socket.emit("login",this.state.userName);
  }

  toggleCurrentChannel(item,prevChannel){
    this.setState({currentChannel:item});
    this.context.socket.emit('currentChannel', item,prevChannel,this.state.userName);
  }

  handleLiveUnreadCount(channelID){
    this.setState((prevState,props)=>{
      return prevState.unreadCount[channelID]++;
    });
  }

  handleToggle(){
    if(this.state.slideIndex === 1)
      this.setState({slideIndex:0});
    else
      this.setState({slideIndex:1});
  }

  handleReposChange(repos){
    this.setState({repos:repos})
  }

  snackbar(data){ 
    this.setState({openSnackbar:true,snackbarData:data});
    window.setTimeout(()=>{this.setState({openSnackbar:false})},4000)
  }

  pushChannel(channel){ 
    this.setState((prevState,props)=>{
      prevState.channelsList.push(channel);
      return {channelsList:prevState.channelsList};
    });
  }
  

  render(){ 
    let chatArea;
    let channels = null;
    if(this.context.socket!=null && this.state.currentChannel!=""){   
      chatArea = (
        <Grid  style={{height:"91.5vh",width:"100%",margin:"0px"}}>
          <Row style={{height:"100%",width:"100%"}}>
            <Col xs={2} sm={2} md={2} lg={2} style={{height:"100%",padding:"0px"}}>
              <SwipeableViews index={this.state.slideIndex} onChangeIndex={this.handleToggle}>
                <div><ProjectsList projects={this.state.channelsList} 
                            currentChannel={this.state.currentChannel}
                            setCurrentChannel={this.toggleCurrentChannel}
                            handleToggle={this.handleToggle} /></div>
                <div><ChannelList 
                    socket={this.context.socket}
                    userName={this.state.userName}
                    channelList={this.state.channelsList}
                    currentChannel={this.state.currentChannel}
                    unreadCount={this.state.unreadCount}
                    setCurrentChannel={this.toggleCurrentChannel}
                    snackbar = {this.snackbar.bind(this)}
                    pushChannel = {this.pushChannel.bind(this)}
                    gitChannelStatus={this.state.gitChannelStatus}
                    repos={this.state.repos}
                    reposUpdate={this.handleReposChange}
                    handleToggle={this.handleToggle.bind(this)}                                                             
                  /></div>
              </SwipeableViews>              
            </Col>
            {channels}
            <Col xs={10} sm={10} md={10} lg={10} style={{height:"100%",padding:"0px"}}>
              <ChatArea avatars={this.state.avatars} 
                        channelID={this.state.currentChannel} 
                        socket={this.context.socket}
                        LiveUnreadCount={this.handleLiveUnreadCount.bind(this)} 
                        userName={this.state.userName}
                        presentChannel={this.state.currentChannel}/>
            </Col>
          </Row>
        </Grid>
      );
    }
    else
    {
      chatArea=null;
    }

    return(
      <div>
      <Grid style={{height:'100%',width:"100%"}}>
        <Row style={{width:"100%",padding:"0px",margin:"0px"}}>
          <Col xs={12} sm={12} md={12} lg={12} style={{height:'100%',padding:"0px",margin:"0px"}}>
            {chatArea}
          </Col>
        </Row>
        <Snackbar
          open={this.state.openSnackbar}
          message={this.state.snackbarData}
          autoHideDuration={4000}
          onRequestClose={this.handleRequestClose.bind(this)}
        />
      </Grid>
      </div>
    );
  }
}

Bob.contextTypes = {
  socket:React.PropTypes.object
};
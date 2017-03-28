import React, {PropTypes,Component} from 'react';
import {List, ListItem,makeSelectable} from 'material-ui/List';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Badge from 'material-ui/Badge';
import SelectField from 'material-ui/SelectField';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import FirstPage from 'material-ui/svg-icons/navigation/first-page';
import ArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import ViewList from 'material-ui/svg-icons/action/view-list';
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Subheader from 'material-ui/Subheader';
import { Grid, Row, Col} from 'react-flexbox-grid/lib';
import Paper from 'material-ui/Paper';
import AppBar from 'material-ui/AppBar'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import request from 'superagent'; 
import cookie from 'react-cookie';
import AutoComplete from 'material-ui/AutoComplete';
import Chip from 'material-ui/Chip';

let SelectableList = makeSelectable(List);
injectTapEventPlugin();
const styles = {
  chip: {
    marginBottom: 4,
  }
}

export default class ChannelList extends React.Component{
  componentDidMount() 
  {
    this.state.localEmitter.on('channelSwap',this.handleSwapChannels);
    this.state.localEmitter.on('newChannelOpen',this.handleAddChannel);
    this.state.localEmitter.on('newChatOpen',this.handleAddDM);
    this.state.localEmitter.on('openProjectsList',this.props.handleToggle);
    request.get('http://localhost:8000/users/'+this.props.userName+'/projects/'+cookie.load('projectName')+'/siblings')
          .end((err,reply)=>{
            let res = JSON.parse(reply.text);
            if(res.result)
            {
              this.setState({userList:res.data});
            }
          });
  }
  constructor(props,context){
    super(props,context);
    this.state={
                channels:[],
                channelName:"",
                open:false,
                dOpen:false,
                type:"public",
                DMDialogInput:"",
                DMDialogOpen:false,
                userList:[],
                canAdd:false,
                searchText:"",
                addedRepos:[],
                gOpen:false,
            
                index:0,
                localEmitter:this.context.theEmitter,
               
              }
    this.handleAddChannel=this.handleAddChannel.bind(this);
    this.handleClose=this.handleClose.bind(this);
    this.handleNameChange=this.handleNameChange.bind(this);
    this.handleSubmit=this.handleSubmit.bind(this);
    this.handleDrawerOpen=this.handleDrawerOpen.bind(this);
    this.handleType=this.handleType.bind(this);
    this.handleNewRequest=this.handleNewRequest.bind(this);
    this.handleUpdateInput=this.handleUpdateInput.bind(this);
    this.handleRequestDelete=this.handleRequestDelete.bind(this);
    this.handleGitSubmit=this.handleGitSubmit.bind(this);
    this.handleAddDM=this.handleAddDM.bind(this);
    this.handleSwapChannels=this.handleSwapChannels.bind(this);
    
  }
  

  handleChange(item){ 
    var temp=this.props.currentChannel;
    if(item=="GitHub"){
    this.props.setCurrentChannel(this.props.currentChannel.split("#")[0]+"#"+item+"#"+this.props.userName,temp);
    }
    else
    {
    this.props.setCurrentChannel(this.props.currentChannel.split("#")[0]+"#"+item,temp);
    }
  }

  handleAddChannel(){
    this.setState({open:true});
  }

  handleClose(){
    this.setState({open:false, gOpen:false})
  }

  handleDMDClose(){ 
    this.setState({DMDialogOpen:false})
  }

  handleNameChange(e){
    this.setState({channelName:e.target.value})
  }

  handleAddDM(){    
    this.setState({DMDialogOpen:true});
  }

  handleDMDChange(e){     
    if(this.state.userList.includes(e))
      this.setState({DMDialogInput:e,canAdd:true});
    else
      this.setState({DMDialogInput:e,canAdd:false});
  }

  handleSubmit(){
    this.props.socket.emit('newChannel', this.props.userName,this.props.currentChannel.split("#")[0],this.state.channelName,this.state.type);
    this.setState({open:false,channelName:""})
  }

  handleDrawerOpen(name){
    if(this.state.dOpen)
    this.setState({dOpen:false});
    else
    this.setState({dOpen:true});
  }
  
  handleProjectChange(name){
    this.setState({dOpen:false});
    this.props.setCurrentChannel(name+"#"+"general",this.props.currentChannel);

  }

  handleType(event){
    this.setState({type:event.target.value});
    if(event.target.value=="gitChannel"){
      this.setState({gOpen:true,open:false});
    }
  }

  handleAddDirectMessage(){ 
    request
      .post('http://localhost:8000/users/'+ this.props.userName +'/channels') //create a new DM chat
      .send({
            "userId":this.props.userName,
            "toId":this.state.DMDialogInput,
            "project":this.props.currentChannel.split("#")[0]
        })
      .end((err,res)=>{
        if(JSON.parse(res.text).result)
          {
            this.context.socket.emit('subscribeMe',JSON.parse(res.text).channelName);
            this.props.snackbar(JSON.parse(res.text).status);
            this.props.pushChannel(JSON.parse(res.text).channelName);
          }
          else{
            this.props.snackbar(JSON.parse(res.text).status);
            console.log("adding DM failed: ",JSON.parse(res.text));
          }
      });
    this.setState({DMDialogOpen:false,DMDialogInput:""});
  }

  
  handleUpdateInput(searchText){
    this.setState({
      searchText: searchText,
    });
  }

  handleNewRequest(){
    this.state.addedRepos.push(this.state.searchText);
    var a=this.state.searchText;
    var b=this.props.repos;
    var c=b.indexOf(a);
    b.splice(c,1);
    this.props.reposUpdate(b);
    this.setState({searchText:""});
  }

  handleRequestDelete(item){
    var a=this.state.addedRepos;
    var b=a.indexOf(item);
    a.splice(b,1);
    this.setState({addedRepos:a});
    var c=this.props.repos;
    c.push(item);
    this.props.reposUpdate(c);
  }

  handleGitSubmit(){
    this.props.socket.emit('createGitChannel',this.props.userName,this.props.currentChannel.split("#")[0]);
    request.post('http://localhost:8000/user/'+this.props.userName+'/gitChannel/'+this.state.addedRepos)
    .end(function(err,res){
  
    })
  } 
  handleSwapChannels()
  {
    var localChannelsOfThisProject=[];
    localChannelsOfThisProject = this.props.channelList.filter((item,i)=>{ //get only this project channels
      return this.props.currentChannel.split('#')[0]===item.split('#')[0];
    });
    if(this.state.index <=localChannelsOfThisProject.length)
    {
      this.handleChange(localChannelsOfThisProject[this.state.index].split('#')[1]);
      this.setState({index:(this.state.index)+1});
    }
    if(this.state.index==localChannelsOfThisProject.length)
    {
      this.setState({index:0});
    }


  }
   
  render(){
  
    let display = null;
    let git;
    const actions = <RaisedButton label="Create" primary={true} onTouchTap={this.handleSubmit}/>
    if(this.props.gitChannelStatus===true)
    {
      display = (
        <Dialog title="Create Channel" actions={actions} modal={false} open={this.state.open} onRequestClose={this.handleClose}>
          <TextField hintText="Channel Name" floatingLabelText="Channel Name" value={this.state.channelName} onChange={this.handleNameChange}/><br />
          <RadioButtonGroup name="Types" defaultSelected="public" onChange={this.handleType}>
           <RadioButton value="public" label="Public"/>
           <RadioButton value="private" label="Private"/>     
          </RadioButtonGroup>
        </Dialog>
      );
    }
    else
    {
      display = (
        <Dialog title="Create Channel" actions={actions} modal={false} open={this.state.open} onRequestClose={this.handleClose}>
          <TextField hintText="Channel Name" floatingLabelText="Channel Name" value={this.state.channelName} onChange={this.handleNameChange}/><br />
          <RadioButtonGroup name="Types" defaultSelected="public" onChange={this.handleType}>
            <RadioButton value="public" label="Public"/>
            <RadioButton value="private" label="Private"/>
            <RadioButton value="gitChannel" label="GitHub Notification Channel"/>
          </RadioButtonGroup>
        </Dialog>
      );
    } 
     
    const actions1 = <RaisedButton label="Create" primary={true} onTouchTap={this.handleGitSubmit}/>
    let display1 =  
          <Dialog title="Add Repos" actions={actions1} modal={false} open={this.state.gOpen} onRequestClose={this.handleClose}>
            <AutoComplete style={{marginTop:"20px",marginBottom:"20px"}} hintText="Add" searchText={this.state.searchText}  maxSearchResults={5} onUpdateInput={this.handleUpdateInput} onNewRequest={this.handleNewRequest} dataSource={this.props.repos} filter={(searchText, key) => (key.indexOf(searchText) !== -1)} openOnFocus={true} /><br/>
              {
                this.state.addedRepos.map((item,i)=>{
                return(
                  <Chip key={i} onRequestDelete={this.handleRequestDelete.bind(this,item)} style={styles.chip}>{item}</Chip>)
                })
              }
           </Dialog>    
    let addDMActions = (<RaisedButton label="Create" primary={true} disabled={!this.state.canAdd} onTouchTap={this.handleAddDirectMessage.bind(this)}/>);
    let addDMDialog = (
      <Dialog title="Start Chat" actions={addDMActions}
        modal={false} open={this.state.DMDialogOpen}
        onRequestClose={this.handleDMDClose.bind(this)}>
        <AutoComplete hintText="Person Name" floatingLabelText="Person Name" value={this.state.DMDialogInput}
               onUpdateInput={this.handleDMDChange.bind(this)} dataSource={this.state.userList}/><br />
      </Dialog>
      );  
    let channels=[];
    channels = this.props.channelList.filter((item,i)=>{ //get only this project channels
      return this.props.currentChannel.split('#')[0]===item.split('#')[0];
    });
    let DMList = channels.filter((item,i)=>{ //get all dm channels.
      return item.split('#').length === 3 && item.split('#')[1]!=="GitHub";
    }); 
    let gitChannel =  channels.filter((item,i)=>{ //get all git channels.
      return item.split('#')[1] == "GitHub";
    });
    channels = channels.filter((item,i)=>{ //get all group channels.
      return item.split('#').length === 2;

    });
    channels = channels.concat(gitChannel); //include the git channel in channels list.

    let channelSelectable = channels;
    let DMSelectable = DMList;
    channels = channels.map((item,i)=>{ //get all group channel without project name.
      return item.split('#')[1];
    });

    let DMListfiltered = DMList.map((item,i)=>{  //get the dm filtered list.
      let index = item.split('#').indexOf(this.props.userName);
      if(index == 1)
      return item.split('#')[2];
      else
      return item.split('#')[1];
    });
      DMList = DMList.map((item,i)=>{  //display the names.
        return item.split('#')[1]+"#"+item.split('#')[2];
      });
    
    let channelList=channels.map((item,i)=>{  //this is group channfels list
        if(this.props.unreadCount[this.props.currentChannel.split("#")[0]+'#'+item]!=0&&this.props.unreadCount[this.props.currentChannel.split("#")[0]+'#'+item]!=undefined){
          return(<ListItem key={i} style={{color:"white"}} value={channelSelectable[i]} primaryText={item} onTouchTap={this.handleChange.bind(this,item)} rightIcon={<Badge badgeContent={this.props.unreadCount[this.props.currentChannel.split("#")[0]+'#'+item]} primary={true}></Badge>}/>);
        }
        else{
          return(<ListItem key={i} style={{color:"white"}} value={channelSelectable[i]} primaryText={item} onTouchTap={this.handleChange.bind(this,item)}/>);
        }
      });

      DMListfiltered = DMListfiltered.map((item,i)=>{  //this is dm channel list.
        if(this.props.unreadCount[this.props.currentChannel.split("#")[0]+'#'+DMList[i]]!=0&&this.props.unreadCount[this.props.currentChannel.split("#")[0]+'#'+DMList[i]]!=undefined)
        {
          return(
            <ListItem key={"dm"+i} value={DMSelectable[i]} primaryText={item}
            onTouchTap={this.handleChange.bind(this,DMList[i])}
            rightIcon={<Badge badgeContent={this.props.unreadCount[this.props.currentChannel.split("#")[0]+'#'+DMList[i]]}
            primary={true}></Badge>}/>
          );
        }
        else{
          return(<ListItem key={"dm"+i} value={DMSelectable[i]} primaryText={item}
            onTouchTap={this.handleChange.bind(this,DMList[i])}
            primary={true}/>
          );
        }
      });

      

       
    return(
      
      <div style={{height:'100%'}}>
       <Grid style={{height:'100%',width:"100%"}}>
                        <Paper style={{height:'91.5vh',width:"100%",background:'#616161'}}>
                         <Row style={{width:"100%"}}>
                            <Col xs={12} sm={12} md={12} lg={12} style={{height:'100%',width:"100%"}}>
                              <ArrowBack onTouchTap={this.props.handleToggle}/>
                              <Subheader style={{fontSize:"20px",color:"white"}}>Channels<IconButton iconStyle={{color:"white"}} onTouchTap={this.handleAddChannel} style={{marginLeft:"20px"}}><AddCircle/></IconButton></Subheader>
                            </Col>
                          </Row>
                          <Row style={{width:"100%"}}>
                            <Col xs={12} sm={12} md={12} lg={12} style={{height:'100%'}}>
                              {addDMDialog}
                              {display}
                              {display1}
                              <SelectableList value={this.props.currentChannel}>
                                {channelList}
                                <Subheader style={{fontSize: "18px",color:"white"}}>Direct Message
                                  <IconButton iconStyle={{color:"white"}} onTouchTap={this.handleAddDM} style={{marginLeft:"0px"}}><AddCircle/></IconButton>
                                </Subheader>
                                {DMListfiltered}     
                              </SelectableList>
                            </Col>
                          </Row>
                        </Paper>
                      </Grid>
      
        
      
      </div>
      
    );
  }
}
ChannelList.contextTypes={
  socket:React.PropTypes.object
};
ChannelList.contextTypes = {
  theEmitter: React.PropTypes.object
};
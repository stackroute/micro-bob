import React from 'react';
import {Grid, Row, Col} from 'react-flexbox-grid/lib/index';
import ChatHistory from './ChatHistory.jsx';
import NewMessage from './NewMessage.jsx';
import Chip from 'material-ui/Chip';
import Paper from 'material-ui/Paper';
import SupervisorAccount from 'material-ui/svg-icons/action/supervisor-account';
import PersonAdd from 'material-ui/svg-icons/social/person-add';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import {BottomNavigation, BottomNavigationItem} from 'material-ui/BottomNavigation';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Popover, {PopoverAnimationVertical} from 'material-ui/Popover';
import request from 'superagent';
import Dialog from 'material-ui/Dialog';
import AutoComplete from 'material-ui/AutoComplete';
import ExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import Favorite from 'material-ui/svg-icons/action/favorite';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Clear from 'material-ui/svg-icons/content/clear';
import {List,ListItem} from 'material-ui/List';
import Scrollbars from 'react-custom-scrollbars';
import FlatButton from 'material-ui/FlatButton';
import LinearProgress from 'material-ui/LinearProgress';

const styles = {
	chip: {
		marginBottom: 4,
	}
}

export default class Chat extends React.Component{
	constructor(props) 
	{
		super(props);
		this.state={typing:[],authOpen:false,eventStatus:false,eventMessage:'',
			chatHistory:[],pagesDisplayed:0,
			next:"",searchText:"",members:[],addedMembers:[],preferredCalendar:"",
			openDrawer:false,booklist:[],addOpen:false,membersOpen:false,
			membersList:[],gitStatus:false,create:false,progressState:false};

			this.handleShowMembers=this.handleShowMembers.bind(this);
			this.handleMembersClose=this.handleMembersClose.bind(this);
			this.handleAddMembers=this.handleAddMembers.bind(this);
			this.handleClose=this.handleClose.bind(this);
			this.handleUpdateInput=this.handleUpdateInput.bind(this);
			this.handleNewRequest=this.handleNewRequest.bind(this);
			this.handleSubmit=this.handleSubmit.bind(this);
			this.handleLeave=this.handleLeave.bind(this);
			this.handleSelect=this.handleSelect.bind(this);
			this.handleCallOAuth=this.handleCallOAuth.bind(this);
            this.handleCloseAuth=this.handleCloseAuth.bind(this);
            this.handleProgressStateUp=this.handleProgressStateUp.bind(this);
			this.handleProgressStateDown=this.handleProgressStateDown.bind(this);
			this.handleEventCreated = this.handleEventCreated.bind(this);
			this.handleEventStatusClose = this.handleEventStatusClose.bind(this);            
	}

	componentDidMount() {
		this.props.socket.on('someoneAdded',(name)=>{ //Sent when a user subscribes to the channel.
			this.handleSomeoneAdded(name);
		});
		this.props.socket.on('deleteMessageEvent',(i, msg)=>{ //Sent when a user subscribes to the channel.
			
			this.deleteMessage(i,msg);
		});
		this.props.socket.on('editMessageEvent',(i,newMsg,arr_1)=>{ //Sent when a user subscribes to the channel.
			console.log("editedd")
			this.editMessage(i,newMsg,arr_1);
		});
		this.props.socket.on('takeMessage',(channelID,msg)=>{ //Sent from this.props.socket server when a message is published in the redis channel.
			this.handleTakeMessage(channelID,msg);
		});
		this.props.socket.on('tokenNotFound',(pref)=>{
			this.handleCallOAuth(pref);
        });
		this.props.socket.on('chatHistory',(msg,next)=>{ //msg is an array of objects having messages from a page in mongodb.
					this.handleChatHistory(msg,next);
		});
		this.props.socket.on('pempty',(msg)=>{
			this.handlePempty(msg);
		});
		this.props.socket.on("takeMembersList",(membersList)=>{
			this.setState({members:membersList,membersOpen:true});
		});
		this.props.socket.on("receiveBoomarkHistory",(receiveBoomarkHistory)=>{
			let a=this.props.channelID;
			this.setState({booklist:receiveBoomarkHistory[0].bookmark});
		});
		this.props.socket.on("eventInserted",(msg)=>{			
			this.handleEventCreated(msg);
		});
		this.props.socket.emit('bookmarkHistory',this.props.userName,this.props.channelID);
		this.props.socket.on("takeGitHubNotifications",(history)=>{
			this.setState({chatHistory:history,gitStatus:true});
        });
	}

	componentWillReceiveProps(nextProps){
		if(this.props.channelID!=nextProps.channelID){
			let msg = {"pageNo":"initial_primary","channelName":nextProps.channelID};//increment the pages displayed currently.
			nextProps.socket.emit('receiveChatHistory',msg);
			this.setState({chatHistory:[],gitStatus:false});
		}
	}

	handleSomeoneAdded(msg){
		//currently empty.
	}
	handleCallOAuth(pref){
		this.setState({authOpen:true,preferredCalendar:pref});
	}
	handleCloseAuth(){
		this.setState({authOpen:false})
	}
	handleEventCreated(msg){
		this.setState({eventStatus:true,eventMessage:msg});
	}
	handleEventStatusClose(){
		this.setState({eventStatus:false});
	}

	handleTakeMessage(channelId,msg){
		if(channelId===this.props.channelID){
			if(msg.hasOwnProperty('typer')){
				this.handleTyping(msg.typer);
			}
			else
			{
				//msg = this.handleTime(msg);
				console.log('In chat Area: ', msg);
				if(msg.sender === 'Bob-Bot'){
					this.handleProgressStateDown();
				}
				this.setState((prevState,props)=>{
					prevState.chatHistory.push(msg);
					return {chatHistory:prevState.chatHistory};
				});
			}
		}
		else{
			if(msg.hasOwnProperty('typer')){
			}
			else
				{this.props.LiveUnreadCount(channelId);}
		}
	}
	handleChatHistory(msg,next){
		let mess = this.state.chatHistory;
		msg.forEach((msgob)=>{

			//msgob = this.handleTime(msgob);
			mess.unshift(msgob);
		});
		this.setState((prevState,props)=>{ 
			return {
				chatHistory:mess,
				pagesDisplayed:prevState.pagesDisplayed+1,
				next:next};
			});
	}

	handleToggle(){
		this.setState({openDrawer: !this.state.openDrawer});
	}

	handleTyping(name){
		if(!this.state.typing.includes(name))
		{
		this.setState((prevState,props)=>{prevState.typing.push(name); return {typing:prevState.typing};  });
		setTimeout(()=>{this.setState((prevState,props)=>{prevState.typing.shift(); return {typing:prevState.typing};  });},1000);
		} //show user is typing for 1000 milliseconds.
	}

	handlePempty(msg){
		let msg1 = {
			"pageNo":msg,
			"channelName":this.props.channelId
		};
		if(this.props.channelID.split("#")[1]!="GitHub"){
			this.props.socket.emit('receiveChatHistory',msg1);
		}
		else{
			this.props.socket.emit("GetGitHubNotifications",this.props.userName);
		}
	}

	handleShowMembers(event){
		this.setState({ anchorEl: event.currentTarget});
		this.props.socket.emit("getMembersList",this.props.channelID);
	}

	handleMembersClose(){
		this.setState({membersOpen:false});
	}

	handleAddMembers(){
		let a=this.props.channelID.split("#");
		request.get("http://localhost:8000/add/"+a[0]+"/channel/"+a[1]).end((err,res)=>{
			res=JSON.parse(res.text);
			this.setState({membersList:res.data,addOpen:true,create:false});
		})
	}


	handleUpdateInput(searchText){
		this.setState({
			searchText: searchText,
		});
	};

	handleClose(){
		this.setState({addOpen:false})
	}
	handleProgressStateUp(){
		this.setState({progressState: true})
	}
	handleProgressStateDown(){
		this.setState({progressState: false})
	}
	handleNewRequest(){
		var a=this.state.searchText;
		var b=this.state.membersList;
		var c=b.indexOf(a);
		if(c>-1){
			b.splice(c,1);
			let z = this.state.addedMembers;
			z.push(this.state.searchText);
			this.setState({membersList:b,addedMembers:z,searchText:"",create:true,addMemberError:""});
		}
		else{
			this.setState({addMemberError:"Member not present in Project"});
		}	
	}


	handleRequestDelete(item){
		var a=this.state.addedMembers;
		var b=a.indexOf(item);
		a.splice(b,1);

		this.setState({addedMembers:a});
		this.state.membersList.push(item);
	}

	handleSubmit(){
		if(this.state.addedMembers.length>0)
			{this.props.socket.emit("addMembers",this.props.channelID,this.state.addedMembers);}
		this.setState({addOpen:false,create:false});
	}

	handleLeave(){
		this.props.socket.emit("leaveGroup",this.props.channelID,this.props.userName);
	}
	handleSelect(book,event,status){
		if(status){
			this.state.booklist.push(book);
			this.props.socket.emit('saveBookmarks',book,this.props.userName,this.props.channelID,);
		}
	 	else{
 			var indexno=this.state.booklist.indexOf(book);
			this.state.booklist.splice(indexno,1);
			this.props.socket.emit('deleteBookmarks',book,this.props.userName,this.props.channelID);
		}
 	}
 	deleteMessage(i,msg){
 		let newarr = this.state.chatHistory;
		newarr.splice(i,1);
 		this.setState({chatHistory:newarr});
 	}
 	editMessage(i,newMsg,arr_1){
 		let newarr = this.state.chatHistory;
 		arr_1[0].msg = newMsg;
 		newarr.splice(i,1,arr_1[0]);
 		this.setState({chatHistory:newarr});
 	}
 	render(){
 		let typ;
 		let obj={
 			username:this.props.userName,
 		}
		if(this.state.typing.length===1){
			typ = <Chip>{this.state.typing + " is typing"}</Chip>;
		}
		else if(this.state.typing.length>1 && this.state.typing.length<6)
			typ = <Chip>{this.state.typing + " are typing"}</Chip>;
		else if(this.state.typing.length>1)
		{
			typ = <Chip>{this.state.typing.slice(0,5) + " and others are typing"}</Chip>
		}
		else
		{
			typ = null;
		}

		const actions = <RaisedButton label="Add" disable={!this.state.create} primary={true} onTouchTap={this.handleSubmit}/>
		let display =  
			<Dialog title="AddMembers" actions={actions} modal={false} open={this.state.addOpen} onRequestClose={this.handleClose}>
				<AutoComplete style={{marginTop:"20px",marginBottom:"20px"}} hintText="Add" searchText={this.state.searchText}  maxSearchResults={5} onUpdateInput={this.handleUpdateInput} onNewRequest={this.handleNewRequest} dataSource={this.state.membersList} filter={(searchText, key) => (key.indexOf(searchText) !== -1)} openOnFocus={true} /><br/>
					{this.state.addedMembers.map((item,i)=>{
					return(<Chip key={i} onRequestDelete={this.handleRequestDelete.bind(this,item)} style={styles.chip}>{item}</Chip>)
					})}
			</Dialog>
		let leave=null;
		if(this.props.channelID.split("#")[1]!="general"){
			leave=<IconButton ><ExitToApp onTouchTap={this.handleLeave}/></IconButton>
		}
		let authURL='';
        //console.log(this.state.preferredCalendar,"CALENDAR");
        const outlookAuthURL='https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=http://localhost:8000/callback&state='+JSON.stringify(obj)+'&scope=openid+offline_access+https://outlook.office.com/calendars.readwrite&response_type=code&client_id=de8ad897-a459-4bda-baa6-a98b3fc8068f';
        const googleAuthURL='https://accounts.google.com/o/oauth2/auth?redirect_uri=http://localhost:8000/oauth2callback&state='+JSON.stringify(obj)+'&response_type=code&client_id=616007233163-g0rk4o8g107upgrmcuji5a8jpnbkd228.apps.googleusercontent.com&scope=https://www.googleapis.com/auth/calendar+https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile&approval_prompt=force&access_type=offline';
        (this.state.preferredCalendar === 'google')?(authURL = googleAuthURL):(authURL = outlookAuthURL)
		const authActions=[
        <FlatButton
                label="Close"
                keyboardFocused={true}
                onTouchTap={this.handleCloseAuth}
        />,
        <FlatButton
            label="OK"   
            href={authURL}        
            primary={true}
            keyboardFocused={true}
            
        />
        ];
		return(
			
			<center style={{height:"100%",width:"100%"}}>
				<Paper style={{height:"100%",width:"100%",border: 'solid 1px #d9d9d9'}}>
					<Grid  style={{height:'100%', width:"100%"}}>
						<Row style={{ height:'8%',overflow:'hidden',width:"100%",margin:"0px"}}>
							<Col xs={12} sm={12} md={12} lg={12} style={{height:'100%'}}>
								<Row style={{ height:'100%',overflow:'hidden',width:"100%",margin:"0px"}}>
									<Col xs={6} sm={6} md={6} lg={6} style={{height:'100%', fontWeight: 'bold', padding:15}}>
										<div style={{float: 'left'}}>
										{this.props.presentChannel}
										</div>
										 <div>
                                            <Dialog
                                              title="Not Authorised.Do You want to auhtorise?"
                                              actions={authActions}
                                              modal={false}
                                              open={this.state.authOpen}
                                              onRequestClose={this.handleCloseAuth}
                                            >                                              
                                            </Dialog>
                                            <Dialog
                                            	title={this.state.eventMessage}
                                            	modal={false}
                                            	open={this.state.eventStatus}
                                            	onRequestClose={this.handleEventStatusClose}
                                            >
                                            </Dialog>
                                        </div>
									</Col>

									<Col xs={6} sm={6} md={6} lg={6} style={{height:'100%'}}>
										<div style={{float: 'right'}}>
											<Paper zDepth={0}>											
												<IconMenu open={this.state.membersOpen}
													onTouchTap={this.handleShowMembers}
													iconButtonElement={<IconButton><SupervisorAccount/></IconButton>}
													anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
													targetOrigin={{horizontal: 'left', vertical: 'top'}}
													onRequestChange={this.handleMembersClose}
												>
													{this.state.members.map((item,i)=>{
														return(<MenuItem key={i} primaryText={item}/>)
													})}
												</IconMenu>
												<IconMenu iconButtonElement={<IconButton onTouchTap={this.handleAddMembers}><PersonAdd /></IconButton>} >
												</IconMenu>
												<IconButton onTouchTap={this.handleToggle.bind(this)}>
													<Favorite />
												</IconButton>
												{leave}
											</Paper>

											<Drawer width={400} openSecondary={true} open={this.state.openDrawer} >
												<AppBar style={{backgroundImage:"url('http://localhost:8000/static/images/header.jpg')",marginTop:"0px"}} 
													title="Bookmarks" iconElementLeft={<IconButton iconStyle={{color:"white"}} onTouchTap={this.handleToggle.bind(this)}><Clear/> </IconButton>}></AppBar>
												<List>
													{this.state.booklist.map((item,i)=>{
														return(<ListItem key={i}><Paper>{item.TimeStamp}<br/>{item.msg}<br/>{item.sender}</Paper></ListItem>)
														})
													}
												</List>
											</Drawer>
											{display}
										</div>
									</Col>
								</Row>
							 
								
							</Col>
						</Row>
						<Row style={{ height:'4%',overflow:'hidden',width:"100%"}}>
							<Col xs={12} sm={12} md={12} lg={12} style={{height:'100%'}}>
								{typ}
							</Col>
						</Row>
						<Row style={{height:'78%',overflowY:'auto',width:"100%"}}>
							<Col xs={12} sm={12} md={12} lg={12}>
								<Scrollbars style={{width:"100%", height:"100%"}}>
									<ChatHistory channelID={this.props.channelID} userName={this.props.userName} gitStatus={this.state.gitStatus} deleteMessage={this.deleteMessage.bind(this)} editMessage={this.editMessage.bind(this)} avatars={this.props.avatars} channelId={this.props.channelID} psocket={this.props.socket} next={this.state.next} bookmark={this.handleSelect} username={this.props.userName} chatHistory={this.state.chatHistory}/>
								</Scrollbars>
								{this.state.progressState ? <LinearProgress/>:''}
							</Col>
						</Row>
						<Row bottom="lg" style={{height:"10%",width:'100%'}}>
							<Col xs={12} sm={12} md={12} lg={12}>								
								<NewMessage channelId={this.props.channelID} psocket={this.props.socket} name={this.props.userName} handleProgress={this.handleProgressStateUp}/>								
							</Col>
						</Row>
					</Grid>
				</Paper>
			</center>
			
		);
	}
}

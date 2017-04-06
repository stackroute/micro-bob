import React, { Component } from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import {Grid, Row, Col} from 'react-flexbox-grid/lib';
import {Tabs, Tab} from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import Popover from 'material-ui/Popover';
import {Picker} from 'emoji-mart';
import emojione from 'emojione';
import {HotKeys} from 'react-hotkeys';
import PermDeviceInformation from 'material-ui/svg-icons/action/perm-device-information';
import IconButton from 'material-ui/IconButton';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import Dropzone from "react-dropzone";
import sha1 from "sha1";
import superagent from "superagent";
import Mood from 'material-ui/svg-icons/social/mood';
import Datetime from 'react-datetime';
const keyMap={
  'openAllEMojis' : ['ctrl+shift+k']
 };
export default class NewMessage extends Component {
	constructor(props,context){
		super(props,context);
		this.state = {
			userInput:"",			
			reminderDialog:false,
			open: false,
			open1: false,
			open2:false,
			summary:'',
	        location:'',
	        startTime:'',
	        duration:'',
			username:'',
			eventurl:'',
			dialogStatus:false,
			multiLineMessage: true,
            localEmitter:this.context.theEmitter
		};
		this.handleOpen=this.handleOpen.bind(this);
		this.handleClose=this.handleClose.bind(this);
		// this.handleSubmit=this.handleSubmit.bind(this);
		this.handleOpen1=this.handleOpen1.bind(this);
		this.handleClose1=this.handleClose1.bind(this);
		this.handleSubmit1=this.handleSubmit1.bind(this);
		this.handleClose2=this.handleClose2.bind(this);
		this.handleChangeSummary=this.handleChangeSummary.bind(this);
		this.handleChangeLocation=this.handleChangeLocation.bind(this);
		this.handleChangeStartTime=this.handleChangeStartTime.bind(this);
		this.handleChangeDuration=this.handleChangeDuration.bind(this);
		this.handleClickEmoOpen=this.handleClickEmoOpen.bind(this);
		this.handleClickEmoClose=this.handleClickEmoClose.bind(this);
		this.handleOpenShortcuts=this.handleOpenShortcuts.bind(this);
        this.handleCloseShortcuts=this.handleCloseShortcuts.bind(this);
        this.handleReminderEvent=this.handleReminderEvent.bind(this);
 		this.handleKeyDown=this.handleKeyDown.bind(this);
	}

	componentDidMount(){
		this.state.localEmitter.on('openShortcutComponent',this.handleOpenShortcuts)
		let that=this;
		that.props.psocket.on('setReminder', this.handleReminderEvent);
		that.props.psocket.on('confirmSetRemainder', function(result, summary, location){
			//console.log("confirmSetRemainderResult: ", result);
			that.setState({open: true, summary: summary, location:location});
		});
		that.props.psocket.on('noToken', function(username, summary, location, sd, duration){
			that.setState({open1: true, username:username, summary: summary, location:location, startTime:sd, duration:duration});
			//console.log('inside 2nd dialog box : ', that.state.open1);
		});
		that.props.psocket.on('tokenRec', function(token){
			that.props.psocket.emit('storeToken', that.state.username, token);
		});
		that.props.psocket.on('eventCreated', function(link){
			//console.log('event created in new message : ',link);
			that.setState({open2:true, eventurl:link});
		});
	}

	handleReminderEvent(entities){
		entities.map((item,i)=>{
			console.log("kjjkjksd",item.subject,item.location,item.starttime,item.duration)
			if(Object.keys(item)[0]==='subject')
				this.setState({summary:item.subject});
			if(Object.keys(item)[0]==='location')
				this.setState({location:item.location});
			if(Object.keys(item)[0]==='starttime')
				this.setState({startTime:item.starttime});
			if(Object.keys(item)[0]==='duration')
				this.setState({duration:item.duration});
		})
		this.setState({reminderDialog: true});		
	}

	handleOpen(){
		this.setState({open: true});
	}

	handleCloseReminderDialog(){
    	this.setState({reminderDialog: false});
    	this.props.psocket.emit('reminderAccepted', this.props.name, "","","","");
	
    }

    handleClose(){
    	this.setState({open: false});
    }

    handleSubmitReminder(){
		this.setState({reminderDialog: false});
		this.props.psocket.emit('reminderAccepted', this.props.name, this.state.summary, this.state.location, this.state.startTime, this.state.duration);
		this.setState({location:'',summary:'',duration:''})
	}

	handleOpen1(){
		this.setState({open1: true});
  	}

  	handleClose1(){
    	this.setState({open1: false});
  	}

	handleSubmit1(){
		this.setState({open1: false});
	}

	handleOpen2(){
    	this.setState({open2: true});
  	}

	handleClose2(){
    	this.setState({open2: false});
  	}

  	handleClickEmoOpen(event){
		event.preventDefault();
		this.setState({openPop: true, anchorEl: event.currentTarget})
	}

	handleClickEmoClose(){
		this.setState({openPop: false});
	}

	handleEmoticonClick(emoEvent){
		var secondColon = emoEvent.colons.indexOf(':', 1);
		var emoShortName = emoEvent.colons.substring(0, secondColon+1);
		var emoUni = emojione.shortnameToUnicode(emoShortName);
		var tempInput = this.state.userInput+' '+emoUni+' ';
		this.setState({userInput: tempInput});
	}

	handleChangeStartTime(val){
		this.setState({
			startTime:val._d
		})
	}

	handleChangeDuration(e){
		this.setState({
			duration:e.target.value
		})
	}

	handleChangeSummary(e){
		this.setState({
			summary:e.target.value
		})
	}

	handleChangeLocation(e){
		this.setState({
			location:e.target.value
		})
	}

	handleChange(e){
		this.props.psocket.emit('typing',this.props.name,this.props.channelId);	//emit the name of user typing.
		this.setState({userInput:e.target.value});
	}

	
    handleKeyDown(event){
	    if(!event.shiftKey && event.key === 'Enter'){

	       if(this.state.userInput!==""&&this.props.channelId.split("#")[1]!="Bob-Bot")
	        {
	            this.props.psocket.emit("send message",this.props.name,this.props.channelId, this.state.userInput);
	            this.setState({userInput:""},
	                function(){
	                    this.setState({multiLineMessage: false},
	                        function(){
	                            this.setState({multiLineMessage: true})
	                        }
	                    );
	                }
	            );            
	        }
	        else if(this.state.userInput!==""&&this.props.channelId.split("#")[1]=="Bob-Bot"){
	                this.props.psocket.emit("BotMessage",this.props.name,this.props.channelId,this.state.userInput);
	                this.setState({userInput:""},function(){
	                    this.setState({multiLineMessage: false},
	                        function(){
	                            this.setState({multiLineMessage: true})
	                        }
	                    );
	                });
	                this.props.handleProgress();
	        }
	    }
    }
    
	handleOpenShortcuts(){

        this.setState({dialogStatus:true});
    }

    handleCloseShortcuts(){
        this.setState({dialogStatus:false});

    }

	uploadFile(files){        
        const image=files[0]
        const cloudName='sanidhyasharmasandy'
        const url="https://api.cloudinary.com/v1_1/"+cloudName+"/auto/upload"
        const timestamp=Date.now()/1000
        const uploadPreset="bil5k5yz"
        const paramsStr = "timestamp="+timestamp+"&upload_preset="+uploadPreset+"qShQS4pqLcxCzb303dQ24izVjDw"
        const pstr="public_id=sample_image&timestamp=1315060510abcd"
        const signature =sha1(paramsStr)
        const params ={
            "api_key": "934266662715949", 
            "timestamp": timestamp,
            "upload_preset": uploadPreset,
            "signature": signature
        }
        let uploadRequest=superagent.post(url)
        uploadRequest.attach("file",image)
        Object.keys(params).forEach((key)=>{uploadRequest.field(key,params[key])
        })
		uploadRequest.end((err,resp)=>{
		    if(err){
		    alert(err)
		    return
			}
		const uploaded=resp.body
		const url = {
			url:uploaded.url,
			format:uploaded.format
		}
		this.props.psocket.emit("send message",this.props.name,this.props.channelId, url);
		})
	}

	render() {
		const dzstyle= { 
		    backgroundImage: `url(${"../static/images/plus1.png"})`,
		    width: 36 ,
		    height: 36 ,
		    float:"left",		   	    
		};

		const handlers={
            'openAllEMojis' : this.handleClickEmoOpen            
        };

        let shortcutWindow = null;

		let obj = {
			username:this.state.username,
			summary:this.state.summary,
			location:this.state.location,
			startTime:this.state.startTime,
			duration:this.state.duration
		}
		const url='https://accounts.google.com/o/oauth2/auth?redirect_uri=http://localhost:8000/oauth2callback&state='+JSON.stringify(obj)+'&response_type=code&client_id=616007233163-g0rk4o8g107upgrmcuji5a8jpnbkd228.apps.googleusercontent.com&scope=https://www.googleapis.com/auth/calendar+https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile&approval_prompt=force&access_type=offline';
		const eventurl=this.state.eventurl;
		const reminderActions = [
		    <FlatButton
		        label="Close"
		        keyboardFocused={true}
		    	onTouchTap={this.handleCloseReminderDialog.bind(this)}
		    />,
		    <FlatButton
		        label="OK"
		        primary={true}
		        keyboardFocused={true}
		        onTouchTap={this.handleSubmitReminder.bind(this)}
		    />
	   	];
	   	// const actions = [
		   //  <FlatButton
		   //      label="Close"
		   //      keyboardFocused={true}
		   //  	onTouchTap={this.handleClose}
		   //  />,
		   //  <FlatButton
		   //      label="OK"
		   //      primary={true}
		   //      keyboardFocused={true}
		   //      onTouchTap={this.handleSubmit}
		   //  />
	   	// ];
		const actions1 = [
	        <FlatButton
	       		label="Close"
	       		keyboardFocused={true}
	       		onTouchTap={this.handleClose1}
	     	/>,
			<FlatButton
			 	href={url}
				label="OK"
		        primary={true}
		       	keyboardFocused={true}
	     	/>
	    ];
		const actions2 = [
	    	<FlatButton
	       		label="OK"
	       		keyboardFocused={true}
	       		onTouchTap={this.handleClose2}
	     	/>
		];
		const dialogs=(
					<Tabs>
    					<Tab label="Shortcuts" style={{background:"black",backgroundImage:"url('http://localhost:8000/static/images/header.jpg')"}}>
							<Table>                        
		                        <TableBody  displayRowCheckbox={false} stripedRows={true}>
		                          <TableRow>
		                            <TableRowColumn>CTRL+SHIFT+S</TableRowColumn>
		                            <TableRowColumn>Open Keyboard shortcuts</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+DOWN</TableRowColumn>
		                            <TableRowColumn>Swap between Projects</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+UP</TableRowColumn>
		                            <TableRowColumn>Swap between channels</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+RIGHT</TableRowColumn>
		                            <TableRowColumn>Open Channel List</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+LEFT</TableRowColumn>
		                            <TableRowColumn>Close Channel List</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+SHIFT+F</TableRowColumn>
		                            <TableRowColumn>Swap between chat and notification window</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+SHIFT+K</TableRowColumn>
		                            <TableRowColumn>Open emojis</TableRowColumn>
		                          </TableRow>
		                          
		                          <TableRow>
		                            <TableRowColumn>CTRL+ENTER</TableRowColumn>
		                            <TableRowColumn>Open new channel</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>CTRL+M</TableRowColumn>
		                            <TableRowColumn>Open new direct chat</TableRowColumn>
		                          </TableRow>
		                        </TableBody>
	                     	</Table>
	                    </Tab>
	                    <Tab label="Markdowns" style={{background:"black",backgroundImage:"url('http://localhost:8000/static/images/header.jpg')"}}>
	                     	<Table>                        
	                        	<TableBody  displayRowCheckbox={false} stripedRows={true}>
		                          <TableRow>
		                            <TableRowColumn>Bold</TableRowColumn>
		                            <TableRowColumn>**bold**/__bold__</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Italics</TableRowColumn>
		                            <TableRowColumn>*italics*/_italics_</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Header</TableRowColumn>
		                            <TableRowColumn># H1 ## H2 ### H3</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Unordered List</TableRowColumn>
		                            <TableRowColumn>* item</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Ordered List</TableRowColumn>
		                            <TableRowColumn>1. item</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Link</TableRowColumn>
		                            <TableRowColumn>[title](http://)</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Image</TableRowColumn>
		                            <TableRowColumn>![alt](http://)</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Blockquote</TableRowColumn>
		                            <TableRowColumn>> blockquote</TableRowColumn>
		                          </TableRow>
		                          <TableRow>
		                            <TableRowColumn>Code Block</TableRowColumn>
		                            <TableRowColumn>`code`</TableRowColumn>
		                          </TableRow>
		                        </TableBody>
	                     	</Table>
	                    </Tab>
                	</Tabs>)
        if(this.state.dialogStatus)
        {
            shortcutWindow = (
                <Dialog modal={false} open={this.state.dialogStatus} onRequestClose={this.handleCloseShortcuts}>
                    {dialogs}
                </Dialog>
                );
        }
        if (this.state.reminderDialog) {
			return (
					<div>
						<Dialog
							title="It looks like a meeting reminder. Do you want to send the details?"
							actions={reminderActions}
							modal={false}
							open={this.state.reminderDialog}
							onRequestClose={this.handleCloseReminderDialog.bind(this)}
						>
							Summary : <TextField hintText="Enter the summary" value={this.state.summary} onChange={this.handleChangeSummary}/><br/>
							Location : <TextField hintText="Enter the location" value={this.state.location} onChange={this.handleChangeLocation}/><br/>
							Start Time : <Datetime hintText="Date Picker" onChange={this.handleChangeStartTime}/><br/>
							Duration : <TextField hintText="Duration" value={this.state.duration} onChange={this.handleChangeDuration}/>
						</Dialog>
					</div>
			);
		}
		else if (this.state.open1) {
			return (
				<HotKeys keyMap={keyMap} handlers={handlers}>
					<div>
				        <Dialog
				          title="OOPS !!!!"
				          actions={actions1}
				          modal={false}
				          open={this.state.open1}
				          onRequestClose={this.handleClose1}
				        >
				         Your Google Account is not linked .
				         Do you want to Link your Google Account
				        </Dialog>
				    </div>
			    </HotKeys>
			    );
		}
		else if (this.state.open2) {
			return (
				<HotKeys keyMap={keyMap} handlers={handlers}>
				<div>
			        <Dialog
			          title="Event Created !!!!"
			          actions={actions2}
			          modal={false}
			          open={this.state.open2}
			          onRequestClose={this.handleClose2}
			        >
			         <p> <a href={eventurl} target="_blank">click here</a> to edit in Google Calendar</p>
			        </Dialog>
			    </div>
			    </HotKeys>
			    );
		}
		else {
			return (
				<HotKeys keyMap={keyMap} handlers={handlers}>
					<Paper style={{margin:"0px",width:"97%"}}>
						<Grid style={{width:"100%"}}>
							<Row style={{width:"100%"}}>
								<Col xs={1} sm={1} md={1} lg={1}>									
									<Dropzone style={dzstyle}  onDrop={this.uploadFile.bind(this)}/>
								</Col>
								<Col xs={9} sm={9} md={9} lg={9}>
                                    <TextField  style={{margin:"0px"}}  value={this.state.userInput} hintText="Type Message"
                                    	fullWidth={true} 
                                    	rows={1}
                                    	rowsMax={2}                          	
                                    	multiLine={this.state.multiLineMessage}
                                    	onKeyDown={this.handleKeyDown}
										onChange={this.handleChange.bind(this)}/>
									{shortcutWindow}
								</Col>
								<Col xs={1} sm={1} md={1} lg={1}>
									<IconButton onClick={this.handleClickEmoOpen} 
										tooltip="Emojis (ctrl+z)" tooltipPosition="top-left">
										<Mood/>
									</IconButton>
									<Popover
										open={this.state.openPop}
										anchorEl={this.state.anchorEl}
										anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
										targetOrigin={{horizontal: 'right', vertical: 'top'}}
										onRequestClose={this.handleClickEmoClose.bind(this)}
									>
									<Picker
										emojiSize={25}
										perLine={8}
										skin={2}
										native={false}
										set='apple'
										style={{height:"300px"}}
										onClick={(emoji) => this.handleEmoticonClick(emoji)}
									/>
									</Popover>
								</Col>
								<Col xs={1} sm={1} md={1} lg={1}>
									<IconButton onTouchTap={this.handleOpenShortcuts} 
										tooltip="Shortcuts & MarkDowns(ctrl+shift+s)" tooltipPosition="top-left">
										<PermDeviceInformation/>
									</IconButton>
								</Col>
							</Row>
						</Grid>
					</Paper>
				</HotKeys>
			);
		}
	}

}
NewMessage.contextTypes = {
  theEmitter: React.PropTypes.object
};
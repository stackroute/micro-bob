import React, { Component } from 'react';
import Chip from 'material-ui/Chip';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {Grid, Row, Col} from 'react-flexbox-grid/lib/index';
import FlatButton from 'material-ui/FlatButton';
import Paper from 'material-ui/Paper';
import ReactDOM from 'react-dom';
import Checkbox from 'material-ui/Checkbox';
import ActionFavorite from 'material-ui/svg-icons/action/favorite';
import ActionFavoriteBorder from 'material-ui/svg-icons/action/favorite-border';
import Bookmark from 'material-ui/svg-icons/action/bookmark';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import Dialog from 'material-ui/Dialog';
import {List, ListItem} from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';
import ContentInbox from 'material-ui/svg-icons/content/inbox';
import Subheader from 'material-ui/Subheader';
import Avatar from 'material-ui/Avatar';
import Tasks from './Tasks.jsx';
import ChatMessage from './ChatMessage.jsx';
const cardtitle={
	padding: '5px',
	fontSize: '9px'
}

const cardtext={
	padding: '5px',
	tableLayout: 'fixed',
	wordWrap:'break-word'

}

export default class ChatHistory extends Component {
	constructor(props){
		super(props);
		this.state={
		historyEnded:false,
		bookitem:'',
	    checkStatus:false,
	    task:[],
	    openPop:false,
	    response:'',
		sn:false,
		chipText:""
	};
		this.addTask = this.addTask.bind(this);
		this.handleOpen=this.handleOpen.bind(this);
		this.handleClose=this.handleClose.bind(this);
	}

	scrollToBottom() {
	    const node = ReactDOM.findDOMNode(this.messagesEnd);
	    node.scrollIntoView({behavior: "smooth"});
	}

	componentDidMount(){
		this.scrollToBottom();
		this.props.chatHistory.map((message,i)=>{
			this.setState({chipText:message.TimeStamp.split("+")[0]})
		})
		this.props.psocket.on("receiveBoomarkHistory",(receiveBoomarkHistory)=>{
				this.setState({booklist:receiveBoomarkHistory});
			});
		this.props.psocket.on('historyEmpty',(msg)=>{
				this.handleHistoryEmpty(msg);
			});

		let msg = {"pageNo":"initial_primary","channelName":this.props.channelId};
		this.props.psocket.emit('receiveChatHistory',msg);
		this.props.psocket.on('confirmStickyTasks', (task)=>{
			this.setState({task:task, sn:true});
		});
	}

    componentDidUpdate(){
        this.scrollToBottom();
    }

	handleHistoryEmpty(msg){
		this.setState({historyEnded:true});
	}

	getEarlierMessages(){
		let msg = {"pageNo":(this.props.next),"channelName":this.props.channelId};
		this.props.psocket.emit('receiveChatHistory',msg);
	}
	
	handleClickDelete(i){
		var arr = this.props.chatHistory;
		console.log(i)
		var arr_1 = arr.slice(i,i+1);
		console.log(arr_1)
		this.props.deleteMessage(i);
		this.props.psocket.emit('deleteMessage',arr_1,this.props.username,this.props.channelId);
	}

	handleClickEdit(i,editedMsg){
		var arr = this.props.chatHistory;
		var arr_1 = arr.slice(i,i+1);
		this.props.psocket.emit('editMessage',editedMsg,arr_1,this.props.username,this.props.channelId);
		this.props.editMessage(i,editedMsg,arr_1);
	}

	addTask(val){
	    var lists = this.state.task;
	    var obj = {task:val,checked:false}
	    lists.push(obj);
	    this.setState({task:lists});
 	}

  	handleChecked(i){
	    var lists = this.state.task;
	    var obj = lists[i];
	    obj.checked = !obj.checked;
	    lists.splice(i,1,obj);
	    this.setState({task: lists})
  	}

	handleTaskDelete(i){
		var list = this.state.task;
		list.splice(i,1);
		this.setState({task: list});
	}

	handleOpen(){
		this.setState({sn: true});

	}

    handleClose(){
		this.props.psocket.emit('taskArray', this.props.channelId, this.state.task);
    	this.setState({sn: false, task:[]});		
  	}
  	handleTime(TimeStamp){
	    let date = [];
	    let today = [];
	    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
		  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];
	    let timeFromHistory = new Date(TimeStamp);

	    date[0]= new Date(TimeStamp).getFullYear();
	    date[1]= new Date(TimeStamp).getMonth()+1;
	    date[2]= new Date(TimeStamp).getDate();
	    
	    today[0] = new Date().getFullYear();
	    today[1] = new Date().getMonth()+1;
	    today[2] = new Date().getDate(); 	

	    let today_date = today[2]+"/"+today[1]+"/"+today[0];
	    let yesterday = (today[2]-1)+"/"+today[1]+"/"+today[0]
	    let hist_date = date[2]+"/"+date[1]+"/"+date[0];

	    if(today_date === hist_date){
	        date = "today";
	    }
	    else if(yesterday === hist_date){
	      	date = "yesterday"
	    }
	    else{
	    	let month = monthNames[date[1]]

	      	date = month+" "+date[2]+" "+date[0];
	    }
	    return date;
	}
	render() {		
		const actions = [
			<FlatButton
				label="OK"
				keyboardFocused={true}
				onTouchTap={this.handleClose}
			/>
		];
		let lem;
		let showbooklist;
		let messageList;
		if(this.state.historyEnded)
			lem = null;
		else
			lem = (<FlatButton label="Load Earlier Messages" primary={true} onClick={this.getEarlierMessages.bind(this)}/>);

		//messageList ---------->
		if(this.props.gitStatus==true){
			messageList = this.props.chatHistory.map((message,i)=>{
				return (
					<Row key={i} start="xs">
						<Col xs={10} sm={10} md={10} lg={10} style={{marginTop:"2px",marginBottom:"2px"}}>
							<Card>
								<CardHeader title={message.author_name} subtitle={message.timestamp}/>
								<CardText style={cardtext} subtitle={<Checkbox onCheck={this.props.bookmark.bind(this,message)} checkedIcon={<ActionFavorite />}
							        uncheckedIcon={<ActionFavoriteBorder />}/>}>
							        REPOSITORY NAME:{message.repo_name}<br/>
							        COMMIT MESSAGE:{message.message}<br/>
							        REPO URL:{message.url}
						  		</CardText>
								<CardMedia style={{position:'relative',marginTop:0,marginLeft:'90%'}} overlayContentStyle={{background:'#ffffff'}} overlay={<Checkbox onCheck={this.props.bookmark.bind(this,message)} checkedIcon={<ActionFavorite />}
									uncheckedIcon={<ActionFavoriteBorder />}/>}>
								</CardMedia>
							</Card>
						</Col>
					</Row>
				);
			});
		}
      	else{
			if(this.state.historyEnded)
			lem = null;
			else
			lem = (<FlatButton label="Load Earlier Messages" primary={true} onClick={this.getEarlierMessages.bind(this)}/>);
			let chipText = "";
			let Text = "";
			messageList = this.props.chatHistory.map((message,i)=>{
				let time = this.handleTime(message.TimeStamp);
				if(i==0){
					chipText = time;
			 		Text = time;
				}
				else{
					if(Text === time){
						chipText = "";
					}
					else{
						Text = time;
						chipText = time;
					}
				}							
				const intentval = "reminder"
				const intent_metadata=[{"label":"Subject","required":true},{"label":"When","required":true}, {"label": "Duration", "required": true},{"label":"Where","required":true}]
				const data = {"Subject": "sub", "When": "wen", "Duration": "dtf", "Where": "dsjh"};
				if(this.state.sn){
					return(
						<Dialog
							key={i}
							title="Tasks"
							actions={actions}
							modal={false}
							open={this.state.sn}
							onRequestClose={this.handleClose}>
							<Tasks handleChecked={this.handleChecked.bind(this)} handleTaskDelete={this.handleTaskDelete.bind(this)} task={this.state.task} addTask={this.addTask}/>
						</Dialog>
					);
				}
				else{
					return (
						<div key = {i}>
							<Chip>{chipText}</Chip>
							<ChatMessage  index={i} userName={this.props.userName} handleClickEdit={this.handleClickEdit.bind(this)} 
									handleClickDelete={this.handleClickDelete.bind(this)} intentdata={data} 
									intentVal = {intentval} intent_metadata = {intent_metadata} 
									message={message} check={this.props.bookmark} avatar={this.props.avatars}
							/>
						</div>
					);
				}
			});
		}

	return (
			
		<div style={{ height:'100%',width:"95%"}}>
			{lem}
			{messageList}
			<div style={ {float:"left", clear: "both"} }
	    		ref={(el) => { this.messagesEnd = el; }}>
	    	</div>
		</div>
		
		);
	}
}

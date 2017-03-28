import React,{ Component} from 'react';
import TextField from 'material-ui/TextField';
import ActionFavorite from 'material-ui/svg-icons/action/favorite';
import ActionFavoriteBorder from 'material-ui/svg-icons/action/favorite-border';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {Grid, Row, Col} from 'react-flexbox-grid/lib/index';
import Twemoji from 'react-twemoji';
import Checkbox from 'material-ui/Checkbox';
import Markdown from 'react-markdown-it';
import {emojify} from 'react-emojione';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import GenericForm from './GenericForm.jsx';
import Linkify from 'react-linkify';
export default class ChatMessage extends Component{
  constructor(props){
    super(props);
    this.state = {
      expanded: false,
      edit:false,
      userInput:"",
      videoState: false
    };
  }
  handleTime(TimeStamp){
    let date = [];
    let today = [];
    
    let timeFromHistory = new Date(TimeStamp);
    let hours= new Date(TimeStamp).getHours();
    date[0]=hours;
    date[1]= new Date(TimeStamp).getMinutes();
    date[3]= new Date(TimeStamp).getFullYear();
    date[4]= new Date(TimeStamp).getMonth()+1;
    date[5]= new Date(TimeStamp).getDate();
    if(hours >12){
      date[2] = "PM";
      date[0] = hours  -12;
    }
    else{
      date[2] = "AM";
    }
    today[0] = new Date().getFullYear();
    today[1] = new Date().getMonth()+1;
    today[2] = new Date().getDate(); 
    today[3] = new Date().getMinutes();
    today[4] = new Date().getHours();
    let today_date = today[2]+"/"+today[1]+"/"+today[0];
    let yesterday = (today[2]-1)+"/"+today[1]+"/"+today[0]
    let hist_date = date[5]+"/"+date[4]+"/"+date[3];
    if(today_date === hist_date){
      if(today[4] === hours){
        if(today[3] === date[1]){
          date = "just now";
        }
        else{
          date = today[3] - date[1] + " minutes ago";
        }
      }
      else{
        date = today[4] - hours + " hours ago";
      }
    }
    else if(yesterday === hist_date){
      date = date[0]+":"+date[1]+" "+date[2];
    }
    else{
      date = date[0]+":"+date[1]+" "+date[2];
    }
    return date;
  }
  handleChange(e){
    this.setState({userInput:e.target.value});
  }
  handleVideoStateChange(){
    this.setState({videoState: true})
  }
  handleKeyPress(event){
    if(event.key === 'Enter'){      
      this.props.handleClickEdit(this.props.index,this.state.userInput)
      this.setState({edit:false})
    }
  }
  handleClickDelete(){
    this.props.handleClickDelete(this.props.index)
  }
  handleClickEdit(){
    this.setState({edit:true})
  }
  render(){
    var msg='';
    let menu='';
    if(typeof(this.props.message.msg) === 'string'){
      if(this.props.userName === this.props.message.sender){
        menu = (<IconMenu iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                      anchorOrigin={{horizontal: 'left', vertical: 'top'}}
                      targetOrigin={{horizontal: 'left', vertical: 'top'}}
                >
                  <MenuItem primaryText="Delete" onClick={this.handleClickDelete.bind(this)}/>
                  <MenuItem primaryText="Edit" onClick={this.handleClickEdit.bind(this)}/>                       
                </IconMenu>)
      }
      if(this.state.edit){        
        msg = (<CardText><TextField value={this.state.userInput}
                          fullWidth={true} hintText={this.props.message.msg} onKeyPress={this.handleKeyPress.bind(this)}
                          onChange={this.handleChange.bind(this)}/></CardText>)      
        }
      else{
        msg = (<CardText>
                <Twemoji>
                  <Linkify>
                    <div style={{whiteSpace:"pre-wrap"}}>
                      <Markdown>
                      {emojify(this.props.message.msg, {output: 'unicode'})}
                      </Markdown>
                    </div>
                  </Linkify>
                </Twemoji>
              </CardText>)
      }
    }
    else{
      if(this.props.message.msg.format === "pdf"){
       msg = (<CardMedia><object data={this.props.message.msg.url}/></CardMedia>)
      }
      else if(this.props.message.msg.format === "mp4"){
       msg = (this.state.videoState ? <CardMedia><video src={this.props.message.msg.url} controls></video></CardMedia> : <h1 onClick={this.handleVideoStateChange.bind(this)}> This is a video </h1>)
      }
      else if(this.props.message.msg.format === "mp3"){
       msg = ( <CardMedia><audio src={this.props.message.msg.url} controls></audio></CardMedia> )
      }
      
      else if(this.props.message.msg.format === "oxygen"){
       let links = this.props.message.msg.url.split("*#%&%#*").map((item,i)=>{
          return(
                  <Linkify>
                    <div style={{whiteSpace:"pre-wrap"}}>
                      {item}
                    </div>
                  </Linkify>)});
       msg = (<CardText>{links}</CardText>)
      }

      else{
       msg = (<CardMedia><img src={this.props.message.msg.url}/></CardMedia>)
      }
    }
    const intent = (this.props.intentVal != '')?(<CardMedia expandable={true}><GenericForm intentVal={this.props.intentVal} intent_metadata={this.props.intent_metadata} intentdata={this.props.intentdata}/></CardMedia>):(console.log())  
    
      return(
        <div>
          <Row  start="xs">
            <Col xs={12} sm={12} md={12} lg={12} style={{marginTop:"2px",marginBottom:"2px"}}>
              <Card>
                <CardHeader  
                    actAsExpander={true}
                    showExpandableButton={true}
                    title={this.props.message.sender} 
                    subtitle={this.handleTime(this.props.message.TimeStamp)} 
                    avatar={this.props.avatar[this.props.message.sender]} 
                    />
                {msg}
                <CardMedia style={{position:'relative',marginTop:0,marginLeft:'90%'}} 
                  overlayContentStyle={{background:'#ffffff'}} 
                  overlay={
                    <div>
                        <Checkbox onCheck={this.props.check.bind(this, this.props.message)} 
                          checkedIcon={<ActionFavorite/>}
                          uncheckedIcon={<ActionFavoriteBorder/>}/>
                        {menu}
                    </div>
                  }
                >
                </CardMedia>
                {intent}
                </Card>
            </Col>
          </Row>
        </div>
      );         
  }
}
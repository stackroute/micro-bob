import React,{ Component} from 'react';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
export default class GenericForm extends Component{
  
  constructor(props,context){
    super(props,context);
     this.state = {
      defVal : ''
     };
    this.handleOnTouchTap = this.handleOnTouchTap.bind(this);
    this.handleCallInsertEvent = this.handleCallInsertEvent.bind(this);
    }
  componentDidMount() {
    this.context.socket.on('tokenFound',()=>{
      this.handleCallInsertEvent();
    });
  }
  handleOnTouchTap(){
    this.context.socket.emit('findAToken',this.props.name);
  }
  handleCallInsertEvent(){
    var time = new Date(this.props.reminder.reminder.StartTime).toUTCString()
    var arr = time.split(' ');
    var a = (Number(arr[4].split(':')[0])+Number(this.props.reminder.reminder.Duration));
    let time_1=a+":"+arr[4].split(':')[1]+":"+arr[4].split(':')[2];
    arr.splice(4,1,time_1);
    let newtime="";
    for(let i=0 ; i<arr.length;i++){
      if(i==0){
        newtime = arr[0]
      }
      else{
        newtime = newtime+" "+arr[i];
      } 
    }
    console.log(newtime,"...........",new Date(newtime).toISOString())
    let details = {
      'summary':this.props.reminder.reminder.Summary,
      'location':this.props.reminder.reminder.Location,
      'startDate':this.props.reminder.reminder.StartTime,
      'endDate': new Date(newtime).toISOString()
    }
    console.log(details)
    this.context.socket.emit("addCalendarEvent",details,this.props.name);
  }
  handleOnChange(event,index,i){
    console.log(index,"VALUE",i);
  }
  

 render(){
      var prop = Object.keys(this.props.reminder.reminder)
      const formItems = prop.map((item,i)=>{
        return(
        <div key={i}>
        <TextField
          style={{paddingLeft:30}}
          defaultValue = {this.props.reminder.reminder[item]}        
          floatingLabelText= {item}
          onChange = {this.handleOnChange.bind(this,i)}
        /><br/></div>
        ); });
    return(      
      <Paper style={{margin:'auto', width:400}}>
         {formItems}<br/>
         <RaisedButton label={this.props.intentVal} primary={true} onTouchTap={this.handleOnTouchTap}/>                  
      </Paper>
    );
  }
}
GenericForm.contextTypes={
  socket:React.PropTypes.object
};
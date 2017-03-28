import React,{ Component} from 'react';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
export default class GenericForm extends Component{
  
  constructor(props){
      super(props);
    }

  render(){
    const formItems=this.props.intent_metadata.map((item,i)=> {
      var prop = item[Object.keys(item)[0]];
      var req = item[Object.keys(item)[1]];
      return(
        <div key={i}><TextField style={{paddingLeft:30}}
          defaultValue = {this.props.intentdata[prop]}         
          floatingLabelText= {prop}
        /><br/></div>
        );      
      });
    return(      
      <Paper style={{margin:'auto', width:400}}>
         {formItems}<br/>
         <RaisedButton label={this.props.intentVal} primary={true}/>                  
      </Paper>
    );
}
}
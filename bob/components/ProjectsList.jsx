import React, { Component } from 'react';
import {List, ListItem, makeSelectable} from 'material-ui/List';
import Paper from 'material-ui/Paper';
import Subheader from 'material-ui/Subheader';
import Menu from 'material-ui/svg-icons/navigation/menu';
import IconButton from 'material-ui/IconButton';
import KeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
let SelectableList = makeSelectable(List);

export default class ProjectsList extends Component {
    componentDidMount()
    {
        this.state.localEmitter.on('projectSwap',this.handleSwapProject);
        this.state.localEmitter.on('openChannelList',this.props.handleToggle);
    }
    
    constructor(props,context) {
        super(props,context);
        this.state={
            currentChannel:this.props.currentChannel.split('#')[0],
            localCopyOfProjects:this.props.projects,
            index:0,
            localEmitter:this.context.theEmitter,
            drawerState:true,
        }
        this.handleProjectChange=this.handleProjectChange.bind(this);
        this.handleSwapProject=this.handleSwapProject.bind(this);    
        
    }
    handleProjectChange(name){
        this.setState({currentChannel:name});
        this.props.setCurrentChannel(name+"#"+"general",this.props.currentChannel);
       
     }
    handleSwapProject()
    {
        var localCopy=this.state.localCopyOfProjects;
        var localItems_1=[];
        var localItems_2=[];
        localCopy.map((item,i)=>{
            localItems_1.push(item.split('#')[0]);
        })
        localItems_1.map((item,i)=>{
            if(localItems_1.indexOf(item)==i)
            {
                localItems_2.push(item);
            }
        })
        if(this.state.index <=localItems_2.length)
        {
            this.handleProjectChange(localItems_2[this.state.index]);
            this.setState({index:(this.state.index)+1});
        }
        if(this.state.index==localItems_2.length)
        {
            this.setState({index:0});
        }
    }

    render() {
        let projects=[];
        this.props.projects.map((item,i)=>{
            if(projects.indexOf(item.split('#')[0])==-1){
                projects.push(item.split("#")[0]);
            }
            
        })   
        
        return (
            <Paper style={{height:"91.5vh",padding:"0px",background:'#424242',margin:'0px'}}>
            <div style={{height:"90%"}}>
            <Subheader style={{fontSize:"18px", height:'9.3%', width:'100%', paddingTop:8,color:'white'}}>Projects</Subheader>                                     
                     <SelectableList value={this.state.currentChannel}>
                         {
                         projects.map((item,i)=>{
                            return(
                                 <ListItem style={{color:'white'}} 
                                           key={i} value={item} 
                                           rightIcon={<KeyboardArrowRight onTouchTap={this.props.handleToggle}/>} 
                                           primaryText={item} 
                                           onTouchTap={this.handleProjectChange.bind(this,item)}/>   
                                 
                                 );
                             })
                         }
                     </SelectableList>
            </div>
           
            </Paper>
        );
    }
}

ProjectsList.contextTypes = {
  theEmitter: React.PropTypes.object
};
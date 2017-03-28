import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import Bob from './components/Bob.jsx';
import ProjectDetails from './components/ProjectDetails.jsx';
import {Router,Route,IndexRoute,hashHistory} from 'react-router';
import Feedback from './components/Feedback.jsx';
import Header from './components/Header.jsx';
import Login from './components/Login.jsx';
import cookie from "react-cookie";
import {HotKeys} from 'react-hotkeys';
import LayoutComponent from './components/LayoutComponent.jsx';
import {cyan500,cyan50,indigo700,grey900,grey600,white,red,fullBlack, cyan700,
  pinkA200,grey100, grey300, grey400, grey500, darkBlack,} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {fade} from 'material-ui/utils/colorManipulator';
import muiThemeable from 'material-ui/styles/muiThemeable';

  const muiTheme = getMuiTheme({
    palette: {
      primary1Color: indigo700,
      primary2Color: cyan700,
      primary3Color: grey400,
      accent1Color: pinkA200,
      accent2Color: grey100,
      accent3Color: grey500,
      textColor: darkBlack,
      alternateTextColor: white,
      canvasColor: white,
      borderColor: grey300,
      disabledColor: fade(darkBlack, 0.3),
      pickerHeaderColor: cyan500,
      clockCircleColor: fade(darkBlack, 0.07),
      shadowColor: fullBlack,
    }
  });

function checkAuth(nextState,replace){
  
  if(cookie.load("Token")==undefined) {
    replace({
      pathname: '/'
    })
  }
}

function checkLoggedIn(nextState,replace){
  if(cookie.load("Token")!=undefined) {
    replace({
      pathname: 'bob'
    })
  }
}
var events = require('events');
var eventEmitter = new events.EventEmitter();

const keyMap={
  'swapProjects' : ['ctrl+down'],
  'swapChannels' : ['ctrl+up'],
  'openNewChannel': ['ctrl+enter'],
  'openNewChat' : ['ctrl+m'],
  'openShortcuts' : ['ctrl+shift+s'],
  'swapChatAndNotifications' : ['ctrl+shift+f'],
  'openChannels':['ctrl+right'],
  'openProjects':['ctrl+left'],
 };

export default class App extends React.Component{
  getChildContext() {
    return {
      theEmitter: eventEmitter,
    };
  }

  render()
  {
    const handlers={
      'swapProjects' : ()=>{eventEmitter.emit('projectSwap')},
      'swapChannels' : ()=>{eventEmitter.emit('channelSwap')},
      'openNewChannel':()=>{eventEmitter.emit('newChannelOpen')},
      'openNewChat' : ()=>{eventEmitter.emit('newChatOpen')},
      'openShortcuts' : ()=>{eventEmitter.emit('openShortcutComponent')},
      'swapChatAndNotifications':()=>{eventEmitter.emit('swapNotifications')},
      'openChannels' : ()=>{eventEmitter.emit('openChannelList')},
      'openProjects' : ()=>{eventEmitter.emit('openProjectsList')},
    };
    
    return(
        <MuiThemeProvider muiTheme={muiTheme}>
        <HotKeys keyMap={keyMap} handlers={handlers}>
          <div>
            <Router history={hashHistory}>
            <Route path = '/' component={Header}>
               <IndexRoute component={Login} onEnter={checkLoggedIn}/>
               <Route path='/project' component={ProjectDetails} onEnter={checkAuth}/>
               <Route path='/bob' component={Bob} onEnter={checkAuth} />
               <Route path='/notification' component={LayoutComponent} onEnter={checkAuth}/>
               <Route path='/feedback' component={Feedback}/>
            
            </Route>
           </Router>
          </div>
           </HotKeys>
        </MuiThemeProvider>
      );
  }
    
}
App.childContextTypes = {
  theEmitter: React.PropTypes.object
};

ReactDOM.render(
  <App />,
  document.getElementById('root')
  );

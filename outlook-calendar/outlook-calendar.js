module.exports = function product (options) {
  	var outlook = require('node-outlook'); 
  	var credentials = {
		client: {
		id: 'de8ad897-a459-4bda-baa6-a98b3fc8068f',
		secret: 'dStBaJppTNCqjirdCnkcQ7N',
		},
		auth: {
		tokenHost: 'https://login.microsoftonline.com',
		authorizePath: 'common/oauth2/v2.0/authorize',
		tokenPath: 'common/oauth2/v2.0/token'
		}
	}; 
  	var oauth2 = require('simple-oauth2').create(credentials);
  	this.add('api:calendar,impl:outlook,cmd:ping', ping)
	  function ping (msg,done){
	    done(null,{
	      reply:'pong'
	    })
	  }
  	this.add('api:calendar,impl:outlook', outlook_calendar)

  	function outlook_calendar (msg, done) {
	outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0'); 
  	var newEvent = {
		  "Subject": msg.info.details.summary,
		  "Body": {
		    "ContentType": "HTML",
		    "Content": "Remainder Created By BOB"+msg.info.details.location
		  },
		  "Start": {
		    "DateTime": msg.info.details.startDate,
		    "TimeZone": "Eastern Standard Time"
		  },
		  "End": {
		    "DateTime": msg.info.details.endDate,
		    "TimeZone": "Eastern Standard Time"
		  }
		}


	// Pass the user's email address
	var userInfo = {
	  email: 'an356730@wipro.com'
	};
	var token1 = "";
	var obj=oauth2.accessToken.create({refresh_token: msg.info.token.token.refresh_token});
	obj.refresh(function(error, newToken){
	      if (error) {
	      	console.log("error",error)
	      } else if (newToken) {
		       outlook.calendar.createEvent({token: newToken.token.access_token, event: newEvent},
					  function(error, result){
					    if (error) {
					      console.log('createEvent returned an error: ' + error);
					    }
					    else if (result) {
					      console.log(JSON.stringify(result, null, 2));
					    }
				});
	      }
	    })
  	
    done(null, {
      Message: 'Event Succesfully inserted in your Outlook Calendar'
    })
  }
}

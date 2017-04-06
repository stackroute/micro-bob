module.exports = function google_calendar (options) {
  this.add('api:calendar,impl:google,cmd:ping', ping)
  function ping (msg,done){
    done(null,{
      reply:'pong'
    })
  }
  this.add('api:calendar,impl:google,cmd:addEvent', google_cal)
 function google_cal (msg, done) {
      let google = require('googleapis')
        , calendar = google.calendar('v3')
      , OAuth2Google = google.auth.OAuth2
      , clientId = '616007233163-g0rk4o8g107upgrmcuji5a8jpnbkd228.apps.googleusercontent.com'
      , clientSecret = 'h0DIE4B8pncOEtgMfK2t9rcr'
      , redirect = 'http://localhost:8000/oauth2callback'
      , oauth2Client = new OAuth2Google(clientId, clientSecret, redirect);

      oauth2Client.credentials = msg.info.token;
      oauth2Client.refreshAccessToken(function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        else{
            oauth2Client.credentials = token;
            gfunction(oauth2Client, msg.info.name,msg.info.details.summary,msg.info.details.location,msg.info.details.startDate,msg.info.details.endDate);
            done(null, {
              Message: 'Event Succesfully inserted in your Google Calendar',
              NewToken : token
            })
        }    

     });
      function gfunction(oauth2Client, username,summary,location,sd,ed){
        let event = {
            'summary':summary,
            'location' : location,
            'description' : 'Remainder created by bob!!!',
            'start' : {
                'dateTime' : sd,
                'timeZone' : 'Asia/Calcutta',
            },
            'end': {
                'dateTime': ed,
                'timeZone': 'Asia/Calcutta',
            },
            'reminders' : {
                'useDefault' : 'useDefault',
            }
        };
        calendar.events.insert({
            auth : oauth2Client,
            calendarId : 'primary',
            resource : event,
        },function(err,event){
            if(err){
                console.log("ERROR CONTACTING CALENDAR");
            }
            else{
                console.log("EVENT SUCCESSFULLY CREATED");
            }
        });
    }
  }
}
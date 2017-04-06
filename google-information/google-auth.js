module.exports = function google_auth (options) {
  this.add('api:auth,impl:google', google_authentication)

 function google_authentication (infoParam, done) {
      let google = require('googleapis')
      , OAuth2Google = google.auth.OAuth2
      , clientId = '616007233163-g0rk4o8g107upgrmcuji5a8jpnbkd228.apps.googleusercontent.com'
      , clientSecret = 'h0DIE4B8pncOEtgMfK2t9rcr'
      , redirect = 'http://localhost:8000/oauth2callback'
      , oauth2Client = new OAuth2Google(clientId, clientSecret, redirect);
    
    var stringified = JSON.stringify(infoParam)
    var data = JSON.parse(stringified)
    

           oauth2Client.getToken(data.info.codes, function(err, gtoken){
               if(err){
                   console.log("Error generating new Token");
               }
               else{
                   oauth2Client.credentials = gtoken;
                   done(null, {url: gtoken})
               }
           });

     }
}
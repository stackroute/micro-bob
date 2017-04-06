module.exports = function outlook_auth (options) {
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

		var redirectUri = 'http://localhost:8000/callback';

		// The scopes the app requires
		var scopes = [ 'openid',
		           'offline_access',
		           'https://outlook.office.com/calendars.readwrite'];
    

	var outlook = require('node-outlook');  


    this.add('api:auth,impl:outlook', outlook_authentication)

  	function outlook_authentication (msg, done) {
  	
		var stringified = JSON.stringify(msg)
	    var data = JSON.parse(stringified);
	    var token;
		  oauth2.authorizationCode.getToken({
		    code: data.info.codes,
		    redirect_uri: redirectUri,
		    scope: scopes.join(' ')
		  }, function (error, result) {
		    if (error) {
		      console.log('Access tokennnnnn error: ', error.message);
		      //callback(response, error, null);
		    } else {
		      token = oauth2.accessToken.create(result);
		      done(null,{url:token})
		      //callback(response, null, token);
		    }
		  });
	    
  	}
  	function getTokenFromCode(auth_code, callback, response) {
		  var token;
		  oauth2.authorizationCode.getToken({
		    code: auth_code,
		    redirect_uri: redirectUri,
		    scope: scopes.join(' ')
		  }, function (error, result) {
		    if (error) {
		      console.log('Access tokennnnnn error: ', error.message);
		      callback(response, error, null);
		    } else {
		      token = oauth2.accessToken.create(result);
		      console.log('Token created:------------------- ', token, '----------------------------');
		      return token; 
		      callback(response, null, token);
		    }
		  });
	}

	function tokenReceived(response, error, token) {
	  if (error) {
	    console.log('Access token error: ', error.message);
	    response.writeHead(200, {'Content-Type': 'text/html'});
	    response.write('<p>ERROR: ' + error + '</p>');
	    response.end();
	  } else {
	  	// console.log(token);
	  	// console.log("+++++++++++++",response,"++++++++++++++++++")
	    getUserEmail(token.token.access_token, function(error, email){
	      if (error) {
	        console.log('getUserEmail returned an error: ' + error);
	        // response.write('<p>ERROR: ' + error + '</p>');
	        // response.end();
	      } else if (email) {

	      	console.log(email);
	        var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=4000',
	                       'node-tutorial-refresh-token=' + token.token.refresh_token + ';Max-Age=4000',
	                       'node-tutorial-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=4000',
	                       'node-tutorial-email=' + email + ';Max-Age=4000'];
	        response.setHeader('Set-Cookie', cookies);
	        response.writeHead(302, {'Location': 'http://localhost:8000/mail'});
	        response.end();
	      }
	    }); 
	  }
	}
	function refreshAccessToken(refreshToken, callback) {
	  var tokenObj = oauth2.accessToken.create({refresh_token: refreshToken});
	  tokenObj.refresh(callback);
	}

	function getAccessToken(request, response, callback) {
	  var expiration = new Date(parseFloat(getValueFromCookie('node-tutorial-token-expires', request.headers.cookie)));

	  if (expiration <= new Date()) {
	    // refresh token
	    console.log('TOKEN EXPIRED, REFRESHING');
	    var refresh_token = getValueFromCookie('node-tutorial-refresh-token', request.headers.cookie);
	    authHelper.refreshAccessToken(refresh_token, function(error, newToken){
	      if (error) {
	        callback(error, null);
	      } else if (newToken) {
	        var cookies = ['node-tutorial-token=' + newToken.token.access_token + ';Max-Age=4000',
	                       'node-tutorial-refresh-token=' + newToken.token.refresh_token + ';Max-Age=4000',
	                       'node-tutorial-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=4000'];
	        response.setHeader('Set-Cookie', cookies);
	        callback(null, newToken.token.access_token);
	      }
	    });
	  } else {
	    // Return cached token
	    var access_token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
	    callback(null, access_token);
	  }
	}

	function getUserEmail(token, callback) {
	  // Set the API endpoint to use the v2.0 endpoint
	  outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

	  // Set up oData parameters
	  var queryParams = {
	    '$select': 'DisplayName, EmailAddress',
	  };

	  outlook.base.getUser({token: token, odataParams: queryParams}, function(error, user){
	    if (error) {
	      callback(error, null);
	    } else {
	      callback(null, user.EmailAddress);
	    }
	  });
	}



}

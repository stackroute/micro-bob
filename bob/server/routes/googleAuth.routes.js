const express = require('express')
    , router = express.Router();
const ajax = require('superagent');
//Google Auth ---------->
let google = require('googleapis')
  , calendar = google.calendar('v3')
  , OAuth2Google = google.auth.OAuth2
  , clientId = '616007233163-g0rk4o8g107upgrmcuji5a8jpnbkd228.apps.googleusercontent.com'
  , clientSecret = 'h0DIE4B8pncOEtgMfK2t9rcr'
  , redirect = 'http://localhost:8000/oauth2callback'
  , oauth2Client = new OAuth2Google(clientId, clientSecret, redirect)
  , GoogleAToken = require('./../model/googleatoken.schema.js');

//google auth and reminder set routes ---------->
router.get('/oauth2callback', function(req, res) {
  let state = req.query.state;
  obj = JSON.parse(state);
  ajax.get('localhost:8000/api/authentication/google?code='+req.query.code+'&state='+obj.username,function(err,data){});
  res.redirect('http://localhost:8000/#/bob');
});
module.exports = router;

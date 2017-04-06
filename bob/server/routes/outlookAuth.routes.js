const express = require('express')
    , router = express.Router();
const ajax = require('superagent');

router.get('/callback', function(req, res) {

  ajax.get('localhost:8000/api/authentication/outlook?code='+req.query.code+'&state='+JSON.parse(req.query.state).username,function(err,data){

  });
  res.redirect('http://localhost:8000/#/bob');
});

module.exports = router;
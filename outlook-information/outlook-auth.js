module.exports = function outlook_auth (options) {
  this.add('api:auth,impl:outlook', outlook_authentication)

  function outlook_authentication (msg, done) {
    done(null, {
    	url: 'Outlook authentication url'      
    })
  }
}

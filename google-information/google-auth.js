module.exports = function google_auth (options) {
  this.add('api:auth,impl:google', google_authentication)

  function google_authentication (msg, done) {
    done(null, {
    	url: 'URL for google authentication'      
    })
  }
}

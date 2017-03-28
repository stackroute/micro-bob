module.exports = function google_info (options) {
  this.add('api:info,impl:google', google_information)

  function google_information (msg, done) {
    done(null, {
    	logo: 'Google_Logo', 
    	label: 'Google_Label'      
    })
  }
}

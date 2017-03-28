module.exports = function outlook_info (options) {
  this.add('api:info,impl:outlook', outlook_information)

  function outlook_information (msg, done) {
    done(null, {
    	logo: 'Outlook_Logo', 
    	label: 'Outlook_Label'     
    })
  }
}

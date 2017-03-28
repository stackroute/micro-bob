module.exports = function product (options) {
  this.add('api:calendar,impl:outlook', outlook_calendar)

  function outlook_calendar (msg, done) {
    done(null, {
      Message: 'This is the Outlook Calendar Service'
    })
  }
}

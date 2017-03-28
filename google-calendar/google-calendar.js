module.exports = function google_calendar (options) {
  this.add('api:calendar,impl:google', google_cal)

  function google_cal (msg, done) {
    done(null, {
      Message: 'This is the Google Calendar Service'
    })
  }
}

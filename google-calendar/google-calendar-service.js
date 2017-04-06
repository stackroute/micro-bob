var Seneca = require('seneca')

Seneca({tag: 'calendar'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })
  .use('./google-calendar')
  .use('mesh', {
    listen: [
      {pin: 'api:calendar,impl:google,cmd:ping'},
      {pin: 'api:calendar,impl:google,cmd:addEvent'}
    ],
    host: '@eth0',
    discover: {
      registry: {
        active: true
      },
      multicast: {
        active: false
      }
    }
  })
  .ready(function () {
    var seneca = this
    console.log('google_calendar', seneca.id)
  })

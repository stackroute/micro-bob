var Seneca = require('seneca')

Seneca({tag: 'calendar'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })
  .use('./google-calendar')
  .use('mesh', {
    pin: 'api:calendar,impl:google',
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

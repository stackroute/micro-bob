var Seneca = require('seneca')

Seneca({tag: 'calendar'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })  
  .use('./google-auth')
  .use('./google-info')
  .use('mesh', {
    listen: [
              {pin: 'api:auth,impl:google'},
              {pin: 'api:info,impl:google'}
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
    console.log('google_calendar_info', seneca.id)
  })

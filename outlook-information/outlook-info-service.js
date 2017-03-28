var Seneca = require('seneca')

Seneca({tag: 'calendar'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })  
  .use('./outlook-auth')
  .use('./outlook-info')
  .use('mesh', {
    listen: [
              {pin: 'api:auth,impl:outlook'},
              {pin: 'api:info,impl:outlook'}
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
    console.log('outlook_calendar_info', seneca.id)
  })

var Seneca = require('seneca')

Seneca({tag: 'calendar'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })
  .use('./outlook-calendar')
  .use('mesh', {
    pin: 'api:calendar,impl:outlook',
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
    console.log('outlook_calendar', seneca.id)
  })

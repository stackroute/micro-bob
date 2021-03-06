var Seneca = require('seneca')

Seneca({tag: 'calendar'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })
  .use('./outlook-calendar')
  .use('mesh', {
    listen: [
      {pin: 'api:calendar,impl:outlook,cmd:ping'},
      {pin: 'api:calendar,impl:outlook,cmd:addEvent'}
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
    console.log('outlook_calendar', seneca.id)
  })

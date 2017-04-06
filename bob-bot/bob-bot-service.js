var Seneca = require('seneca')

Seneca({tag: 'bot'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })
  .use('./bob-bot')
  .use('mesh', {
    listen: [
      {pin: 'api:bot,impl:concepts-bot,intent:greeting'},
      {pin: 'api:bot,impl:concepts-bot,intent:documentsearch'}
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
    console.log('concepts-bot', seneca.id)
  })

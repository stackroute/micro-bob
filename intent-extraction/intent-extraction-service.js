var Seneca = require('seneca')

Seneca({tag: 'intent'})
  .test('print')
  .use('consul-registry', {
    host: 'consul'
  })
  .use('./intent-extraction')
  .use('mesh', {
    pin: 'api:bot,impl:nlu,cmd:extractIntent',
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
    console.log('intent_extraction', seneca.id)
  })

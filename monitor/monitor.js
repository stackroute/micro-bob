var Seneca = require('seneca')

Seneca({log: 'silent'})
  .use('consul-registry', {
    host: 'consul'
  })
  .use('mesh', {
    monitor: true,
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

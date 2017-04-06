const redis = require('redis');
module.exports = redis.createClient('redis://172.23.238.216:6379');

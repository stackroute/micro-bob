const deleteMessage = require('./deleteMessage');

const seneca = require('seneca')();
seneca.use(deleteMessage);

deleteMessage.act('',{},console.log);
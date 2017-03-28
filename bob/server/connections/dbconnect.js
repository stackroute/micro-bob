const mongoose = require('mongoose');
mongoose.connect('mongodb://172.23.238.194:27017/test');
module.exports = mongoose.connection;

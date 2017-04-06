const mongoose = require('mongoose')
    , Schema = mongoose.Schema;
let outlookaccesstokenSchema = new Schema({
  username : String,
  token : {}
});
module.exports = mongoose.model('outlookatoken', outlookaccesstokenSchema);

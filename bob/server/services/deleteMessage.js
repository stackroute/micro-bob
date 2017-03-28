module.exports = function( options ) {
  var seneca = this;

  seneca.add( { role:'actions', cmd:'delete' }, deleteMessage);

}
module.exports = function( options ) {
  var seneca = this;

  seneca.add( { role:'actions', cmd:'edit' }, editMessage);

  function editMessage ( args, done ) {
    
  }
}
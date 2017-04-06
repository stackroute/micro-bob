const recastai = require('recastai');
const aiclient = new recastai.Client('bd8975c331f2800dd57a331b25e2cc9a','en');

module.exports = function() {
	this.add('api:bot,impl:nlu,cmd:extractIntent', extractIntent);

	function extractIntent({sentence}, done) {
		aiclient.textConverse(sentence)
			.then(function({action, entities}) {
				console.log('action', action);
				console.log('entities', entities);
				done(null, {action, entities});
		}, done);
	}
};

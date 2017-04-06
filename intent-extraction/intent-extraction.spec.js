const should = require('should');

const nluMicroservice = require('seneca')();
nluMicroservice.use('./intent-extraction');

describe('intentExtraction', function() {
	this.timeout(5000);

	it('should return intent and entities when invoked', function(done) {
		const sentence = "Check arrays in python";
		nluMicroservice.act('api:bot,impl:nlu,cmd:extractIntent', {sentence}, (err, res) => {
			res.should.have.property('entities');
			res.should.have.property('action');
			res.action.should.have.property('slug').and.be.exactly('documentsearch');
			done();
		});
	});
});

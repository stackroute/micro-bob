const request = require('superagent-relative');
const async = require('async');
const recastai = require('recastai');
const aiclient = new recastai.Client('bd8975c331f2800dd57a331b25e2cc9a','en');

const querySyntaxDB = require('./querySyntaxDB');
const queryOxygen = require('./queryOxygen');

// Seneca plugin for bob-bot
// listens to conversations.
// If its a greeting, it'll reply with a greeting
// If its a query about concepts, it will retrieve the conecpt from syntaxdb, as well as from oxygen
// If its a request for documents, it will fetch those documents from oxygen


module.exports = function() {
    const syntaxDBSupportedLanguages = ['c', 'c++', 'c#', 'java', 'javascript', 'python', 'ruby', 'swift', 'go'];
    const oxygenSupportedLangauges = ['java','react','javascript','mongodb','php','python'];

    this.add('api:bot,impl:concepts-bot,intent:greeting', function(msg, done) {
        done(null, {reply: 'Hi. What can I do for you?'});
    });

    this.add('api:bot,impl:concepts-bot,intent:documentsearch', function({language, concept, requiredDetails, oxyLanguage, oxyConcept}, done) {
        if(!language) {
            done(null, {reply: 'What language?'});
            return;
        }

        if(!concept) {
            done(null, {reply: 'What concept'});
        }

        const processes = [];
        // Check if programming language is supported by oxygen
        const isSupportedByOxygen = oxygenSupportedLangauges.indexOf(language.toLowerCase()) >= 0;

        // Query Oxygen
        if(isSupportedByOxygen) processes.push(queryOxygen.bind(null, {oxyLanguage, oxyConcept}));

        // Check if programming langauge is supported by SyntaxDB
        const isSupportedBySyntaxDB = syntaxDBSupportedLanguages.indexOf(language) >= 0;

        // Query SyntaxDB
        if(isSupportedBySyntaxDB) processes.push(querySyntaxDB.bind(null, {language, concept, requiredDetails}));

        async.parallel(processes, (err, results) => {
            if(err) { done(err); return }

            const oxygenResult = isSupportedByOxygen ? results[0] : null;
            const syntaxDBResult = isSupportedBySyntaxDB ? (isSupportedByOxygen ? results[1] : results[0]) : null;
            var reply = '';
            if(syntaxDBResult){
                if(syntaxDBResult.result===''){
                    reply = '';
                }
                else{
                    reply = reply + syntaxDBResult.result + '\n';
                }
            }
            if(oxygenResult){
                reply = reply + oxygenResult.result;
            }
            console.log('this is replyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy: ',reply)
            if(reply === ''){
                reply = 'Sorry! Unable to fetch that concept!';
            }
            done(null, {reply: reply});
        });
    });
};
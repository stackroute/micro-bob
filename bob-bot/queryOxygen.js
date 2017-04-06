const request = require('superagent-relative');

function queryOxygen({oxyLanguage, oxyConcept}, done) {
    
    var lang = oxyLanguage.toLowerCase().charAt(0).toUpperCase()+oxyLanguage.toLowerCase().substr(1);
    var concept=[];
    if(lang === 'Javascript' || lang === 'javascript' ||lang === 'javascript'){
        lang = 'JavaScript';
    }
    concept.push(oxyConcept);
    console.log('INSIDE QUERYOXYGENNNNNNNNNNNN'+lang+' '+oxyConcept);
    var botMsg = '';
    request.post("http://oxygen.blr.stackroute.in/domain/documents/Search").send(
    {"domainName": lang, "reqIntents": [], "reqConcepts": concept, "allIntents": ["introduction"]}
    ).end((err, res)=>{
        console.log('Inside queryOxygen: ', res.body);
        var oxyResponse = res.body;
        var noLinks = oxyResponse.length;
        var detCategory = ['title', 'url'];
        for(var i=0; i<noLinks; i++){
            detCategory.forEach(function(element){
                if(oxyResponse[i][element] == undefined || oxyResponse[i][element] === 'undefined'){
                    oxyResponse[i][element] = 'Title Missing'
                }
                botMsg = botMsg + '\n' + oxyResponse[i][element] + '\n';
            });
        }
        done(null, {result: botMsg});        
    });
}

module.exports = queryOxygen;
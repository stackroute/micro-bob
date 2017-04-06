const request = require('superagent-relative');

function querySyntaxDB({language, concept, requiredDetails}, done) {

    //console.log('Inside querySyntaxDB, language is: ', language);
    //console.log('Inside querySyntaxDB, concept is: ', concept);

    if(requiredDetails){
        console.log('This is requiredDetails : ',requiredDetails);
        reqDetails=requiredDetails.replace(/,/g, '%2C');
        request.get('https://syntaxdb.com/api/v1/languages/'+language+'/concepts/search?q='+concept+'&fields='+reqDetails+'&limit=1')
        .end((err, res)=>{
            //console.log('In syntaxDB response is :', res);
            console.log('response text........:', res.text);
            var syntaxdbResponse = JSON.parse(res.text);
            if(syntaxdbResponse[0]){
                var detCategory = requiredDetails.split(',');
                var botMsg = '';
                console.log('this is syntasdb response :',syntaxdbResponse[0]);
                var check = true;
                detCategory.forEach(function(element){
                    var mark = check ? '```' : '';
                    botMsg =  mark + botMsg + '\n\n' + element.toUpperCase() + ':\n' + syntaxdbResponse[0][element];
                    check = false;
                });
                done(null, {result: botMsg});
            }
            else{
                done(null, {result: ''});
            }
        })
    }
    else{
        request.get('https://syntaxdb.com/api/v1/languages/'+language+'/concepts/search?q='+concept+'&limit=1')
        .end((err, res)=>{
            //console.log('In syntaxDB response is :', res);
            var syntaxdbResponse = JSON.parse(res.text);
            console.log('response text........:', res.text);
            if(syntaxdbResponse[0]){
                var detCategory = ['description', 'syntax', 'example'];                
                var botMsg = '';
                console.log('this is syntasdb response :',syntaxdbResponse[0]);
                var check = true;
                detCategory.forEach(function(element){
                    var mark = check ? '```' : '';
                    botMsg =  mark + botMsg + '\n\n' + element.toUpperCase() + ':\n' + syntaxdbResponse[0][element];
                    check = false;
                });
                done(null, {result: botMsg});
            }
            else{
                done(null, {result: ''});
            }
        })
    }
    // done(null,{result: 'This is query syntaxdb'})    
}

module.exports = querySyntaxDB;
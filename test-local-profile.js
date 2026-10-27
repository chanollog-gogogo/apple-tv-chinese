// Portable JavaScriptCore/Node test. The host supplies bundleSource and fixtures.
(function(){
  function check(ok,msg){if(!ok)throw Error(msg);}
  var forbiddenCalls=0,doneCount=0,caseCount=0;
  function forbidden(){forbiddenCalls++;throw Error('Local diagnostic performed external work');}
  var handler=new Function('$request','$response','$argument','$done','$httpClient','$persistentStore','setTimeout','clearTimeout','console',bundleSource);
  var adapter=new Function(subtitleSource+';return AppleTVSubtitleCompat;')();
  var tables=JSON.parse(subtitleTablesJSON);
  var display=/^(title|shortTitle|subtitle|description|summary|heroDescription|seoDescription|seoTitle|showTitle|episodeTitle|movieTitle|localizedType|name|displayName|label|buttonText|text|badge|eyebrow|genre)$/;
  function keep(x){
    if(!x||typeof x!=='object')return x;
    if(Array.isArray(x))return x.map(keep);
    var r={};Object.keys(x).forEach(function(k){if(display.test(k)&&typeof x[k]==='string')return;r[k]=keep(x[k]);});return r;
  }
  fixtures.forEach(function(item){
    var result,calls=0,logs=[];
    handler({method:'GET',url:'https://uts-api.itunes.apple.com/uts/v3/'+item.path+'?sf=143441&token=NEVER_LOG'},
      {status:200,body:item.body},'mode=local',function(v){calls++;result=v;},
      {get:forbidden},{read:forbidden,write:forbidden},forbidden,forbidden,{log:function(v){logs.push(v);}});
    check(calls===1,'Exactly one synchronous completion is required');doneCount+=calls;
    check(!JSON.stringify(logs).includes('NEVER_LOG'),'Diagnostic output leaked input');
    var before=JSON.parse(item.body),after=result.body?JSON.parse(result.body):JSON.parse(item.body);
    adapter.apply(before,tables);
    check(JSON.stringify(keep(before))===JSON.stringify(keep(after)),'Protected fields changed');
    if(item.expectUI)check(JSON.stringify(after).includes('立即观看'),'Local label was not rewritten');
    if(item.untouched)check(!result.body,'Bootstrap or account response was rewritten');
    caseCount++;
  });
  check(forbiddenCalls===0,'HTTP, timer or cache operations were attempted');
  return 'PASS local-only profile: '+caseCount+' cases, '+doneCount+' completions, no HTTP/timer/cache, protected data and original subtitle mapping preserved';
})();

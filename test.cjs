const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { rewrite, display, imageKeys, episodes } = require('./apple-tv-zh.js');
const url = 'https://uts-api.itunes.apple.com/uts/v3/shows/' + display.id + '?caller=js&v=100&sf=143441&locale=en-US&pfm=desktop&utsk=0';
const req = { url, method:'GET', headers:{Authorization:'private',Cookie:'private'} };
const original = {
  data: {
    content: {
      id:display.id,title:'Silo',description:'English description',
      images:{contentLogo:{url:'https://example.test/logo'},posterArt:{url:'https://example.test/poster'},contentImage16X9:{url:'https://example.test/wide'},background:{url:'unchanged'}},
      playables:{main:{url:'https://play.itunes.apple.com/test',token:'private'}},
      offers:[{price:0,currency:'USD',entitled:true}],url:'https://tv.apple.com/us/show/silo/'+display.id
    },
    canvas:{shelves:[{items:[{id:'other',title:'Other title',price:0}]}]}
  },
  account:{storefront:'143441'}
};
const clone = x => JSON.parse(JSON.stringify(x));
function undecorate(x) {
  x=clone(x); delete x.data.content.title; delete x.data.content.description;
  for(const key of imageKeys) delete x.data.content.images[key];
  if (x.data.smartEpisode && episodes[x.data.smartEpisode.id] && x.data.smartEpisode.showId === display.id)
    for(const key of ['title','description','showTitle']) delete x.data.smartEpisode[key];
  return x;
}
let count=0;
function test(label, fn){fn();console.log('PASS',label);count++;}
test('only five allowlisted display paths change; all other data identical',()=>{
  const before=JSON.stringify(original), r=JSON.parse(rewrite(req,{body:before}));
  assert.equal(r.data.content.title,'末日地堡');
  assert.equal(r.data.content.description,display.description);
  assert.deepEqual(undecorate(r),undecorate(original));
  assert.equal(JSON.stringify(original),before);
  assert.deepEqual(req.headers,{Authorization:'private',Cookie:'private'});
});
test('other shows, all home/catalog/account/playback routes skipped',()=>{
  for(const path of ['shows/other','shows/'+display.id+'/episodes','canvases/Roots/tahoma_watchnow','configurations','movies/x','playables/x','user/settings','watchlist'])
    assert.equal(rewrite({...req,url:'https://uts-api.itunes.apple.com/uts/v3/'+path+'?sf=143441'},{body:JSON.stringify(original)}),null);
  assert.equal(rewrite({...req,url:url.replace('uts-api.itunes.apple.com','uts-api.itunes.apple.com.evil.test')},{body:JSON.stringify(original)}),null);
});
test('region, methods, response IDs and error statuses fail open',()=>{
  for(const sf of ['143464','143470','143463','']) assert.equal(rewrite({...req,url:url.replace('143441',sf)},{body:JSON.stringify(original)}),null);
  assert.equal(rewrite({...req,method:'POST'},{body:JSON.stringify(original)}),null);
  for(const status of [403,404,500,'HTTP/1.1 403 Forbidden']) assert.equal(rewrite(req,{status,body:JSON.stringify(original)}),null);
  const bad=clone(original);bad.data.content.id='other';assert.equal(rewrite(req,{body:JSON.stringify(bad)}),null);
  for(const body of ['bad json','null','[]','{}','{"error":{}}'])assert.equal(rewrite(req,{body}),null);
});
test('no new image slots or playback changes; deterministic and idempotent',()=>{
  const noImages=clone(original);delete noImages.data.content.images;
  const out=JSON.parse(rewrite(req,{body:JSON.stringify(noImages)}));assert.equal(out.data.content.images,undefined);
  const one=rewrite(req,{body:JSON.stringify(original)});assert.equal(rewrite(req,{body:one}),one);
});
test('Shadowrocket and QuanX wrappers complete once, without network APIs',()=>{
  const source=fs.readFileSync(__dirname+'/apple-tv-zh.js','utf8');
  for(const status of [200,'HTTP/1.1 200 OK']){
    let calls=0,result;
    vm.runInNewContext(source,{$request:req,$response:{body:JSON.stringify(original),status},$done:r=>{calls++;result=r},console:{log(){}}});
    assert.equal(calls,1);assert.equal(JSON.parse(result.body).data.content.title,'末日地堡');
    assert.deepEqual(Object.keys(result),['body']);
  }
  let calls=0,result;vm.runInNewContext(source,{$request:req,$response:{body:'invalid'},$done:r=>{calls++;result=r},console:{log(){}}});
  assert.equal(calls,1);assert.equal(Object.keys(result).length,0);
  let legacyCalls=0,legacyResult;
  vm.runInNewContext(source,{$request:req,$done:r=>{legacyCalls++;legacyResult=r;},console:{log(){}}});
  assert.equal(legacyCalls,1);assert.equal(Object.keys(legacyResult).length,0);
});
test('current episode summary changes but playable/entitlement fields remain exact',()=>{
  const body=clone(original);
  body.data.smartEpisode={id:'umc.cmc.6ta3tndgffvigo7yd078eyy58',showId:display.id,title:'Into the Fire',description:'Season finale.',showTitle:'Silo',playableId:'protected',isEntitled:true,url:'https://tv.apple.com/us/episode/test'};
  const out=JSON.parse(rewrite(req,{body:JSON.stringify(body)}));
  assert.equal(out.data.smartEpisode.title,'进入火焰');
  assert.deepEqual(undecorate(out),undecorate(body));
});
test('episode list order/count and unknown episodes are preserved',()=>{
  const id='umc.cmc.6ta3tndgffvigo7yd078eyy58';
  const body={data:{episodes:[{id,showId:display.id,title:'English',description:'English',playableId:'protected'},{id:'unknown',showId:display.id,title:'Keep English'}],totalEpisodeCount:30,playables:{x:{hlsUrl:'keep'}},episodesPlayables:{x:[{playableId:'protected'}]}}};
  const r={...req,url:req.url.replace('?','/episodes?')};
  const out=JSON.parse(rewrite(r,{body:JSON.stringify(body)}));
  assert.equal(out.data.episodes[0].title,'进入火焰');
  out.data.episodes[0].title='English';out.data.episodes[0].description='English';
  assert.deepEqual(out,body);
  const ep={data:{content:{...body.data.episodes[0]},playables:body.data.playables}};
  const er={...req,url:req.url.replace('shows/'+display.id,'episodes/'+id)};
  const eo=JSON.parse(rewrite(er,{body:JSON.stringify(ep)}));assert.equal(eo.data.content.title,'进入火焰');assert.deepEqual(eo.data.playables,ep.data.playables);
});
if(process.argv.includes('--live'))test('real anonymous US response: full protected data unchanged',()=>{
  const raw=execFileSync('curl',['--retry','2','--compressed','-fLs','--max-time','25',url],{encoding:'utf8',maxBuffer:12*1024*1024});
  const before=JSON.parse(raw),result=rewrite(req,{body:raw});assert.ok(result,'expected US Silo response');
  const after=JSON.parse(result);assert.deepEqual(undecorate(before),undecorate(after));
  console.log('US title:',before.data.content.title,'->',after.data.content.title);
  console.log('All non-display response data unchanged; original US request untouched.');
});
console.log(count+' test groups passed');

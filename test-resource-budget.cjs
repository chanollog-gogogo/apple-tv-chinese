// Exercise the complete bundled response handler, including concurrent page
// loads and late network callbacks. No user data or live network is required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/apple-tv-full-subtitles.bundle.js','utf8');
const compat=require('./subtitle-adapter.js');
const tables=JSON.parse(fs.readFileSync(__dirname+'/subtitle-mappings-v261013a.json','utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function execute({body,path='shows/umc.cmc.example',reply=()=>({data:{}}),delay=1,scale=1,initialCache=null}){
  let original,active=0,peak=0,calls=0,doneCalls=0,originalParses=0,originalSerializes=0;
  const writes={},logs=[],requests=[];
  const input=typeof body==='string'?body:JSON.stringify(body);
  let complete;
  const done=new Promise(r=>complete=r);
  const context={
    $request:{method:'GET',url:'https://uts-api.itunes.apple.com/uts/v3/'+path+'?sf=143441&private=NEVER_FORWARD',headers:{Authorization:'NEVER_FORWARD',Cookie:'NEVER_FORWARD'}},
    $response:{status:200,body:input},
    $persistentStore:{read:k=>initialCache,write:(v,k)=>{writes[k]=v;return true;}},
    JSON:{parse(text){const parsed=JSON.parse(text);if(text===input){originalParses++;original=parsed;}return parsed;},
      stringify(value,...args){if(value===original)originalSerializes++;return JSON.stringify(value,...args);}},
    console:{log:x=>logs.push(x)},
    setTimeout:(f,ms)=>setTimeout(f,Math.max(1,ms*scale)),clearTimeout,
    $httpClient:{get(spec,cb){
      calls++;active++;peak=Math.max(peak,active);requests.push(spec);
      assert.ok(spec.url.startsWith('https://uts-api.itunes.apple.com/'));
      assert.ok(!JSON.stringify(spec).includes('NEVER_FORWARD'));
      setTimeout(()=>{active--;cb(null,{status:200},JSON.stringify(reply(spec)));},delay);
    }},
    $done:value=>{doneCalls++;complete(value);}
  };
  vm.runInNewContext(source,context,{timeout:2000});
  return {done,writes,logs,requests,metrics:()=>({calls,peak,doneCalls,originalParses,originalSerializes})};
}

(async()=>{
  const many={data:{items:Array.from({length:100},(_,i)=>({id:'umc.cmc.item'+i,type:'Show',title:'English '+i,assets:{hlsUrl:'US_KEEP',fpsKeyServerUrl:'US_LICENSE'},offers:[{entitled:true}]}))}};
  const budget=execute({body:many});
  const result=await budget.done;
  assert.ok(result.body);
  assert.deepEqual(JSON.parse(result.body),many);
  assert.equal(budget.metrics().calls,3);
  assert.equal(budget.metrics().peak,1);
  assert.equal(budget.metrics().originalParses,1);
  assert.equal(budget.metrics().originalSerializes,1);
  assert.equal(budget.metrics().doneCalls,1);
  assert.ok(!JSON.stringify(budget.logs).includes('NEVER_FORWARD'));
  console.log('PASS request cap 3, one helper at a time, original parsed/serialized once, original US data preserved');

  const localized={data:{items:many.data.items.map(o=>({id:o.id,type:o.type,title:'中文标题'+o.id,description:'公开简介'.repeat(900)}))}};
  const parallel=Array.from({length:4},()=>execute({body:many,reply:()=>localized}));
  for(const p of parallel){
    const r=await p.done,after=JSON.parse(r.body);
    assert.equal(p.metrics().calls,3);
    assert.equal(p.metrics().peak,1);
    assert.ok(after.data.items.every(o=>o.title.startsWith('中文标题')));
    assert.deepEqual(after.data.items.map(o=>o.assets),many.data.items.map(o=>o.assets));
    assert.deepEqual(after.data.items.map(o=>o.offers),many.data.items.map(o=>o.offers));
    assert.ok(Object.values(p.writes).every(v=>v.length<=96000));
  }
  console.log('PASS four simultaneous detail responses, localized titles, unchanged assets/rights, bounded persistent cache');

  const settings=execute({body:{data:{settings:{keep:true}}},path:'user/settings'});
  assert.deepEqual(Object.keys(await settings.done),[]);
  assert.equal(settings.metrics().calls,0);
  assert.equal(settings.metrics().originalParses,0);
  const cfg=execute({body:{data:{applicationProps:{storefront:{storefrontId:143441,defaultLocale:'en_US'},requiredParamsMap:{Default:{sf:'143441',locale:'en-US'}}}}},path:'configurations'});
  assert.deepEqual(Object.keys(await cfg.done),[]);
  assert.equal(cfg.metrics().calls,0);
  assert.equal(cfg.metrics().originalParses,0);
  console.log('PASS account settings skipped and bootstrap configuration skipped without parsing or helper requests');

  const hls='https://play.itunes.apple.com/WebObjects/MZPlayLocal.woa/hls/subscription/playlist.m3u8?a=6812093448&id=123';
  const playback={data:{assets:{hlsUrl:hls,fpsKeyServerUrl:'KEEP_LICENSE'},entitlements:{paid:true}}};
  const play=execute({body:playback,path:'playables/test'});
  const actual=JSON.parse((await play.done).body);
  const expected=JSON.parse(JSON.stringify(playback));compat.apply(expected,tables);
  assert.deepEqual(actual,expected);
  assert.equal(play.metrics().calls,0);
  console.log('PASS pinned subtitle mapping works offline, without downloading or executing upstream code');

  const big=execute({body:' '.repeat(768*1024+1)});
  assert.deepEqual(Object.keys(await big.done),[]);
  assert.equal(big.metrics().originalParses,0);
  const race=execute({body:many,delay:30,scale:0.001});
  await race.done;await sleep(70);
  assert.equal(race.metrics().doneCalls,1);
  console.log('PASS oversized body bypass before parse and late callbacks cannot complete twice');
})().catch(e=>{console.error(e);process.exitCode=1;});

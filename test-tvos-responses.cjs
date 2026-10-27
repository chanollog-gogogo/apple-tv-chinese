// Replay the four UTS routes observed together in the tvOS failure. Fixtures
// must be anonymous public Apple responses, never authenticated traffic dumps.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=process.argv[2];if(!dir)throw Error('Provide the directory of anonymous public tvOS fixtures');
const source=fs.readFileSync(__dirname+'/apple-tv-full-subtitles.bundle.js','utf8');
const adapter=require('./subtitle-adapter.js');
const tables=JSON.parse(fs.readFileSync(__dirname+'/subtitle-mappings-v261013a.json','utf8'));
const keys=new Set(['title','shortTitle','subtitle','description','summary','heroDescription','seoDescription','seoTitle','showTitle','episodeTitle','movieTitle','localizedType','name','displayName','label','buttonText','text','badge','eyebrow','genre']);
const blocked=/^(assets|offers|personalizedOffers|upsellOffers|itunesMediaApiData|rating|contentAdvisoryDetails|fpsKeyServerQueryParameters|userProps|contentPersonalizedInfo|episodesContentPersonalizedInfo|entitlements|purchase|purchases|license|licenses|headers|cookies)$/;
function protectedData(x){
  if(!x || typeof x!=='object')return x;
  if(Array.isArray(x))return x.map(protectedData);
  const r={};for(const [k,v]of Object.entries(x)){
    if(blocked.test(k)){r[k]=v;continue;}
    if(keys.has(k) && typeof v==='string')continue;
    if(k==='images'){r[k]=Object.keys(v).sort();continue;}
    r[k]=protectedData(v);
  }return r;
}
const shared={};
function run(id,episodes){return new Promise((resolve,reject)=>{
  const name=id+(episodes?'-episodes':''),input=fs.readFileSync(path.join(dir,'US-'+name+'.json'),'utf8');
  let active=0,peak=0,calls=0,originalParses=0;
  vm.runInNewContext(source,{
    $request:{method:'GET',url:'https://uts-api.itunes.apple.com/uts/v3/shows/'+id+(episodes?'/episodes':'')+'?sf=143441&pfm=atv&locale=en-US'},
    $response:{status:200,body:input},
    JSON:{parse:t=>{if(t===input)originalParses++;return JSON.parse(t);},stringify:JSON.stringify},
    $persistentStore:{read:k=>shared[k],write:(v,k)=>{shared[k]=v;return true;}},
    $httpClient:{get(spec,cb){
      calls++;active++;peak=Math.max(peak,active);
      const url=new URL(spec.url),region={143470:'TW',143464:'SG',143463:'HK'}[url.searchParams.get('sf')];
      assert.ok(region);assert.equal(url.searchParams.get('pfm'),'desktop');
      const m=/\/shows\/(umc\.cmc\.[a-z0-9]+)(\/episodes)?$/.exec(url.pathname);
      const file=m?path.join(dir,region+'-desktop-'+m[1]+(m[2]?'-episodes':'')+'.json'):'';
      const body=file && fs.existsSync(file)?fs.readFileSync(file,'utf8'):'{"data":{}}';
      setTimeout(()=>{active--;cb(null,{status:200},body);},2);
    }},setTimeout,clearTimeout,
    console:{log:x=>console.log(name,x)},
    $done:r=>{try{
      assert.ok(r.body);const output=JSON.parse(r.body),before=JSON.parse(input);adapter.apply(before,tables);
      assert.deepEqual(protectedData(output),protectedData(before));
      assert.equal(peak,1);assert.ok(calls<=3);assert.equal(originalParses,1);
      if(!episodes)assert.match(output.data.content.title,/[\u3400-\u9fff]/);
      console.log('PASS',name,'bytes='+Buffer.byteLength(input),'calls='+calls,'peak='+peak,'title='+(output.data.content?.title||'(episode list)'));
      resolve();
    }catch(e){reject(e);}}
  },{timeout:3000});
});}
const ids=fs.readdirSync(dir).map(n=>/^US-(umc\.cmc\.[a-z0-9]+)\.json$/.exec(n)).filter(Boolean).map(m=>m[1]);
assert.ok(ids.length>0,'No anonymous public show fixtures found');
Promise.all(ids.flatMap(id=>[run(id,false),run(id,true)])).then(()=>console.log('PASS concurrent tvOS routes; US catalog, playback, rights and subtitle adaptation preserved')).catch(e=>{console.error(e);process.exitCode=1;});

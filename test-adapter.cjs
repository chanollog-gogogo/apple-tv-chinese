const assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process'),fs=require('node:fs');
const adapter=require('./subtitle-adapter.js');
const source=process.env.SUBTITLE_UPSTREAM_FIXTURE?fs.readFileSync(process.env.SUBTITLE_UPSTREAM_FIXTURE,'utf8'):cp.execFileSync('curl',['--compressed','-fLs','--max-time','20',adapter.source],{encoding:'utf8'});
const tables=adapter.parse(source);
assert.deepEqual(tables,JSON.parse(fs.readFileSync(__dirname+'/subtitle-mappings-v261013a.json','utf8')));
const urls=['https://play.itunes.apple.com/other?a=unknown','https://play-edge.itunes.apple.com/other','https://evil.test/play.itunes.apple.com','https://play.itunes.apple.com.evil.test/keep','https://hls-amt.itunes.apple.com/already/bridged','http://play.itunes.apple.com/keep'];
function native(q){return 'https://play-edge.itunes.apple.com/WebObjects/MZPlayLocal.woa/hls/subscription/playlist.m3u8?'+q;}
for(const id of Object.keys(tables.shelfTargets)){urls.push(native('a='+id+'&id=123'));urls.push(native('mainAssetAdamId='+id+'&id=123'));}
for(const[id,t]of Object.entries(tables.seriesTargets)){urls.push(native('a='+id+'&id='+t.programId));urls.push(native('a='+id+'&id=wrong'));}
for(const t of tables.f1Replays){urls.push(native('a='+t.assetId+'&id='+t.programId));urls.push(native('a='+t.assetId+'&id=wrong'));}
urls.push(native('a=6796433608&id=128974'));
const body={items:urls.map(hlsUrl=>({hlsUrl,fpsKeyServerUrl:'US_KEEP',entitled:true,price:0})),account:{keep:'unchanged'}};
let expected,calls=0;vm.runInNewContext(source,{$response:{body:JSON.stringify(body)},$done:r=>{expected=JSON.parse(r.body);calls++;}},{timeout:1000});
assert.equal(calls,1);
const after=JSON.parse(JSON.stringify(body));adapter.apply(after,tables);
assert.deepEqual(after,expected);
assert.throws(()=>adapter.parse('downloaded JavaScript is never executed'));
console.log('PASS '+urls.length+' HLS cases equal the exact installed subtitle handler; no other fields changed.');
console.log('PASS downloaded input is parsed as fixed JSON constants, never evaluated.');

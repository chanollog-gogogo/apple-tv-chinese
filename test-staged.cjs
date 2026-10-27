const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const bundleSource=fs.readFileSync(__dirname+'/apple-tv-full-subtitles.bundle.js','utf8');
const fixtures=[{path:'shows/umc.cmc.example',expectUI:true,body:JSON.stringify({data:{content:{id:'umc.cmc.example',type:'Show',title:'English Title',label:'Watch Now',assets:{hlsUrl:'https://play.itunes.apple.com/WebObjects/MZPlayLocal.woa/hls/subscription/playlist.m3u8?a=6812093448&id=123',fpsKeyServerUrl:'KEEP_DRM'},offers:[{price:0,currency:'USD',entitled:true}]}}})},
{path:'configurations',untouched:true,body:JSON.stringify({data:{applicationProps:{requiredParamsMap:{Default:{sf:'143441',locale:'en-US'}}}}})},
{path:'user/settings',untouched:true,body:'{"data":{"settings":{"keep":true}}}'}];
if(process.argv[2])for(const file of fs.readdirSync(process.argv[2]).filter(x=>/^US-.*\.json$/.test(x))){
 const m=/^US-(umc\.cmc\.[a-z0-9]+)(-episodes)?\.json$/.exec(file);if(!m)continue;
 fixtures.push({path:'shows/'+m[1]+(m[2]?'/episodes':''),body:fs.readFileSync(path.join(process.argv[2],file),'utf8')});
}
const context={bundleSource,fixtures,subtitleSource:fs.readFileSync(__dirname+'/subtitle-adapter.js','utf8'),subtitleTablesJSON:fs.readFileSync(__dirname+'/subtitle-mappings-v261013a.json','utf8')};
console.log(vm.runInNewContext(fs.readFileSync(__dirname+'/test-local-profile.js','utf8'),context,{timeout:3000}));
for(const name of ['AppleTV-Chinese-TVOS-LocalCheck.srmodule','AppleTV-Chinese-TVOS-JSC.srmodule']){
 const module=fs.readFileSync(__dirname+'/'+name,'utf8'),line=module.split('\n').find(l=>l.startsWith('AppleTV-Full.response ='));
 assert.match(line,/engine=jsc,/);assert.match(line,/max-size=786432,/);
 const regex=new RegExp(line.match(/pattern=(.*?),requires-body=/)[1]);
 for(const route of ['canvases/Roots/example','shows/umc.cmc.example','shows/umc.cmc.example/episodes','movies/umc.cmc.example','shelves/a'])assert.ok(regex.test('https://uts-api.itunes.apple.com/uts/v3/'+route+'?sf=143441'));
 for(const route of ['configurations','user/settings','user/entitlements','purchases','playables/a'])assert.ok(!regex.test('https://uts-api.itunes.apple.com/uts/v3/'+route));
}
console.log('PASS explicit JSC module parameters; protected bootstrap/account/playback routes excluded before body buffering');
if(process.env.JSC_FIXTURE_OUT)fs.writeFileSync(process.env.JSC_FIXTURE_OUT,JSON.stringify(fixtures));

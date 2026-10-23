const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { transform } = require('./apple-tv-zh.js');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS', name); }
const base = 'https://uts-api.itunes.apple.com';
const input = {
  url: base + '/uts/v3/shows/umc.cmc.example?sf=143441&locale=en-US&utsk=test%3Akey&pfm=appletv&v=100',
  method: 'GET', headers: {'X-Apple-Store-Front':'143441-19,29', 'X-Apple-I-Locale':'en_US', Cookie:'private', Authorization:'private'}
};
test('SG metadata parameters and preservation', () => {
  const result = transform(input, 'SG');
  const url = new URL(result.url);
  assert.equal(url.searchParams.get('sf'), '143464');
  assert.equal(url.searchParams.get('locale'), 'zh-Hans');
  assert.equal(url.searchParams.get('utsk'), 'test:key');
  assert.equal(url.searchParams.get('pfm'), 'appletv');
  assert.equal(result.headers.Cookie, 'private');
  assert.equal(result.headers.Authorization, 'private');
  assert.equal(result.headers['X-Apple-Store-Front'], '143464-19,29');
  assert.equal(input.headers['X-Apple-Store-Front'], '143441-19,29');
});
test('display endpoints on tvOS, macOS and iOS', () => {
  for (const pfm of ['appletv','desktop','iphone']) for (const path of ['canvases/Roots/tahoma_watchnow','canvases/Channels/tvs.sbd.4000','shelves/uts.col.Test','movies/umc.cmc.x','shows/umc.cmc.x/episodes','episodes/umc.cmc.x','search/landing','brands/appleTvPlus','channels']) {
    assert.ok(transform({url:base+'/uts/v3/'+path+'?pfm='+pfm}, 'SG'));
  }
});
test('configuration keeps suffix and optional parameters', () => {
  const result = transform({url:base+'/uts/v3/configurations?region=US&country=US&sfh=143441-19%2C29'}, 'TW');
  const url = new URL(result.url);
  assert.equal(url.searchParams.get('region'),'TW');
  assert.equal(url.searchParams.get('sfh'),'143470-19,29');
});
test('sensitive and playback routes unchanged', () => {
  for (const path of ['user/settings','watchlist','favorites/add','playables/umc.cmc.x','movies/umc.cmc.x/play','shows/umc.cmc.x/playables']) assert.equal(transform({url:base+'/uts/v3/'+path},'SG'),null);
  for (const host of ['idmsa.apple.com','account.apple.com','buy.itunes.apple.com','play.itunes.apple.com','uts-api.itunes.apple.com.evil.test']) assert.equal(transform({url:'https://'+host+'/uts/v3/shows/x'},'SG'),null);
  assert.equal(transform({...input,method:'POST'},'SG'),null);
});
test('all regions and idempotence', () => {
  for (const region of ['SG','TW','HK','MO']) {
    const once = transform(input,region);
    assert.deepEqual(transform(once,region),once);
  }
  assert.equal(transform(input,'XX'),null);
});
test('Shadowrocket and QuanX runtime call done once', () => {
  const code = fs.readFileSync(__dirname+'/apple-tv-zh.js','utf8');
  for (const arg of ['', 'region=TW']) {
    let count=0, result;
    vm.runInNewContext(code,{$request:input,$argument:arg,$done:r=>{count++;result=r;},console:{log(){}}});
    assert.equal(count,1);
    assert.equal(new URL(result.url).searchParams.get('sf'),arg?'143470':'143464');
  }
});
console.log(checks+' test groups passed');

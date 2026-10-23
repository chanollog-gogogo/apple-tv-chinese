// Public, anonymous API probes: no account headers, cookies, or device tokens.
const { execFileSync } = require('node:child_process');
const { transform } = require('./apple-tv-zh.js');
const base = 'https://uts-api.itunes.apple.com/uts/v3/';
for (const path of ['shows/umc.cmc.vtoh0mn0xn7t3c643xqonfzy','canvases/Channels/tvs.sbd.4000','canvases/Roots/tahoma_watchnow']) {
  const original = base+path+'?caller=js&sf=143441&locale=en-US&pfm=desktop&v=100&utsk=0';
  for (const [mode,url] of [['US',original],['SG',transform({url:original},'SG').url]]) {
    try {
      const body = JSON.parse(execFileSync('curl',['--compressed','-fLs','--max-time','20',url],{maxBuffer:12*1024*1024,encoding:'utf8'}));
      const content = body.data?.content;
      const shelves = body.data?.canvas?.shelves || [];
      console.log(JSON.stringify({path,mode,title:content?.title,description:content?.description?.slice(0,120),shelves:shelves.slice(0,8).map(x=>x.header?.title).filter(Boolean)}));
    } catch (error) { console.log(JSON.stringify({path,mode,error:'probe failed'})); }
  }
}

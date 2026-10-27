/* Apple TV display localization engine, 0.3.0-dev.4.
 * Original US requests/catalog/rights/playback stay authoritative.
 * Anonymous regional Apple metadata is used ONLY as a display-field source.
 * No account headers, original query tokens, or response bodies are forwarded.
 * Development build: not a claim of complete device/catalog coverage.
 */
(function () {
  'use strict';
  var VERSION = '0.3.0-dev.4';
  var BODY_LIMIT = 768 * 1024;
  var HELPER_LIMIT = 768 * 1024;
  var REQUEST_LIMIT = 3;
  var TEXT = ['title','shortTitle','subtitle','description','summary','heroDescription','seoDescription','seoTitle','showTitle','episodeTitle','movieTitle','localizedType','name','displayName','label','buttonText','text','badge','eyebrow'];
  var BLOCK = /^(assets|offers|personalizedOffers|upsellOffers|itunesMediaApiData|rating|contentAdvisoryDetails|fpsKeyServerQueryParameters|userProps|contentPersonalizedInfo|episodesContentPersonalizedInfo|entitlements|purchase|purchases|license|licenses|headers|cookies)$/;
  var UI = {
    'Home':'主页','Watch Now':'立即观看','Continue Watching':'继续观看','Up Next':'待播清单',
    'Search':'搜索','Store':'商店','Library':'资料库','Movies':'电影','TV Shows':'电视节目',
    'TV Show':'电视节目','Movie':'电影','Episode':'单集','Season':'季','Seasons':'季',
    'Originals':'原创内容','Sports':'体育','Kids':'儿童','Kids & Family':'儿童与家庭',
    'Trailers':'预告片','Trailer':'预告片','Bonus Content':'花絮','Related':'相关内容',
    'Cast & Crew':'演职员表','About':'关于','Information':'信息','How to Watch':'观看方式',
    'Languages':'语言','Accessibility':'辅助功能','Audio':'音频','Subtitles':'字幕',
    'Play':'播放','Resume':'继续播放','Watch':'观看','Watch Now':'立即观看','More':'更多',
    'Details':'详情','See All':'查看全部','Browse':'浏览','Recently Added':'最近添加','Top Results':'最佳结果','Recent Searches':'最近搜索',
    'Downloads':'下载','Downloaded':'已下载','Download':'下载','Remove Download':'移除下载',
    'Add to Watchlist':'加入待播清单','Remove from Watchlist':'从待播清单移除',
    'Add to Up Next':'加入待播清单','Remove from Up Next':'从待播清单移除',
    'Mark as Watched':'标记为已观看','Mark as Unwatched':'标记为未观看',
    'Share':'共享','Go to Show':'前往节目','Go to Episode':'前往单集',
    'New Releases on Apple TV':'Apple TV 新上架','Great Movies Now on Apple TV':'Apple TV 精彩电影',
    'Top 10 TV Shows on Apple TV':'Apple TV 十大热门剧集','Top 10 Movies on Apple TV':'Apple TV 十大热门电影',
    'Must-See Hits on Apple TV':'Apple TV 必看热门作品','Free for Everyone':'所有人均可免费观看',
    'All Episodes Now Available':'全部单集现已上线','New Episode Every Friday':'每周五更新',
    'New Season':'新一季','New Episode':'新单集','New Episodes':'新单集','Season Premiere':'新季首播','Series Premiere':'剧集首播',
    'Season Finale':'本季大结局','Series Finale':'全剧大结局',
    'Six Degrees of Ted Lasso':'与《泰德拉索》相关的六度人脉',
    'United States Grand Prix':'美国大奖赛','Comedy':'喜剧','Drama':'剧情','Thriller':'惊悚',
    'Sci-Fi':'科幻','Science Fiction':'科幻','Adventure':'冒险','Action':'动作','Mystery':'悬疑',
    'Documentary':'纪录片','Animation':'动画','Romance':'爱情','Horror':'恐怖','Family':'家庭',
    'Reality':'真人秀','Fantasy':'奇幻','Crime':'犯罪','Biography':'传记','War':'战争',
    'History':'历史','Music':'音乐','Musical':'歌舞','Western':'西部','Short Films':'短片',
    'English':'英语','Chinese':'中文','Chinese (Simplified)':'简体中文','Chinese (Traditional)':'繁体中文'
  };
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function han(x) { return typeof x === 'string' && /[\u3400-\u9fff]/.test(x); }
  function normalize(x) { return String(x || '').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim(); }
  function ui(x) {
    var n = normalize(x);
    if (UI[n]) return UI[n];
    var days={Monday:'一',Tuesday:'二',Wednesday:'三',Thursday:'四',Friday:'五',Saturday:'六',Sunday:'日'};
    var day=/^New Episodes? Every (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.exec(n);
    if(day)return '每周'+days[day[1]]+'更新';
    var date=/^(New Season|Season Premiere|Series Premiere|Premieres) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{1,2})$/.exec(n);
    if(date)return ({'New Season':'新一季','Season Premiere':'新季','Series Premiere':'剧集','Premieres':'首播'}[date[1]])+'于'+({Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12}[date[2]])+'月'+date[3]+'日上线';
    var sport=/^United States: (Practice\s*([123])|Qualifying|Race|Sprint|Sprint Qualifying)$/.exec(n);
    if(sport)return '美国站：'+(sport[2]?'第'+sport[2]+'次练习赛':{'Qualifying':'排位赛','Race':'正赛','Sprint':'冲刺赛','Sprint Qualifying':'冲刺赛排位赛'}[sport[1]]);
    var m = /^Season\s+(\d+)$/i.exec(n);
    if (m) return '第' + m[1] + '季';
    m = /^Episode\s+(\d+)$/i.exec(n);
    if (m) return '第' + m[1] + '集';
    m = /^S(\d+),?\s*E(\d+)\s*[·:]?\s*/.exec(n);
    if (m && m[0] === n) return '第' + m[1] + '季 第' + m[2] + '集';
    return null;
  }
  function identity(o) {
    if (!o || typeof o !== 'object' || typeof o.id !== 'string') return null;
    // Region suffixes differ for the same provider asset. Only the stable asset
    // identity is used; no asset IDs, URLs or playback data are copied.
    return /^tvs\.sbd\.\d+:[^:]+:[a-f0-9]{8}$/i.test(o.id) ? o.id.replace(/:[a-f0-9]{8}$/i,'') : o.id;
  }
  function image(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    if (!/^https:\/\/is\d+(?:-ssl)?\.mzstatic\.com\/image\//.test(o.url || '')) return null;
    var r = {};
    ['url','width','height','isP3','joeColor','supportsLayeredImage'].forEach(function(k){
      if (['string','number','boolean'].indexOf(typeof o[k]) >= 0) r[k] = o[k];
    });
    return r;
  }
  function descriptor(o) {
    var r = { fields:{}, images:{}, header:{}, canonical:{} };
    TEXT.forEach(function(k){if (han(o[k])) r.fields[k] = o[k];});
    if (o.images && typeof o.images === 'object') Object.keys(o.images).forEach(function(k){
      var v=image(o.images[k]);if(v)r.images[k]=v;
    });
    if (o.header && typeof o.header === 'object') TEXT.forEach(function(k){if(han(o.header[k]))r.header[k]=o.header[k];});
    if (o.canonicalMetadata && typeof o.canonicalMetadata === 'object')
      ['showTitle','episodeTitle','movieTitle','shortTitle','genre'].forEach(function(k){if(han(o.canonicalMetadata[k]))r.canonical[k]=o.canonicalMetadata[k];});
    return r;
  }
  function walk(o, fn, p) {
    if (!o || typeof o !== 'object') return;
    if (!Array.isArray(o)) fn(o,p || '$');
    Object.keys(o).forEach(function(k){
      if (!BLOCK.test(k)) walk(o[k],fn,(p || '$')+'.'+k);
    });
  }
  function index(body) {
    var out={};walk(body,function(o){var id=identity(o);if(id){
      var d=descriptor(o),old=out[id];
      if(!old)out[id]=d;
      else ['fields','images','header','canonical'].forEach(function(k){Object.assign(old[k],d[k]);});
    }});return out;
  }
  function mergeIndex(a,b,overwrite) {
    Object.keys(b || {}).forEach(function(id){
      if(!a[id])a[id]={fields:{},images:{},header:{},canonical:{}};
      ['fields','images','header','canonical'].forEach(function(k){Object.keys(b[id][k] || {}).forEach(function(f){
        if(overwrite || a[id][k][f] === undefined)a[id][k][f]=b[id][k][f];
      });});
    });return a;
  }
  function parseRequest(req,res) {
    if(!req || !res || typeof res.body!=='string' || res.body.length>BODY_LIMIT)return null;
    if(req.method && req.method!=='GET')return null;
    var m=/^https:\/\/uts-api\.itunes\.apple\.com(\/uts\/v[23]\/(?:canvases|shelves|brands|channels|movies|shows|episodes|seasons|search)(?:\/[^?#]*)?)(?:\?([^#]*))?$/.exec(req.url || '');
    if(!m || /(?:^|&)atv_zh_helper=1(?:&|$)/.test(m[2] || ''))return null;
    if(!/^(?:HTTP\/\S+\s+)?200(?:\s|$)/.test(String(res.statusCode || res.status || 200)))return null;
    var q={};(m[2] || '').split('&').forEach(function(p){var at=p.indexOf('=');if(at>=0){try{q[decodeURIComponent(p.slice(0,at))]=decodeURIComponent(p.slice(at+1));}catch(_){}}});
    if(q.sf && q.sf.split('-')[0]!=='143441')return null;
    var body;try{body=JSON.parse(res.body);}catch(_){return null;}
    return body && body.data && !body.error ? {path:m[1],query:q,body:body} : null;
  }
  function entities(body) {
    var out={};walk(body,function(o){
      if(/^umc\.cmc\.[a-z0-9]+$/.test(o.id || '') && /^(Show|Movie|Episode|Season)$/.test(o.type || ''))
        out[o.id]={id:o.id,type:o.type};
    });return Object.keys(out).map(function(k){return out[k];});
  }
  function helper(path,region) {
    if(!/^\/uts\/v[23]\/(?:configurations|canvases|shelves|brands|channels|movies|shows|episodes|seasons)(?:\/[^?#]*)?$/.test(path))return null;
    if(/(?:UpNext|Personalized|user|watchlist)/i.test(path))return null;
    var sf=region==='TW'?'143470':region==='HK'?'143463':'143464',lang=region==='SG'?'zh-Hans':'zh-Hant';
    return {url:'https://uts-api.itunes.apple.com'+path+'?caller=js&v=100&sf='+sf+'&locale='+lang+'&pfm=desktop&utsk=0&atv_zh_helper=1',
      headers:{Accept:'application/json','Accept-Language':lang,'X-Apple-I-Locale':lang},timeout:5};
  }
  function regionalMap(sources,cached) {
    var map=mergeIndex({},cached || {},true);
    // TW provides localized artwork/names; SG provides simplified descriptions.
    mergeIndex(map,index(sources.TW || {}),true);
    var sg=index(sources.SG || {});
    mergeIndex(map,sg,false);
    Object.keys(sg).forEach(function(id){['description','heroDescription','seoDescription','localizedType'].forEach(function(k){
      if(sg[id].fields[k])map[id].fields[k]=sg[id].fields[k];
    });Object.assign(map[id].header,sg[id].header);});
    var hk=index(sources.HK || {});mergeIndex(map,hk,false);
    // Hong Kong often has localized title artwork when TW/SG keep English art.
    Object.keys(hk).forEach(function(id){if(hk[id].fields.title)Object.assign(map[id].images,hk[id].images);});
    return map;
  }
  function applyDisplay(plan,map) {
    var stats={objects:0,text:0,images:0,ui:0,missing:[]};
    // Leave bootstrap locale maps and storefront capabilities entirely alone.
    // Localization here is limited to returned display fields.
    walk(plan.body,function(o){
      var id=identity(o),d=map[id];
      if(d){
        Object.keys(d.fields).forEach(function(k){if(typeof o[k]==='string' && o[k]!==d.fields[k]){o[k]=d.fields[k];stats.text++;}});
        if(o.images && typeof o.images==='object')Object.keys(d.images).forEach(function(k){
          if(image(o.images[k])){o.images[k]=clone(d.images[k]);stats.images++;}
        });
        if(o.header)Object.keys(d.header).forEach(function(k){if(typeof o.header[k]==='string'){o.header[k]=d.header[k];stats.text++;}});
        if(o.canonicalMetadata)Object.keys(d.canonical).forEach(function(k){if(typeof o.canonicalMetadata[k]==='string'){o.canonicalMetadata[k]=d.canonical[k];stats.text++;}});
        stats.objects++;
      }
      TEXT.concat(['genre']).forEach(function(k){if(typeof o[k]==='string'){var t=ui(o[k]);if(t && t!==o[k]){o[k]=t;stats.ui++;}}});
    });
    entities(plan.body).forEach(function(e){if(!map[e.id] || !map[e.id].fields.title)stats.missing.push(e);});
    return stats;
  }
  function localize(req,res,sources,cached) {
    var plan=parseRequest(req,res);if(!plan)return null;
    var map=regionalMap(sources || {},cached);
    var stats=applyDisplay(plan,map);
    return {body:JSON.stringify(plan.body),index:map,stats:stats};
  }
  var api={version:VERSION,parseRequest:parseRequest,index:index,mergeIndex:mergeIndex,localize:localize,entities:entities,helper:helper,identity:identity,descriptor:descriptor};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  if(typeof $done==='function' && typeof $response==='undefined'){$done({});return;}
  if(typeof $done!=='function' || typeof $request==='undefined' || typeof $response==='undefined')return;
  var localOnly=typeof $argument==='string' && /(?:^|[&,])mode=local(?:$|[&,])/.test($argument);
  var mode=localOnly?'local':'regional';
  // Diagnostic logs contain counts and a route category only, never IDs or URLs.
  var route=/\/uts\/v[123]\/([a-z-]+)/.exec($request.url || '');
  var routeName=route?route[1]:'other';
  function trace(stage,extra){console.log('[AppleTV-ZH '+VERSION+'] stage='+stage+' mode='+mode+' route='+routeName+(extra?' '+extra:''));}
  var isUTS=/^https:\/\/uts-api\.itunes\.apple\.com\/uts\/v[123]\//.test($request.url || '');
  var isHelper=/(?:[?&])atv_zh_helper=1(?:&|$)/.test($request.url || '');
  if(!isUTS || isHelper || ($request.method && $request.method!=='GET')){$done({});return;}
  var responseCode=String($response.statusCode || $response.status || 200);
  if(!/^(?:HTTP\/\S+\s+)?200(?:\s|$)/.test(responseCode)){$done({});return;}
  if(typeof $response.body!=='string' || $response.body.length>BODY_LIMIT){$done({});return;}
  // Do not change application bootstrap configuration or account responses.
  // The original subtitle handler owns those paths outside this module regex.
  if(/\/uts\/v[123]\/(?:configurations|user)(?:[/?]|$)/.test($request.url || '')){$done({});return;}
  trace('start','chars='+$response.body.length);
  var plan=parseRequest($request,$response);
  trace('parsed','display='+(plan?1:0));
  // Unsupported UTS paths need no work unless the subtitle adapter has an HLS
  // field to process. In particular, do not start a runtime for account settings.
  if(!plan && !/"hlsUrl"\s*:/.test($response.body)){$done({});return;}
  if(localOnly){
    try{
      var localBody=plan?plan.body:JSON.parse($response.body);
      var localStats=plan?applyDisplay(plan,{}):{text:0,ui:0,images:0};
      var localSubs=typeof AppleTVSubtitleCompat!=='undefined' && typeof AppleTVSubtitleTables!=='undefined'?AppleTVSubtitleCompat.apply(localBody,AppleTVSubtitleTables):0;
      var localChanged=localStats.text+localStats.ui+localStats.images+localSubs;
      trace('done','ui='+localStats.ui+' subtitle='+localSubs+' fetch=0');
      $done(localChanged?{body:JSON.stringify(localBody)}:{});
    }catch(_){trace('retained');$done({});}
    return;
  }
  // tvOS terminates a process that writes an oversized defaults database.
  // Old versions wrote display caches through the shared script preferences.
  // This build never reads or writes script preferences, even on failures.
  var start=Date.now(),deadline=start+10000,requests=0,failed=0,completed=false;
  var watchdog=typeof setTimeout==='function'?setTimeout(function(){complete({});},12000):null;
  function complete(value){
    if(completed)return;
    completed=true;
    if(watchdog!==null && typeof clearTimeout==='function')clearTimeout(watchdog);
    $done(value);
  }
  function subtitleTables(){
    return Promise.resolve(typeof AppleTVSubtitleTables!=='undefined' ? AppleTVSubtitleTables : null);
  }
  function fetchIndex(spec){return new Promise(function(resolve){
    if(!spec || completed || requests>=REQUEST_LIMIT || Date.now()>deadline){resolve(null);return;}
    requests++;trace('fetch','n='+requests);var settled=false,timer=typeof setTimeout==='function'?setTimeout(function(){failed++;finish(null);},5500):null;
    function finish(body){if(settled)return;settled=true;if(timer!==null&&typeof clearTimeout==='function')clearTimeout(timer);resolve(body);}
    function parse(status,text){
      if(settled || completed)return;
      if(Number(status)!==200 || typeof text!=='string' || text.length>HELPER_LIMIT){failed++;finish(null);return;}
      try{trace('helper-body','chars='+text.length);var d=JSON.parse(text);finish(d && d.data && !d.error?index(d):null);}catch(_){failed++;finish(null);}
    }
    if(typeof $task!=='undefined' && $task.fetch)$task.fetch({url:spec.url,method:'GET',headers:spec.headers,timeout:5}).then(function(r){parse(r.statusCode,r.body);},function(){failed++;finish(null);});
    else if(typeof $httpClient!=='undefined')$httpClient.get(spec,function(e,r,b){if(e){failed++;finish(null);}else parse(Number(r.status || r.statusCode),b);});
    else finish(null);
  });}
  (async function(){
    var tablesPromise=subtitleTables();
    if(!plan){
      var passthrough;try{passthrough=JSON.parse($response.body);}catch(_){complete({});return;}
      var tablesOnly=await tablesPromise,n=typeof AppleTVSubtitleCompat!=='undefined'?AppleTVSubtitleCompat.apply(passthrough,tablesOnly):0;
      if(!completed)complete(n?{body:JSON.stringify(passthrough)}:{});return;
    }
    // A detail page can launch several response scripts at once on tvOS. Keep
    // only compact metadata, and run at most three serial helper requests.
    // Avoid three full regional trees and repeated original-body parse/stringify.
    var lookups={TW:{},SG:{},HK:{}},regions=['TW','SG','HK'];
    for(var ri=0;ri<regions.length;ri++){
      var region=regions[ri],pageIndex=await fetchIndex(helper(plan.path,region));
      if(pageIndex)mergeIndex(lookups[region],pageIndex,true);
    }
    var records={};
    if(completed)return;
    // Deterministic preference, independent of concurrent network completion.
    mergeIndex(records,lookups.TW,true);mergeIndex(records,lookups.SG,false);
    Object.keys(lookups.SG).forEach(function(id){var d=lookups.SG[id];
      ['description','heroDescription','seoDescription','localizedType'].forEach(function(k){if(d.fields[k])records[id].fields[k]=d.fields[k];});
      Object.assign(records[id].header,d.header);
    });
    mergeIndex(records,lookups.HK,false);
    Object.keys(lookups.HK).forEach(function(id){if(lookups.HK[id].fields.title)Object.assign(records[id].images,lookups.HK[id].images);});
    trace('apply');
    var stats=applyDisplay(plan,records);
    lookups=null;
    var tables=await tablesPromise;
    if(completed)return;
    var subtitleChanges=typeof AppleTVSubtitleCompat!=='undefined'?AppleTVSubtitleCompat.apply(plan.body,tables):0;
    // Counts only: no URLs, search terms, account identifiers or tokens in logs.
    console.log('[AppleTV-ZH '+VERSION+'] text='+stats.text+' ui='+stats.ui+' images='+stats.images+' missing='+stats.missing.length+' subtitle='+subtitleChanges+' mapping='+(tables?'ok':'unavailable')+' fetch='+requests+' failed='+failed+' ms='+(Date.now()-start));
    trace('serialize');
    var output=JSON.stringify(plan.body);
    trace('done','chars='+output.length+' fetch='+requests);
    complete({body:output});
  })().catch(function(){console.log('[AppleTV-ZH '+VERSION+'] original response retained');complete({});});
})();

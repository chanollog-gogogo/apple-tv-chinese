/* Independently implemented adapter for the user's installed subtitle mappings.
 * Reads only JSON constants from the exact pinned upstream configuration.
 * Never evaluates downloaded JavaScript. Other subtitle rules remain upstream.
 */
var AppleTVSubtitleCompat = (function(){
  'use strict';
  var revision='cfa478aa18dba4c3f2054f4c0959f6c9f3f2bbee';
  var source='https://raw.githubusercontent.com/rexchen1803/apple-video-subtitles/'+revision+'/payloads/shadowrocket/series/2019-formula-1-drive-to-survive/season-08/uts-redirect.js';
  function parse(text){
    if(typeof text!=='string'||text.length>150000)throw Error('Invalid mapping input');
    var out={revision:revision};
    ['f1Replays','seriesTargets','seriesRevision','shelfTargets','shelfRevisions'].forEach(function(name){
      var m=new RegExp('^const '+name+' = (.+);$','m').exec(text);
      if(!m)throw Error('Missing mapping constant');
      out[name]=JSON.parse(m[1]);
    });
    if(!Array.isArray(out.f1Replays)||out.f1Replays.length>100||typeof out.seriesRevision!=='string')throw Error('Invalid mapping shape');
    if(!out.shelfTargets['6812093448']||!out.shelfRevisions['6812093448'])throw Error('Unexpected installed version');
    Object.keys(out.shelfTargets).forEach(function(id){if(!/^\d+$/.test(id)||!/^[a-z0-9-]+$/.test(out.shelfTargets[id])||!/^[a-zA-Z0-9-]+$/.test(out.shelfRevisions[id]))throw Error('Unsafe movie mapping');});
    Object.keys(out.seriesTargets).forEach(function(id){var t=out.seriesTargets[id];if(!/^\d+$/.test(id)||!/^[a-z0-9-]+$/.test(t.slug)||!/^\d+$/.test(t.programId))throw Error('Unsafe episode mapping');});
    out.f1Replays.forEach(function(t){if(!/^[a-z0-9-]+$/.test(t.slug)||!/^\d+$/.test(t.programId)||!/^\d+$/.test(t.assetId)||!/^[a-zA-Z0-9-]+$/.test(t.revision))throw Error('Unsafe replay mapping');});
    return out;
  }
  function field(url,key){var q=(url.split('?')[1]||'').split('#')[0].split('&');for(var i=0;i<q.length;i++){var p=q[i].split('=');try{if(decodeURIComponent(p[0])===key)return decodeURIComponent(p.slice(1).join('='));}catch(_){}}return '';}
  function hls(url,t){
    if(typeof url!=='string')return url;
    var native=url.replace(/^https:\/\/play-edge-cdn\.itunes\.apple\.com/i,'https://play-edge.itunes.apple.com').replace(/^https:\/\/play-cdn\.itunes\.apple\.com/i,'https://play.itunes.apple.com');
    if(/^https:\/\/play(?:-edge)?\.itunes\.apple\.com\/WebObjects\/MZPlayLocal\.woa\/hls\/subscription\/playlist\.m3u8(?:\?[^#]*)?$/i.test(native)){
      var a=field(native,'a')||field(native,'mainAssetAdamId'),id=field(native,'id'),path=null,rev=null;
      if(t.shelfTargets[a]){path='__apple_movie_master/'+t.shelfTargets[a];rev=t.shelfRevisions[a];}
      else if(a==='6796433608'){path='__apple_movie_master/2001-a-beautiful-mind';rev='v260925a';}
      else if(t.seriesTargets[a]&&t.seriesTargets[a].programId===id){path='__apple_series_master/'+t.seriesTargets[a].slug;rev=t.seriesRevision;}
      else for(var i=0;i<t.f1Replays.length;i++){var f=t.f1Replays[i];if(f.assetId===a&&f.programId===id){path='__f1_replay_master/'+f.slug;rev=f.revision;break;}}
      if(path)return 'https://hls-amt.itunes.apple.com/'+path+'/index.m3u8?rev='+rev+'&src='+encodeURIComponent(native);
    }
    return url.replace(/^(https?:\/\/)play-edge\.itunes\.apple\.com(?=[/?#]|$)/i,'$1play-edge-cdn.itunes.apple.com').replace(/^(https?:\/\/)play\.itunes\.apple\.com(?=[/?#]|$)/i,'$1play-cdn.itunes.apple.com');
  }
  function apply(body,t){
    if(!t||t.revision!==revision)return 0;
    var n=0;function visit(o){if(!o||typeof o!=='object')return;Object.keys(o).forEach(function(k){if(k==='hlsUrl'){var s=hls(o[k],t);if(s!==o[k]){o[k]=s;n++;}}else visit(o[k]);});}visit(body);return n;
  }
  return {source:source,revision:revision,parse:parse,hls:hls,apply:apply};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AppleTVSubtitleCompat;

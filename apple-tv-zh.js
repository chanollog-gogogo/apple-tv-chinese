/* Apple TV Chinese display requests, v0.1.0 (experimental).
 * Independently implemented from the region/locale approach documented by
 * NSRingo/TV (https://github.com/NSRingo/TV, Apache-2.0).
 * No response handling, account requests, playback URL rewriting, or telemetry.
 */
(function () {
  'use strict';
  var REGIONS = {
    SG: { sf: '143464', locale: 'zh-Hans', header: 'zh-Hans_SG' },
    TW: { sf: '143470', locale: 'zh-Hant', header: 'zh-Hant_TW' },
    HK: { sf: '143463', locale: 'zh-Hant', header: 'zh-Hant_HK' },
    MO: { sf: '143515', locale: 'zh-Hant', header: 'zh-Hant_MO' }
  };
  function transform(request, region) {
    var match = /^https:\/\/uts-api\.itunes\.apple\.com(\/uts\/v[123]\/[^?#]*)(\?[^#]*)?$/.exec(request.url || '');
    if (!match || !REGIONS[region]) return null;
    if (request.method && !/^(GET|HEAD)$/i.test(request.method)) return null;
    var path = match[1];
    // Allow only display routes. Never intercept user/settings, watchlist,
    // favorites, purchases, playables, licensing, HLS, or account services.
    if (!/^\/uts\/v[123]\/(?:configurations\/?|canvases\/.+|shelves\/.+|brands(?:\/.+)?|channels\/?|movies\/[^/]+\/?|shows\/[^/]+(?:\/episodes)?\/?|episodes\/[^/]+\/?|search(?:\/(?:landing|incremental))?\/?)$/.test(path)) return null;
    var cfg = REGIONS[region];
    var pairs = (match[2] || '?').slice(1).split('&').filter(Boolean);
    function put(name, value) {
      pairs = pairs.filter(function (pair) { return pair.split('=')[0] !== name; });
      pairs.push(name + '=' + encodeURIComponent(value));
    }
    put('locale', cfg.locale);
    put('sf', cfg.sf);
    if (/\/configurations\/?$/.test(path)) {
      ['region', 'country'].forEach(function (key) {
        if (pairs.some(function (pair) { return pair.split('=')[0] === key; })) put(key, region);
      });
      pairs = pairs.map(function (pair) {
        return pair.indexOf('sfh=') === 0 ? pair.replace(/\d{6}/, cfg.sf) : pair;
      });
    }
    var headers = Object.assign({}, request.headers || {});
    Object.keys(headers).forEach(function (key) {
      var lower = key.toLowerCase();
      if (lower === 'x-apple-store-front') headers[key] = String(headers[key]).replace(/\d{6}/, cfg.sf);
      if (lower === 'x-apple-i-locale') headers[key] = cfg.header;
      if (lower === 'accept-language') headers[key] = cfg.locale + ',zh;q=0.9,en;q=0.5';
    });
    return { url: 'https://uts-api.itunes.apple.com' + path + '?' + pairs.join('&'), headers: headers };
  }
  // The same standalone file runs in Shadowrocket and Quantumult X.
  if (typeof module !== 'undefined' && module.exports) module.exports = { transform: transform, regions: REGIONS };
  if (typeof $request !== 'undefined' && typeof $done === 'function') {
    var result = {};
    try {
      var arg = typeof $argument === 'string' ? $argument : '';
      var selected = /(?:^|&)region=(SG|TW|HK|MO)(?:&|$)/i.exec(arg);
      var region = selected ? selected[1].toUpperCase() : 'SG';
      var changed = transform($request, region);
      if (changed) {
        result = changed;
        // No query strings, headers, account identifiers, or tokens in logs.
        console.log('[AppleTV-ZH 0.1.0] display -> ' + region + ' / ' + REGIONS[region].locale);
      }
    } catch (error) {
      console.log('[AppleTV-ZH 0.1.0] skipped; original request retained');
    }
    $done(result);
  }
})();

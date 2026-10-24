/* Silo display-only proof, 0.2.0-preview. NOT a catalog/region switch.
 * Static public Apple metadata, fetched anonymously 2026-10-24.
 * No network requests, account headers, credentials, playback rewrites or telemetry.
 */
(function () {
  'use strict';
  var DISPLAY = {
  "id": "umc.cmc.3yksgc857px0k0rqe5zd4jice",
  "title": "末日地堡",
  "description": "在一个满目疮痍、有毒物质遍布的未来世界中，成千上万的人居住在深埋在地下的巨大筒仓里。警长违反了一条基本规则，有些居民神秘死亡后，工程师朱丽叶（丽贝卡佛格森饰）开始揭开惊人的秘密和筒仓的真相。",
  "images": {
    "contentImage16X9": {
      "height": 2160,
      "isP3": false,
      "joeColor": "b:rgb(17,27,37) p:rgb(191,214,149) s:rgb(129,198,141) t:rgb(156,177,127) q:rgb(106,164,120)",
      "supportsLayeredImage": false,
      "url": "https://is1-ssl.mzstatic.com/image/thumb/nJwI7C7Mgb_ixAzboIcYLQ/{w}x{h}.{f}",
      "width": 3840
    },
    "contentLogo": {
      "height": 546,
      "isP3": false,
      "joeColor": "b:rgb(255,255,255) p:rgb(12,12,12) s:rgb(25,25,25) t:rgb(61,61,61) q:rgb(71,71,71)",
      "supportsLayeredImage": false,
      "url": "https://is1-ssl.mzstatic.com/image/thumb/RsGlludPi0sLpkEtkBuypg/{w}x{h}.{f}",
      "width": 3189
    },
    "posterArt": {
      "height": 3000,
      "isP3": false,
      "joeColor": "b:rgb(25,29,46) p:rgb(200,227,170) s:rgb(205,187,102) t:rgb(165,187,145) q:rgb(169,155,90)",
      "supportsLayeredImage": false,
      "url": "https://is1-ssl.mzstatic.com/image/thumb/V1TPsNOWpMdEV5XI50efwQ/{w}x{h}CA.TVA23C01.{f}",
      "width": 2000
    }
  }
};
  var EPISODES = {
  "umc.cmc.4v3gat04y129mm0smdu6ea3dh": {
    "title": "自由日",
    "description": "在贝克尔警长的妻子遇到一名掌握有关筒仓信息的黑客后，他对未来的计划被彻底打乱了。"
  },
  "umc.cmc.1txm8rg6r6vensxnvun57g9s0": {
    "title": "荷斯顿的选择",
    "description": "工程师朱丽叶拼凑出可能导致了一名同事离奇死亡的原因。"
  },
  "umc.cmc.4qn04sxn1o6qdazlw79gxe4bz": {
    "title": "机器",
    "description": "在物色新警长的过程中，强斯市长与伯纳德发生了冲突。朱丽叶为了让发电机继续运转而达成协议。"
  },
  "umc.cmc.4ins4pefrjghalocg6k5ipll": {
    "title": "真相",
    "description": "朱丽叶努力争取到马恩斯警官的信任，他们共同寻找最近几起悲剧的真相。"
  },
  "umc.cmc.4zbndvtns69z1b8r4w99m6j3i": {
    "title": "清洁工的男孩",
    "description": "西姆斯任命比林斯为副警长，以便监视朱丽叶。朱丽叶试图破解两起谋杀案的努力导致了一场决战。"
  },
  "umc.cmc.7dsfdof0flp499zgvxc7jis3z": {
    "title": "历史遗物",
    "description": "在调查过程中，朱丽叶发现了一个令人不安的秘密，有关自己原以为了解的一个人。"
  },
  "umc.cmc.6ta3tndgffvigo7yd078eyy58": {
    "title": "进入火焰",
    "description": "本季大结局。朱丽叶和叛乱者们开始行动。"
  }
};
  var IMAGE_KEYS = ['contentImage16X9', 'contentLogo', 'posterArt'];
  function decorateEpisode(content) {
    if (!content || content.showId !== DISPLAY.id || !EPISODES[content.id]) return false;
    var text = EPISODES[content.id];
    if (typeof content.title === 'string') content.title = text.title;
    if (typeof content.description === 'string') content.description = text.description;
    if (typeof content.showTitle === 'string') content.showTitle = DISPLAY.title;
    return true;
  }
  function rewrite(request, response) {
    if (!request || !response || typeof response.body !== 'string') return null;
    if (request.method && request.method !== 'GET') return null;
    var match = /^https:\/\/uts-api\.itunes\.apple\.com\/uts\/v3\/(shows\/umc\.cmc\.3yksgc857px0k0rqe5zd4jice(?:\/episodes)?|episodes\/umc\.cmc\.[a-z0-9]+)\/?(?:\?([^#]*))?$/.exec(request.url || '');
    if (!match) return null;
    var query = match[2] || '';
    var episodeId = match[1].indexOf('episodes/') === 0 ? match[1].slice(9) : null;
    if (episodeId && !EPISODES[episodeId]) return null;
    // Only the US result can be decorated; never mask a region mismatch.
    if (!/(?:^|&)sf=143441(?:&|$)/.test(query)) return null;
    var status = String(response.statusCode || response.status || '200');
    if (!/^(?:HTTP\/\S+\s+)?200(?:\s|$)/.test(status)) return null;
    var body;
    try { body = JSON.parse(response.body); } catch (_) { return null; }
    if (!body || body.error || !body.data) return null;
    if (/\/episodes$/.test(match[1])) {
      if (!Array.isArray(body.data.episodes)) return null;
      var changed = false;
      body.data.episodes.forEach(function (item) { if (decorateEpisode(item)) changed = true; });
      return changed ? JSON.stringify(body) : null;
    }
    if (episodeId) {
      if (!body.data.content || body.data.content.id !== episodeId || !decorateEpisode(body.data.content)) return null;
      return JSON.stringify(body);
    }
    if (!body.data.content) return null;
    var content = body.data.content;
    if (content.id !== DISPLAY.id ||
        typeof content.title !== 'string' ||
        typeof content.description !== 'string') return null;
    content.title = DISPLAY.title;
    content.description = DISPLAY.description;
    decorateEpisode(body.data.smartEpisode);
    if (content.images && typeof content.images === 'object' && !Array.isArray(content.images)) {
      IMAGE_KEYS.forEach(function (key) {
        if (content.images[key] && DISPLAY.images[key]) {
          content.images[key] = JSON.parse(JSON.stringify(DISPLAY.images[key]));
        }
      });
    }
    return JSON.stringify(body);
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { rewrite: rewrite, display: DISPLAY, imageKeys: IMAGE_KEYS, episodes: EPISODES };
  }
  // Legacy 0.1 request rules may remain cached: complete without changing requests.
  if (typeof $done === 'function' && typeof $response === 'undefined') {
    $done({});
    return;
  }
  if (typeof $request !== 'undefined' && typeof $response !== 'undefined' && typeof $done === 'function') {
    var result = {};
    try {
      var rewritten = rewrite($request, $response);
      if (rewritten !== null) {
        result.body = rewritten;
        console.log('[AppleTV-ZH 0.2.0-preview] Silo display fields only');
      }
    } catch (_) {
      // The original response is retained on any error.
    }
    $done(result);
  }
})();

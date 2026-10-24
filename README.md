# Apple TV 中文展示（保留美区）

**0.2.0-preview，只是《Silo／末日地堡》展示样板，不是全片库中文化。**

旧版 0.1.0 会改变内容区服，实际测试曾导致美区影片入口消失和播放失败，已撤回该实现。
请更新整个模块／重写资源，不能只更新旧脚本缓存。旧链接继续使用，但内容已换成不改请求、不切区的新版本。

## 安装链接

- 小火箭模块（macOS／tvOS）：[AppleTV-Chinese.srmodule](https://raw.githubusercontent.com/chanollog-gogogo/apple-tv-chinese/main/AppleTV-Chinese.srmodule)
- QuanX 远程重写（iOS）：[AppleTV-Chinese.snippet](https://raw.githubusercontent.com/chanollog-gogogo/apple-tv-chinese/main/AppleTV-Chinese.snippet)

**字幕兼容限制：不要与其他同样处理 `uts-api.itunes.apple.com` 的响应脚本同时启用。**
本机发现独立安装的中文展示脚本会被字幕模块抢先匹配，两个模块勾选不代表两者都会运行。
保留现有字幕功能的用户，应先继续用原字幕模块，不要为了安装本试验版关闭字幕功能。
已验证一个本机专用串联副本，但含第三方代码，未作为公开安装版本发布。

安装前备份配置，停用旧版中文界面模块及 iRingo TV 等重叠资源。
需开启客户端总开关、重写／脚本及 HTTPS 解密，使用已安装和信任的客户端证书。
本模块只追加 `uts-api.itunes.apple.com`，不需要 `*.apple.com` 或账户登录域名。
不要为刷新界面反复退出、登录 Apple 账户。

模块不是完整代理配置，不改节点、路由、Wi-Fi 场景或账户地区。
在家走直连也须保留客户端处理流量，关闭客户端总开关后脚本不会运行。
重开 Apple TV App 后从原美区片库进入 Silo 详情检查效果。

## 覆盖与边界

- 只接受美区 `sf=143441`、匹配内容 ID、GET 成功响应。
- Silo 详情：中文剧名、简介及已有的三种图片位置。
- 七个已知单集：S1 E1–E6、S2 E10 的名称、简介和剧名字段。
- 当前观看单集 smartEpisode 及已知分集列表／详情可改展示字段。
- 使用台湾公开中文名称／图片、新加坡公开简体简介（2026-10-24 静态资料）。
- 未知影片、其他单集、首页推荐／搜索列表、栏目、系统菜单均保持原样。
- Mac 顶部仍有一处 Into the Fire 英文标题，尚未覆盖全部展示字段。
- 不改变 storefront、locale、请求头、片库列表、顺序、价格、权益、播放入口、DRM、HLS、字幕地址、登录或订阅。
- 没有外部请求、翻译服务、数据上传或凭证日志；异常保留原响应。

## 验证状态

Mac 已看到中文剧名和当前分集简介，原美区链接保留；原创剧及原本可访问的美区电影能播放。
字幕串联副本的菜单保留简体中文，但未逐句验证实际字幕。
**本公开独立模块不等同于串联副本。tvOS 和 iOS 本版本尚未真机验证。**

详见 [TESTING.md](TESTING.md)。发生异常请停用本模块、重开 Apple TV，保留原证书和原字幕模块。

## 来源与许可

此版本为独立展示字段改写，不打包 iRingo 或第三方字幕脚本，不冒充官方插件。
早期参考 [NSRingo/TV](https://github.com/NSRingo/TV) 的 UTS 参数设计；该切区方案已撤回。
原创代码使用 MIT 许可，见 LICENSE。Apple 内容及图片权利归各自权利人。

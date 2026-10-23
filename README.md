# Apple TV 中文界面 / Chinese Display

实验版 **0.1.0**，用于 tvOS / macOS Shadowrocket 和 iOS Quantumult X。
单一目的：让 Apple TV App 的首页内容和影片介绍优先使用新加坡区简体中文资料。

## 安装

- 小火箭模块（tvOS、macOS）：[AppleTV-Chinese.srmodule](https://raw.githubusercontent.com/chanollog-gogogo/apple-tv-chinese/main/AppleTV-Chinese.srmodule)
- QuanX 远程重写（iOS）：[AppleTV-Chinese.snippet](https://raw.githubusercontent.com/chanollog-gogogo/apple-tv-chinese/main/AppleTV-Chinese.snippet)

模块不是完整代理配置；保留自己的节点、规则和网络场景设置。
安装前备份配置，停用原 iRingo TV 模块/重写，避免同一请求被重复改写。
需要开启客户端总开关、重写及 HTTPS 解密，并安装和信任该客户端正在使用的根证书。
仅追加 `uts-api.itunes.apple.com`，不要为此添加 `*.apple.com` 或登录域名。
同名但不同密钥的证书不通用；iPhone 安装的证书不代表 Mac/Apple TV 已信任。
tvOS 如无单独解密页面，按所用 Shadowrocket 版本的证书安装/信任流程操作。

安装后彻底退出 Apple TV App 再打开。先检查新打开的首页与一部未缓存影片的简介。
不建议首先退出 Apple 账户；账户曾反复锁定时不要反复登录来刷新缓存。
失败时查看日志是否出现 `[AppleTV-ZH 0.1.0] display -> SG / zh-Hans`。

## 实现和边界

- 精确匹配 Apple TV UTS 内容域名与展示路径，仅修改 GET/HEAD 的语言和内容区服参数。
- 默认 `SG / zh-Hans / 143464`，小火箭脚本参数可选 `region=TW`、`region=HK`、`region=MO`；不是自动回退。
- QuanX 默认 SG，不能假设支持小火箭的 argument 参数。
- 无响应脚本，无外部依赖，无数据上传，无第三方翻译服务，无账户凭证日志。
- 不改 Apple ID 国家、订阅、系统语言、节点、路由策略、HLS、DRM 或字幕 URL。
- **内容区服会变**：首页推荐、商店可见片库、价格与播放入口可能与美区不同。不代表转区购买，也不保证所有影片可播放。请勿仅据此展示价格购买。
- 系统原生菜单跟随系统语言，不由本模块翻译。英文海报、缺少中文资料的内容可能仍为英文。
- 不处理账户登录、购买、收藏、用户设置或播放鉴权接口。未知路径安全跳过。
- 已有字幕模块的响应处理不会被本模块主动替换；相同域名的组合仍须实测播放及字幕，不能仅凭勾选判断兼容。
- Apple 私有接口可能变化，不承诺永久有效或所有平台已验证。

## 测试状态

见 [TESTING.md](TESTING.md)。单元测试或公开接口通过不等于客户端已验证。
出现异常：停用本模块，退出并重新打开 Apple TV App；保留原证书和字幕模块。

## 来源

参考 [NSRingo/TV 3.4.4](https://github.com/NSRingo/TV/tree/v3.4.4) 的 UTS 地区和语言参数设计（上游 Apache-2.0）。
本仓库为独立、精简实现，不打包上游 bundle，不冒充官方 iRingo，不包含其栏目解锁、播放域名改写等逻辑。

本仓库原创代码以 MIT 许可提供，见 LICENSE。

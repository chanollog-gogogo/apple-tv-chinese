# Apple TV tvOS 界面修复：显式 JSC 分阶段候选

版本 `0.3.0-dev.3`。**尚未通过 tvOS 真机验收，不能作为稳定版使用。**

## 已确认与未确认

- 用户对照：仅保留原字幕模块时可用；启用旧界面模块后出现内容不可用及 VPN 自动断开。
- dev.2 真机测试也失败。删除 `engine=webview` 不能证明切换到了 JSC；本候选明确设置 `engine=jsc`。
- 未取得 Jetsam 或崩溃报告。内存压力、引擎或网络任务生命周期问题仍须分别验证。
- 停用故障模块后，App 可能还停留在失败状态。已验证的恢复操作是只保留字幕模块，并彻底退出、重新打开 Apple TV App。

## 电视测试顺序

旧的 dev.1、dev.2 界面模块均保持停用，**保留 rexchen1803 的 v261013a 字幕模块**。同一时间仅启用下面一个界面候选，并置于字幕模块上方。

1. [第一步：JSC 无查询诊断](https://raw.githubusercontent.com/chanollog-gogogo/apple-tv-chinese/fix-tvos-explicit-jsc/AppleTV-Chinese-TVOS-LocalCheck.srmodule)。同步运行、不读取缓存、不运行定时器、不发辅助 HTTP 请求。只验证本地界面文字替换及固定字幕地址兼容；大部分片名仍会保持英文，这不是完整中文界面交付。
2. **第一步通过后才测试** [第二步：JSC 外区资料候选](https://raw.githubusercontent.com/chanollog-gogogo/apple-tv-chinese/fix-tvos-explicit-jsc/AppleTV-Chinese-TVOS-JSC.srmodule)。每个响应最多依次读取台、新、港三个匿名公开资料响应。没有逐片回补，冷缓存部分条目可能保留原文。

两者使用同一个兼容 bundle，通过 `argument=mode=local` / `mode=regional` 区分。更换时停用前一个候选，重新连接小火箭，并彻底退出、重开 Apple TV App。

## 处理范围

仅 `uts-api.itunes.apple.com` 上的界面内容响应：canvases、shelves、brands、channels、movies、shows、episodes、seasons、search。原配置和原字幕模块继续处理 configurations、user/settings 及播放接口；本候选不改启动语言映射、账户、登录、storefront、影片列表或授权。

原字幕兼容代码只保留原 v261013a 固定映射行为，不包含完整字幕安装包，不能单独替代原字幕模块。不会引入第三方翻译服务。

## 资源与日志

- 模块引擎明确为 JSC，原字幕模块引擎保持不变。
- 主响应和辅助响应各有 768 Ki 字符的脚本内限制，模块层为 786432 字节；超出会保留原文。字符数与字节数不同。
- 外区模式每个响应最多三个查询，串行；不同响应仍可能同时运行，**不是全设备总并发保证**。
- 外区模式缓存最多 96000 字符、80 个身份项。无查询模式不使用此缓存。
- 阶段日志仅记录路由类别、数量和长度，不记录完整 URL、影片 ID、原始请求参数、授权头或账户资料。
- 本地检查不能证明 tvOS 在实际系统负载下稳定，也不能替代首页、详情页及 VPN 状态的电视验收。

## 本地验证

参见 [TESTING.md](TESTING.md)。已通过通用字段保护、资源限制、四个公开 tvOS 响应并发重放、77 个原字幕 HLS 映射，以及 macOS 原生 JavaScriptCore 的无查询模式检查。**macOS JavaScriptCore 测试不是小火箭或 tvOS 集成测试。**

## 回退

停用两个候选及全部旧界面模块，保留原字幕模块；重新连接小火箭，再彻底退出并重开 Apple TV App。不要重装小火箭、重新生成证书或退出 Apple 账户来进行本测试。

此分支中旧的 `AppleTV-Chinese-Full*.srmodule` / `*.snippet` 为历史文件，不用于本轮电视测试。正式通用分支及其他设备链接未更新。

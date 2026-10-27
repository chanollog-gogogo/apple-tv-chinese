# dev.3 分阶段验证记录

## 2026-10-27 本地结果

- `test-core.cjs`：通用 ID 展示匹配；原美区列表、权利、地址不变；启动配置不改写。
- `test-resource-budget.cjs`：外区请求每响应至多 3 次、原响应一次解析与序列化；4 个并发脚本；96k 字符缓存；账户/启动路径跳过；超大响应及迟到回调。
- `test-staged.cjs <公开样本目录>`：无查询模式 7 个用例；同步完成；HTTP、缓存、定时器访问均为 0；非展示字段与原字幕映射保护；模块层明确 JSC，排除账户/启动路径。
- `test-tvos-responses.cjs <公开样本目录>`：4 个 tvOS 内容响应并发重放，外区模式中文标题及受保护数据通过。
- `test-adapter.cjs`：77 个 HLS 用例与固定原字幕脚本一致。可通过 `SUBTITLE_UPSTREAM_FIXTURE` 指定精确公开版本。
- `test-native-jsc.swift` + `test-local-profile.js`：macOS 自带 JavaScriptCore 执行相同 7 个无查询用例通过。没有调用小火箭 API 或模拟 tvOS 的系统内存终止规则。

所有重放输入是匿名 Apple 公开响应。发布内容不包含流量日志、登录账户响应、证书、私钥、节点密码或本机网络配置。

## 未完成

- tvOS 无查询模式验收。
- tvOS 外区模式验收。
- VPN 自动断开的确切系统原因。
- 所有界面、影片与设备的完整中文覆盖。缺少中文资料时仍保留原文；无第三方翻译。

**dev.1 与 dev.2 均不能作为已修复版本继续使用。**

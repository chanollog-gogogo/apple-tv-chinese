# tvOS 存储超限修复候选 dev.4

尚未通过真机验收，不能标记稳定。

2026-10-27 经 Xcode 读取的三份 TVPacketTunnel 崩溃报告（10月26日23:38、10月27日19:23两份）均显示：SIGABRT，脚本队列经 NSUserDefaults.setObject 调用，触发 `__CFPREFERENCES_HAS_DETECTED_THIS_APP_TRYING_TO_STORE_TOO_MUCH_DATA__`。未公开原始报告或设备资料。

Apple 文档说明 tvOS defaults 数据库达到512KB会警告，达到1MB且继续写入时会终止进程：https://developer.apple.com/documentation/foundation/userdefaults/sizelimitexceedednotification

本候选完整 bundle 不使用 `$prefs` / `$persistentStore`。不读取或写入中文资料缓存，也不写字幕映射缓存；字幕固定映射嵌入包内。旧数据不删除，不更改应用全局配置。

保留每响应最多三次串行匿名 Apple 台、新、港资料查询。中文资料缺失、超时或响应过大时保留原文。保留美区原始影片目录、权益和播放数据。仅对原有 uts-api.itunes.apple.com 内容域名处理；保留原 v261013a 字幕模块并将本候选排在其上方，停用全部旧界面候选。

回归验证：dev.3 对照在完成查询后确实调用偏好写入；dev.4 两套 HTTP API、失败和本地模式均零偏好读写；四个公开 tvOS 详情/分集响应并发重放通过；字幕固定映射和播放权益保护测试通过。尚待实际首页、详情、分集和 VPN 连续稳定性验收。公开中文区没有的资料仍可能保留英文，不使用第三方翻译。

测试失败时停用本候选，只保留字幕模块；重新开启小火箭并彻底退出、重开 Apple TV App。

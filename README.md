# DSH Disk Cleanup（磁盘清理助手）

Windows 磁盘空间分析与可逆清理工作台，DeepSeek Harness（DSH）插件。
只读扫描，逐项说明，勾选确认后移入隔离区，而不是直接删除。

**中文**：[功能、安全边界、扫描范围与使用](README.zh.md)
**English**: [Features, safety boundaries, scan scope, and usage](README.en.md)

## 版本

- **v0.2.2**（当前）— 多磁盘扫描、卸载残留识别、按盘符分组、中文应用名、垃圾类型筛选
- [v0.1.1](https://github.com/miyunmoshi/dsh-disk-cleanup/tree/v0.1.1) — 首个公开版本，仅扫描系统盘

## 安全边界（摘要）

- 扫描不写入、不移动、不删除任何文件。
- 清理只接受本次扫描结果里的候选，并重新校验路径、大小和修改时间。
- 移入隔离区而非直接删除；清空隔离区需要二次确认。
- 疑似卸载残留固定为「需复核」，绝不默认勾选；含存档标记的目录按用户数据保护。
- 插件接口只监听本机回环地址，并校验随机会话令牌与同源请求。

## License

MIT

# DSH Disk Cleanup（磁盘清理助手）v0.1.1

DeepSeek Harness 的磁盘空间分析与安全清理插件，包名为 dsh-disk-cleanup。左侧栏提供“磁盘清理”入口，打开后是一个完整的本地工作台。

## 功能概览

- 只读扫描用户临时文件、Windows 临时目录、AppData 缓存、浏览器缓存、更新残留、日志与崩溃转储、开发工具缓存、Windows 日志、回收站说明、大文件和重复文件。
- 按类别和应用整理成目录，每个文件都带有用途说明、清理原因、风险等级和建议。
- 用户自行勾选，确认后才移入插件隔离区；隔离区可恢复，也可在二次确认后永久删除。
- 报告扫描范围、权限拒绝、被跳过的文件、锁定文件、损坏文件以及实际清理结果。

## 安全边界

- 扫描不写入、不移动、不删除任何文件。
- 清理只接受当前扫描结果里的候选文件，并重新校验路径、大小和修改时间；路径不在允许目录、已变化、是符号链接或受保护系统目录时会拒绝。
- 清理采用“移入隔离区”而非直接删除，隔离文件保存在 %LOCALAPPDATA%\DSH Disk Cleanup\Quarantine。
- 清空隔离区是永久删除，必须由用户在界面中单独确认。
- 插件接口只监听或接受本机回环地址请求，并校验随机会话令牌与同源请求。
- 用户文件、OneDrive 同步目录、应用配置、系统关键目录、回收站和恢复数据不会被自动处理；Windows 日志会明确标注“谨慎”后列出，移动失败会报告权限原因。
- 清理浏览器或应用缓存前，建议先退出对应程序；被占用的文件会在结果中报告，不会强杀进程。

## 扫描范围

1. 用户临时目录与 Windows 临时目录，默认只收集 2 天以前的普通文件。
2. AppData\Local、Roaming、LocalLow 中的已知缓存、崩溃报告、日志、更新器缓存。
3. Edge、Chrome、Firefox、Brave、Opera、Vivaldi 等浏览器的缓存目录。
4. npm、pnpm、Yarn、pip、NuGet、Gradle、Cargo 等开发者缓存。
5. 用户本地文档目录中的 150 MB 以上大文件，只做复核提示。
6. 用户本地目录中的重复文件，使用 SHA-256 校验，最多 1.5 GB 哈希预算。
7. Windows 回收站的项目说明，只读建议，不由插件清理。

扫描有时间、候选数量和哈希预算上限。达到上限时结果会标记为“部分完成”，并保留已找到的项目。

## 使用

安装后刷新 Harness 页面；桌面版若仍看不到入口，重启一次应用。然后：

1. 在左侧栏点击“磁盘清理”。
2. 首次打开点击“开始全面扫描”。
3. 扫描完成后，在左侧选择类别并展开应用分组。
4. 点击文件名查看详细用途和清理原因。
5. 勾选要处理的文件，也可以使用“全选安全项”。
6. 点击底部“移入隔离区”，阅读确认提示后执行。
7. 在“隔离区”中恢复文件，或在确认无误后永久删除以释放空间。

## 本地数据

- 上次扫描摘要与候选清单：%LOCALAPPDATA%\DSH Disk Cleanup\last-scan.json
- 隔离文件与清单：%LOCALAPPDATA%\DSH Disk Cleanup\Quarantine\批次目录\manifest.json

插件不会上传文件内容或路径到网络服务。

## 卸载

在 Harness 的插件管理中卸载本插件。隔离区目录不会被自动删除；确认不需要恢复后，可手动删除 %LOCALAPPDATA%\DSH Disk Cleanup。

## License

MIT

# DSH Disk Cleanup (disk cleanup assistant) v0.1.1

A DeepSeek Harness plugin for disk space analysis and safe cleanup. The package name is dsh-disk-cleanup. It adds a Disk Cleanup entry in the left sidebar and opens a complete local workspace.

## Overview

- Read-only scanning of user temporary files, the Windows temporary directory, AppData caches, browser caches, update leftovers, logs and crash dumps, developer caches, Windows logs, Recycle Bin descriptions, large files, and duplicate files.
- Organizes files by category and application. Every file includes a purpose explanation, a cleanup reason, a risk level, and a recommendation.
- You choose the files and confirm before anything is moved into the plugin quarantine. Quarantined files can be restored, or permanently deleted after a second confirmation.
- Reports the scan scope, permission denials, skipped files, locked files, corrupted files, and the actual cleanup result.

## Safety boundaries

- Scanning does not write, move, or delete any file.
- Cleanup only accepts candidate files from the current scan result and rechecks each path, size, and modification time. It refuses paths outside allowed directories, changed files, symbolic links, and protected system directories.
- Cleanup moves files into a quarantine instead of deleting them directly. Quarantined files are stored in %LOCALAPPDATA%\DSH Disk Cleanup\Quarantine.
- Emptying the quarantine is a permanent deletion and requires a separate confirmation in the interface.
- The plugin API only listens for and accepts loopback requests from the local machine, and validates a random session token and same-origin requests.
- User files, OneDrive sync folders, application configuration, critical system directories, the Recycle Bin, and recovery data are never handled automatically. Windows logs are listed with a Caution label, and failed moves report the permission reason.
- Before cleaning browser or application caches, quit the corresponding program. Files that are in use are reported in the result; the plugin never force-kills a process.

## Scan scope

1. User temporary directories and the Windows temporary directory, by default only ordinary files older than 2 days.
2. Known caches, crash reports, logs, and updater caches under AppData\Local, Roaming, and LocalLow.
3. Cache directories for Edge, Chrome, Firefox, Brave, Opera, Vivaldi, and other browsers.
4. Developer caches for npm, pnpm, Yarn, pip, NuGet, Gradle, Cargo, and similar tools.
5. Large files of 150 MB or more in user document directories, shown only as a review suggestion.
6. Duplicate files in user directories, verified with SHA-256 and a hash budget of up to 1.5 GB.
7. Descriptions of items in the Windows Recycle Bin, provided as read-only advice; the plugin does not clean them itself.

Scanning has limits on time, candidate count, and hash budget. When a limit is reached, the result is marked as Partially complete and the items already found are kept.

## Usage

After installation, refresh the Harness page. If the desktop version still does not show the entry, restart the application once. Then:

1. Click Disk Cleanup in the left sidebar.
2. On first use, click Start full scan.
3. When the scan finishes, select a category on the left and expand the application groups.
4. Click a file name to view its detailed purpose and cleanup reason.
5. Select the files to handle, or use Select all safe items.
6. Click Move to Quarantine at the bottom and read the confirmation prompt before proceeding.
7. Restore files from Quarantine, or permanently delete them after confirming they are no longer needed, to free space.

## Local data

- Last scan summary and candidate list: %LOCALAPPDATA%\DSH Disk Cleanup\last-scan.json
- Quarantined files and manifest: %LOCALAPPDATA%\DSH Disk Cleanup\Quarantine\batch directory\manifest.json

The plugin does not upload file contents or paths to any network service.

## Uninstall

Uninstall the plugin from the Harness plugin manager. The quarantine directory is not deleted automatically. After confirming that you no longer need to restore anything, you can manually delete %LOCALAPPDATA%\DSH Disk Cleanup.

## License

MIT

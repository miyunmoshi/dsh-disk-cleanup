# DSH Disk Cleanup（磁盘清理助手）v0.2.2

[English](README.en.md) | 简体中文

DeepSeek Harness 的磁盘空间分析与安全清理插件，包名为 dsh-disk-cleanup。左侧栏提供“磁盘清理”入口，打开后是一个完整的本地工作台。

DeepSeek Harness 里的 AI 助手可以在会话中解读本插件的扫描结果：每个候选文件做什么、来自哪个软件或哪次安装、为什么被列为可清理，以及风险等级和建议，避免因为不了解用途而误删。扫描、分类和风险判定由插件在本地完成，AI 只负责解读。

卸载残留也会有线索：插件会对照系统“已安装程序”登记，把长期没有更新、登记里找不到、但目录内仍留有缓存、日志、安装包或更新文件的 AppData 目录列为“疑似卸载残留”——曾经装过又卸载、解压后直接运行、或从非官方渠道获取的软件都可能留下这类目录。这类条目一律标“需复核”、默认不勾选；含存档标记的目录按用户数据保护，不会被当作残留。

以下是具体能力与安全边界。

## 功能概览

- 只读扫描用户临时文件、Windows 临时目录、AppData 缓存、浏览器缓存、更新残留、卸载残留、日志与崩溃转储、开发工具缓存、Windows 日志、回收站说明、大文件和重复文件。
- 支持同时选择多个磁盘：系统盘深度扫描，其他盘只扫描常见缓存、日志、临时、更新和残留目录，不遍历用户文档或游戏内容。
- 同时扫描多个磁盘时，文件列表先按 C:、D:、E: 等盘符分区，再在每个盘符下按应用和类别展示文件；点击盘符标题可以收起或展开该盘的全部内容。
- 使用系统“已安装程序”登记辅助识别卸载残留：目录长期未更新且没有匹配项时列为“疑似卸载残留”，只做复核提示，默认不选。
- 文件说明中显示常见中文应用名与公司或厂商名，同时保留应用原名。例如：微信（腾讯 / WeChat）。
- 按类别和垃圾类型筛选整理。垃圾类型包括缓存、日志、残留、安装更新、临时、重复、大文件和回收站；每个文件都带有用途说明、清理原因、风险等级和建议。
- 用户自行勾选，确认后才移入插件隔离区；隔离区可恢复，也可在二次确认后永久删除。
- 报告扫描范围、扫描磁盘、疑似卸载残留应用、权限拒绝、被跳过的文件、锁定文件、损坏文件以及实际清理结果。

## 安全边界

- 扫描不写入、不移动、不删除任何文件。
- 清理只接受当前扫描结果里的候选文件，并重新校验路径、大小和修改时间；路径不在允许目录、已变化、是符号链接或受保护系统目录时会拒绝。
- 清理采用“移入隔离区”而非直接删除。系统盘隔离文件保存在 %LOCALAPPDATA%\DSH Disk Cleanup\Quarantine；其他盘保存在该盘根目录的 $DSH-Disk-Cleanup\Quarantine，以保证移动在同一磁盘内完成。
- 清空隔离区是永久删除，必须由用户在界面中单独确认。
- 插件接口只监听或接受本机回环地址请求，并校验随机会话令牌与同源请求。
- 用户文件、OneDrive 同步目录、应用配置、系统关键目录、回收站和恢复数据不会被自动处理；Windows 日志会明确标注“谨慎”后列出，移动失败会报告权限原因。
- 疑似卸载残留只是“系统安装登记中没有找到匹配项”，便携软件也可能没有登记，因此风险等级固定为“需复核”，绝不默认勾选。只有目录内仍留有缓存、日志、安装包或更新文件时才会列为疑似残留；包含 save、savedata、.sav 等存档标记的目录按用户数据保护，不会被当作卸载残留。
- 清理浏览器或应用缓存前，建议先退出对应程序；被占用的文件会在结果中报告，不会强杀进程。

## 扫描范围

1. 用户临时目录与 Windows 临时目录，默认只收集 2 天以前的普通文件。
2. AppData\Local、Roaming、LocalLow 中的已知缓存、崩溃报告、日志、更新器缓存，以及疑似卸载残留的数据目录。
3. Edge、Chrome、Firefox、Brave、Opera、Vivaldi 等浏览器的缓存目录。
4. npm、pnpm、Yarn、pip、NuGet、Gradle、Cargo 等开发者缓存。
5. 用户本地文档目录中的 150 MB 以上大文件，只做复核提示。
6. 用户本地目录中的重复文件，使用 SHA-256 校验，最多 1.5 GB 哈希预算。
7. Windows 回收站的项目说明，只读建议，不由插件清理。
8. Windows 升级残留，例如 Windows.old，以及未完成下载的临时分块。
9. 其他选中磁盘中的常见缓存、日志、临时、更新和残留目录，不遍历普通用户文件与游戏内容。

扫描有时间、候选数量和哈希预算上限。达到上限时结果会标记为“部分完成”，并保留已找到的项目。

## 使用

安装后刷新 Harness 页面；桌面版若仍看不到入口，重启一次应用。然后：

1. 在左侧栏点击“磁盘清理”。
2. 首次打开后，在“扫描磁盘”卡片中勾选要扫描的磁盘，再点击“开始全面扫描”。
3. 扫描完成后，在左侧选择类别，或用顶部“垃圾类型”下拉框筛选缓存、日志、残留等类型，并展开应用分组。
4. 点击文件名查看详细用途、应用原名、公司或厂商和清理原因。
5. 勾选要处理的文件，也可以使用“全选安全项”或“选中当前筛选”。
6. 点击底部“移入隔离区”，阅读确认提示后执行。
7. 在“隔离区”中恢复文件，或在确认无误后永久删除以释放空间。

## 本地数据

- 上次扫描摘要与候选清单：%LOCALAPPDATA%\DSH Disk Cleanup\last-scan.json
- 系统盘隔离文件与清单：%LOCALAPPDATA%\DSH Disk Cleanup\Quarantine\批次目录\manifest.json
- 其他盘隔离批次索引：%LOCALAPPDATA%\DSH Disk Cleanup\quarantine-roots.json
- 其他盘隔离文件：以 E 盘为例，E:\$DSH-Disk-Cleanup\Quarantine\批次目录\

插件不会上传文件内容或路径到网络服务。

## 卸载

在 Harness 的插件管理中卸载本插件。隔离区目录不会被自动删除；确认不需要恢复后，可手动删除 %LOCALAPPDATA%\DSH Disk Cleanup。

## License

MIT

# DSH Disk Cleanup (disk cleanup assistant) v0.2.2

[简体中文](README.zh.md) | English

A DeepSeek Harness plugin for disk space analysis and safe cleanup. The package name is dsh-disk-cleanup. It adds a Disk Cleanup entry in the left sidebar and opens a complete local workspace.

The AI assistant in DeepSeek Harness can explain this plugin's scan results in a conversation: what each candidate file does, which application or installation it came from, why it was marked as cleanable, and what risk level and recommendation apply. That way you can decide without guessing what a file is for. Scanning, classification, and risk decisions all happen locally inside the plugin; the AI only explains the results.

Uninstall leftovers are surfaced as leads, not conclusions. The plugin compares AppData directories with the Windows installed-program registry and lists a directory as a suspected uninstall leftover when it has not been updated for a long time, has no matching registry entry, and still contains cache, log, installer, or update files. This is the kind of folder left behind by software that was installed and removed, run after being extracted, or obtained outside official channels. These entries are always labeled Review and are never selected by default; directories with save markers are treated as user data and never classified as leftovers.

Below are the concrete capabilities and the safety boundaries.

## Overview

- Read-only scanning of user temporary files, the Windows temporary directory, AppData caches, browser caches, update leftovers, uninstall leftovers, logs and crash dumps, developer caches, Windows logs, Recycle Bin descriptions, large files, and duplicate files.
- Supports selecting multiple drives at the same time. The system drive is scanned deeply; other drives are scanned only for common cache, log, temporary, update, and leftover directories, without traversing user documents or game content.
- When multiple drives are scanned, the file list is first divided by drive letter, such as C:, D:, and E:, and then shows files by application and category under each drive. Click a drive title to collapse or expand all content on that drive.
- Uses the Windows installed-program registry to help identify uninstall leftovers. A directory is listed as a suspected uninstall leftover only when it has not been updated for a long time and has no matching entry; it is shown only as a review suggestion and is not selected by default.
- File descriptions show common Chinese application names and company or vendor names while preserving the original application names. For example: WeChat (Tencent / WeChat).
- Organizes files by category and junk type. Junk types include cache, logs, leftovers, install and update, temporary, duplicate, large files, and Recycle Bin. Every file includes a purpose explanation, a cleanup reason, a risk level, and a recommendation.
- You choose the files and confirm before anything is moved into the plugin quarantine. Quarantined files can be restored, or permanently deleted after a second confirmation.
- Reports the scan scope, scanned drives, suspected uninstall leftover applications, permission denials, skipped files, locked files, corrupted files, and the actual cleanup result.

## Safety boundaries

- Scanning does not write, move, or delete any file.
- Cleanup only accepts candidate files from the current scan result and rechecks each path, size, and modification time. It refuses paths outside allowed directories, changed files, symbolic links, and protected system directories.
- Cleanup moves files into a quarantine instead of deleting them directly. System-drive quarantined files are stored in %LOCALAPPDATA%\DSH Disk Cleanup\Quarantine; files from other drives are stored in the $DSH-Disk-Cleanup\Quarantine folder at the root of that drive, so the move stays on the same drive.
- Emptying the quarantine is a permanent deletion and requires a separate confirmation in the interface.
- The plugin API only listens for or accepts loopback requests from the local machine, and validates a random session token and same-origin requests.
- User files, OneDrive sync folders, application configuration, critical system directories, the Recycle Bin, and recovery data are never handled automatically. Windows logs are listed with a Caution label, and failed moves report the permission reason.
- A suspected uninstall leftover only means that no matching entry was found in the installed-program registry. Portable software may also have no registry entry, so the risk level is fixed at Review and it is never selected by default. A directory is listed only when it still contains cache, log, installer, or update files; directories containing save markers such as save, savedata, or .sav are treated as user data and are not classified as uninstall leftovers.
- Before cleaning browser or application caches, quit the corresponding program. Files that are in use are reported in the result; the plugin never force-kills a process.

## Scan scope

1. User temporary directories and the Windows temporary directory; by default, only ordinary files older than 2 days.
2. Known caches, crash reports, logs, updater caches, and suspected uninstall-leftover data directories under AppData\Local, Roaming, and LocalLow.
3. Cache directories for Edge, Chrome, Firefox, Brave, Opera, Vivaldi, and other browsers.
4. Developer caches for npm, pnpm, Yarn, pip, NuGet, Gradle, Cargo, and similar tools.
5. Large files of 150 MB or more in user document directories, shown only as a review suggestion.
6. Duplicate files in user directories, verified with SHA-256 and a hash budget of up to 1.5 GB.
7. Descriptions of items in the Windows Recycle Bin, provided as read-only advice; the plugin does not clean them itself.
8. Windows upgrade leftovers such as Windows.old, and incomplete download temporary chunks.
9. Common cache, log, temporary, update, and leftover directories on other selected drives, without traversing ordinary user files or game content.

Scanning has limits on time, candidate count, and hash budget. When a limit is reached, the result is marked as Partially complete and the items already found are kept.

## Usage

After installation, refresh the Harness page. If the desktop version still does not show the entry, restart the application once. Then:

1. Click Disk Cleanup in the left sidebar.
2. On first use, select the drives to scan in the Scan drives card, then click Start full scan.
3. When the scan finishes, select a category on the left, or use the Junk type drop-down at the top to filter cache, logs, leftovers, and other types, and expand the application groups.
4. Click a file name to view its detailed purpose, original application name, company or vendor, and cleanup reason.
5. Select the files to handle, or use Select all safe items or Select filtered items.
6. Click Move to Quarantine at the bottom and read the confirmation prompt before proceeding.
7. Restore files from Quarantine, or permanently delete them after confirming they are no longer needed, to free space.

## Local data

- Last scan summary and candidate list: %LOCALAPPDATA%\DSH Disk Cleanup\last-scan.json
- System-drive quarantined files and manifest: %LOCALAPPDATA%\DSH Disk Cleanup\Quarantine\batch directory\manifest.json
- Other-drive quarantine batch index: %LOCALAPPDATA%\DSH Disk Cleanup\quarantine-roots.json
- Other-drive quarantined files: for example, E:\$DSH-Disk-Cleanup\Quarantine\batch directory\

The plugin does not upload file contents or paths to any network service.

## Uninstall

Uninstall the plugin from the Harness plugin manager. The quarantine directory is not deleted automatically. After confirming that you no longer need to restore anything, you can manually delete %LOCALAPPDATA%\DSH Disk Cleanup.

## License

MIT
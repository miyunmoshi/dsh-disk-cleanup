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

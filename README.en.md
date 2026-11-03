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

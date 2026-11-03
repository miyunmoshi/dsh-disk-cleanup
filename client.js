window.__ModuleLoader__.load({
  id: 'dsh-disk-cleanup',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'disk-cleanup'
    const API_ROOT = '/dsh-disk-cleanup/api'
    const CATEGORY_ORDER = ['temp', 'browser', 'appcache', 'update', 'logs', 'devcache', 'recycle', 'large', 'duplicate']
    const PHASES = ['preparing', 'appdata', 'temp', 'system', 'devcache', 'user-files', 'duplicates', 'recycle', 'finalizing', 'done']

    const ZH = {
      nav: '磁盘清理',
      title: '磁盘清理助手',
      subtitle: '先看清空间去向，再逐项确认。清理会先进入可恢复的隔离区。',
      scan: '开始扫描',
      rescan: '重新扫描',
      move: '移入隔离区…',
      reloadPage: '刷新页面',
      quarantineBtn: '隔离区',
      close: '关闭',
      cancel: '取消',
      cancelScan: '取消扫描',
      startScan: '开始全面扫描',
      scanning: '正在扫描…',
      booting: '正在连接本机清理服务…',
      initialTitle: '让空间去向一目了然',
      initialBody: '只读扫描不会改动任何文件。发现的项目会按类别整理，每个文件都附有功能说明和清理原因，最后由你决定处理哪些。',
      scopeTitle: '扫描范围',
      safetyTitle: '安全规则',
      safety1: '扫描只读，先解释再操作',
      safety2: '默认不选任何文件，由你逐项决定',
      safety3: '清理先移入隔离区，可恢复',
      safety4: '系统目录、用户文件和 OneDrive 默认保护',
      deep: '深度查找重复文件',
      deepHint: '对本地大文件做 SHA-256 校验，最多 1.5 GB；关闭可加快扫描。',
      nowScan: '开始扫描',
      sumCandidates: '发现候选',
      sumSafe: '安全缓存',
      sumReview: '需人工复核',
      sumFree: 'C 盘可用',
      files: '个文件',
      items: '项',
      batches: '批次',
      selected: '已选择',
      categoryTitle: '类别',
      all: '全部',
      'category.temp': '临时文件',
      'category.browser': '浏览器缓存',
      'category.appcache': '应用缓存',
      'category.update': '更新与安装残留',
      'category.logs': '日志与崩溃转储',
      'category.devcache': '开发工具缓存',
      'category.recycle': '回收站（仅说明）',
      'category.large': '大文件复核',
      'category.duplicate': '重复文件',
      search: '搜索文件名、路径、用途…',
      filterAll: '全部风险',
      filterSafe: '仅安全',
      filterCaution: '谨慎',
      filterReview: '需复核',
      selectSafe: '全选安全项',
      clear: '清除选择',
      noResults: '没有符合当前筛选条件的文件',
      emptyScan: '这次扫描没有发现候选文件。',
      'risk.safe': '安全',
      'risk.caution': '谨慎',
      'risk.review': '需复核',
      protected: '受保护',
      infoOnly: '仅说明',
      admin: '可能需要管理员权限',
      details: '详情',
      showMore: '显示更多',
      days: '天',
      hours: '小时',
      'detail.title': '文件详情',
      'detail.purpose': '这个文件做什么',
      'detail.reason': '为什么建议清理',
      'detail.meta': '基本信息',
      path: '完整路径',
      size: '大小',
      modified: '最后修改',
      age: '文件年龄',
      app: '应用',
      category: '类别',
      risk: '风险',
      duplicateOf: '保留的最新副本',
      quarantineNote: '移入隔离区后仍可恢复；只有永久删除隔离区后，磁盘空间才会释放。',
      'detail.select': '选择此文件',
      'detail.deselect': '取消选择',
      'confirm.title': '确认移入隔离区',
      'confirm.body': '以下文件会从原位置移动到本机隔离区，而不是直接删除。确认前请再次检查。',
      'confirm.risk': '所选项目包含“谨慎”或“需复核”的内容，请确认你已经阅读每一项的原因。',
      'confirm.protected': '所选项目包含用户文件或受保护数据。它们不会被永久删除，但仍会离开原位置。',
      'confirm.quarantine': '移入隔离区不会立即释放磁盘空间；只有在隔离区中永久删除后才会释放。',
      'confirm.check': '我已确认这些文件不再需要，并可以移入隔离区',
      'confirm.move': '确认移入',
      working: '正在处理…',
      cleanupDone: '已移入隔离区',
      cleanupPartial: '部分文件未能处理',
      failures: '失败项目',
      'quarantine.title': '可恢复隔离区',
      'quarantine.empty': '隔离区是空的。清理后的文件会先出现在这里。',
      restore: '恢复全部',
      purge: '永久删除',
      restoreDone: '已恢复',
      purgeTitle: '永久删除隔离批次',
      purgeBody: '永久删除后无法通过插件恢复，并会立即释放空间。请确认这些文件不再需要。',
      purgeCheck: '我明白此操作不可恢复',
      purgeDo: '永久删除',
      purged: '隔离批次已永久删除',
      'report.title': '扫描报告',
      permission: '权限拒绝',
      skippedTitle: '跳过详情',
      partial: '部分完成',
      partialHint: '已达到时间、数量或扫描预算上限，结果可能不完整。可以重新扫描，或缩小范围后再试。',
      scanTime: '扫描时间',
      elapsed: '耗时',
      filesSeen: '已检查',
      warnings: '权限/读取异常',
      noWarnings: '没有权限或读取异常。',
      retry: '重试',
      errorTitle: '操作失败',
      connectionError: '无法连接本机清理服务，请刷新页面后重试。',
      scanCancelled: '扫描已取消',
      scanDone: '扫描完成',
      localOnly: '本机接口，不联网',
      scannedAt: '上次扫描',
      appDataTitle: 'AppData 占用',
      appDataHint: '按顶层应用统计，仅用于了解占用，不代表都建议清理。',
      appDataEmpty: '本次没有收集到 AppData 占用详情。',
      free: '可用',
      used: '已用',
      total: '总计',
      viewReport: '查看扫描报告',
      openQuarantine: '打开隔离区',
      scopeNote: '用户文件、OneDrive、系统目录和回收站项目默认不会被直接处理。',
      'phase.preparing': '准备扫描',
      'phase.appdata': '扫描 AppData 缓存',
      'phase.temp': '扫描临时文件',
      'phase.system': '扫描系统日志',
      'phase.devcache': '扫描开发缓存',
      'phase.user-files': '扫描用户大文件',
      'phase.duplicates': '校验重复文件',
      'phase.recycle': '检查回收站',
      'phase.finalizing': '整理结果',
      'phase.done': '完成',
      'skip.permission': '权限拒绝',
      'skip.protected': '受保护跳过',
      'skip.symlink': '符号链接',
      'skip.recent': '最近使用',
      'skip.small': '过小文件',
      'skip.active': '使用中',
      'skip.error': '读取错误',
      'skip.limit': '达到上限',
      'result.title': '处理结果',
      'result.summary': '摘要',
      'quarantine.restoreDone': '已恢复文件',
      'quarantine.purgedDone': '已永久删除并释放空间',
      'selectionRiskNote': '选择中包含需确认的项目',
      'noSelection': '请至少勾选一个文件',
      'clearFilters': '清除筛选',
      'report.noPermission': '权限拒绝的项目会在上方列表中给出路径和系统错误。',
      'scanRoots': '扫描根目录',
      'storageNote': '隔离区占用',
      'loadingScan': '正在读取上次扫描结果…',
      'quarantine.load': '正在读取隔离区…',
      'action.restore': '恢复',
      'action.purge': '永久删除',
      'batch.created': '创建于',
      'batch.failures': '当时失败',
      'result.cleaned': '已移入',
      'result.restored': '已恢复',
      'result.purged': '已永久删除',
      'result.released': '释放空间',
      'result.failed': '失败',
      'filter.label': '筛选',
      'riskFiltered': '风险筛选',
    }

    const EN = {
      nav: 'Disk Cleanup',
      title: 'Disk Cleanup',
      subtitle: 'See where space goes, then confirm item by item. Cleanup moves files into a reversible quarantine first.',
      scan: 'Start scan',
      rescan: 'Scan again',
      move: 'Move to quarantine…',
      reloadPage: 'Reload page',
      quarantineBtn: 'Quarantine',
      close: 'Close',
      cancel: 'Cancel',
      cancelScan: 'Cancel scan',
      startScan: 'Start full scan',
      scanning: 'Scanning…',
      booting: 'Connecting to the local disk service…',
      initialTitle: 'See where your space goes',
      initialBody: 'The scan is read-only. Candidates are organized by category, every file gets an explanation, and you decide what to handle.',
      scopeTitle: 'Scan scope',
      safetyTitle: 'Safety rules',
      safety1: 'Read-only scan, explain before acting',
      safety2: 'Nothing is selected by default',
      safety3: 'Cleanup uses a reversible quarantine',
      safety4: 'System folders, user files, and OneDrive are protected',
      deep: 'Deep duplicate detection',
      deepHint: 'SHA-256 checks for local large files, up to 1.5 GB; disable to scan faster.',
      nowScan: 'Start scan',
      sumCandidates: 'Candidates',
      sumSafe: 'Safe cache',
      sumReview: 'Needs review',
      sumFree: 'Free on C:',
      files: 'files',
      items: 'items',
      batches: 'batches',
      selected: 'Selected',
      categoryTitle: 'Categories',
      all: 'All',
      'category.temp': 'Temporary files',
      'category.browser': 'Browser cache',
      'category.appcache': 'App cache',
      'category.update': 'Update leftovers',
      'category.logs': 'Logs & dumps',
      'category.devcache': 'Developer caches',
      'category.recycle': 'Recycle Bin (info)',
      'category.large': 'Large files to review',
      'category.duplicate': 'Duplicate files',
      search: 'Search name, path, or purpose…',
      filterAll: 'All risk levels',
      filterSafe: 'Safe only',
      filterCaution: 'Caution',
      filterReview: 'Needs review',
      selectSafe: 'Select safe items',
      clear: 'Clear selection',
      noResults: 'No files match the current filters',
      emptyScan: 'This scan found no candidates.',
      'risk.safe': 'Safe',
      'risk.caution': 'Caution',
      'risk.review': 'Review',
      protected: 'Protected',
      infoOnly: 'Info only',
      admin: 'May need administrator',
      details: 'Details',
      showMore: 'Show more',
      days: 'days',
      hours: 'hours',
      'detail.title': 'File details',
      'detail.purpose': 'What this file does',
      'detail.reason': 'Why cleanup is suggested',
      'detail.meta': 'Metadata',
      path: 'Full path',
      size: 'Size',
      modified: 'Modified',
      age: 'Age',
      app: 'Application',
      category: 'Category',
      risk: 'Risk',
      duplicateOf: 'Newest copy kept',
      quarantineNote: 'Files in quarantine can be restored. Disk space is released only after a permanent purge.',
      'detail.select': 'Select this file',
      'detail.deselect': 'Deselect',
      'confirm.title': 'Move to quarantine?',
      'confirm.body': 'The selected files will be moved from their original locations into the local quarantine. They will not be deleted directly.',
      'confirm.risk': 'The selection includes Caution or Review items. Make sure you have read each reason.',
      'confirm.protected': 'The selection includes user files or protected data. They will not be purged, but they will leave their original locations.',
      'confirm.quarantine': 'Moving to quarantine does not free disk space immediately. Space is released only after a permanent purge.',
      'confirm.check': 'I confirm these files are no longer needed and may be moved to quarantine',
      'confirm.move': 'Move to quarantine',
      working: 'Working…',
      cleanupDone: 'Moved to quarantine',
      cleanupPartial: 'Some files could not be moved',
      failures: 'Failures',
      'quarantine.title': 'Reversible quarantine',
      'quarantine.empty': 'The quarantine is empty. Cleaned files appear here first.',
      restore: 'Restore all',
      purge: 'Delete permanently',
      restoreDone: 'Restored',
      purgeTitle: 'Permanently delete quarantine batch',
      purgeBody: 'A permanent deletion cannot be restored from this plugin and frees space immediately. Confirm that these files are no longer needed.',
      purgeCheck: 'I understand this cannot be undone',
      purgeDo: 'Delete permanently',
      purged: 'Quarantine batch permanently deleted',
      'report.title': 'Scan report',
      permission: 'Permission denied',
      skippedTitle: 'Skipped details',
      partial: 'Partial result',
      partialHint: 'A time, candidate, or scan budget limit was reached. The result may be incomplete. Rescan or narrow the scope.',
      scanTime: 'Scan time',
      elapsed: 'Duration',
      filesSeen: 'Files seen',
      warnings: 'Permission/read issues',
      noWarnings: 'No permission or read errors were recorded.',
      retry: 'Retry',
      errorTitle: 'Operation failed',
      connectionError: 'Could not reach the local disk service. Refresh the page and try again.',
      scanCancelled: 'Scan cancelled',
      scanDone: 'Scan complete',
      localOnly: 'Local-only API',
      scannedAt: 'Last scan',
      appDataTitle: 'AppData usage',
      appDataHint: 'Grouped by top-level app for context only; not everything here is suggested for cleanup.',
      appDataEmpty: 'No AppData usage details were collected.',
      free: 'Free',
      used: 'Used',
      total: 'Total',
      viewReport: 'View scan report',
      openQuarantine: 'Open quarantine',
      scopeNote: 'User files, OneDrive, system folders, and Recycle Bin items are never acted on directly by default.',
      'phase.preparing': 'Preparing',
      'phase.appdata': 'Scanning AppData caches',
      'phase.temp': 'Scanning temporary files',
      'phase.system': 'Scanning system logs',
      'phase.devcache': 'Scanning developer caches',
      'phase.user-files': 'Scanning user files',
      'phase.duplicates': 'Hashing duplicate candidates',
      'phase.recycle': 'Inspecting Recycle Bin',
      'phase.finalizing': 'Building the catalog',
      'phase.done': 'Done',
      'skip.permission': 'Permission denied',
      'skip.protected': 'Protected',
      'skip.symlink': 'Symlinks',
      'skip.recent': 'Recently used',
      'skip.small': 'Too small',
      'skip.active': 'In use',
      'skip.error': 'Read errors',
      'skip.limit': 'Limit reached',
      'result.title': 'Operation result',
      'result.summary': 'Summary',
      'quarantine.restoreDone': 'Files restored',
      'quarantine.purgedDone': 'Permanently deleted and space released',
      'selectionRiskNote': 'Selection includes items that need confirmation',
      'noSelection': 'Select at least one file',
      'clearFilters': 'Clear filters',
      'report.noPermission': 'Denied paths and their system errors are listed above.',
      'scanRoots': 'Scan roots',
      'storageNote': 'Quarantine usage',
      'loadingScan': 'Reading the last scan…',
      'quarantine.load': 'Reading the quarantine…',
      'action.restore': 'Restore',
      'action.purge': 'Delete permanently',
      'batch.created': 'Created',
      'batch.failures': 'Failed then',
      'result.cleaned': 'Moved',
      'result.restored': 'Restored',
      'result.purged': 'Permanently deleted',
      'result.released': 'Space released',
      'result.failed': 'Failed',
      'filter.label': 'Filter',
      'riskFiltered': 'Risk filter',
    }

    const CSS = `
.ddc-root, .ddc-root * { box-sizing: border-box; }
.ddc-root {
  height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-family: inherit;
}
.ddc-header {
  display: flex; align-items: flex-start; gap: 16px; padding: 22px 28px 16px;
  border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base);
}
.ddc-mark {
  width: 46px; height: 46px; flex: none; border-radius: 14px; display: grid; place-items: center;
  color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-1));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, var(--dsw-alias-border-l1));
}
.ddc-heading { min-width: 0; flex: 1; }
.ddc-title { margin: 0; font-size: 22px; line-height: 1.25; font-weight: 680; letter-spacing: -0.02em; }
.ddc-subtitle { margin: 5px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--dsw-alias-label-secondary); max-width: 780px; }
.ddc-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.ddc-btn {
  appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); border-radius: 9px; padding: 7px 12px; font: inherit; font-size: 12.5px;
  line-height: 1.35; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;
  transition: background .15s ease, border-color .15s ease, transform .12s ease;
}
.ddc-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.ddc-btn:active:not(:disabled) { transform: translateY(1px); }
.ddc-btn:disabled { opacity: .52; cursor: not-allowed; }
.ddc-btn-primary {
  color: var(--dsw-alias-bg-base); background: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary); font-weight: 600;
}
.ddc-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, var(--dsw-alias-label-primary)); }
.ddc-btn-danger { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, var(--dsw-alias-border-l1)); }
.ddc-btn-quiet { background: transparent; border-color: transparent; color: var(--dsw-alias-label-secondary); }
.ddc-count-badge {
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 10.5px; font-weight: 650; color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, transparent);
}
.ddc-body {
  flex: 1; min-height: 0; display: grid; grid-template-columns: 252px minmax(0, 1fr); gap: 18px;
  padding: 18px 24px 20px; overflow: hidden;
}
.ddc-side { min-height: 0; overflow: auto; padding-right: 2px; display: flex; flex-direction: column; gap: 12px; }
.ddc-main { min-width: 0; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
.ddc-card {
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  border-radius: 13px; padding: 14px;
}
.ddc-card-title { margin: 0 0 10px; font-size: 11.5px; font-weight: 650; color: var(--dsw-alias-label-secondary); letter-spacing: .04em; text-transform: uppercase; }
.ddc-volume-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.ddc-volume-value { font-size: 22px; font-weight: 680; letter-spacing: -0.03em; }
.ddc-volume-sub { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ddc-meter { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; margin: 9px 0 10px; }
.ddc-meter-fill { height: 100%; border-radius: inherit; background: var(--dsw-alias-brand-primary); }
.ddc-kv { display: flex; justify-content: space-between; gap: 10px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); padding: 2px 0; }
.ddc-kv strong { color: var(--dsw-alias-label-primary); font-weight: 550; }
.ddc-nav { display: flex; flex-direction: column; gap: 2px; }
.ddc-navrow {
  appearance: none; width: 100%; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-primary);
  border-radius: 8px; padding: 7px 8px; display: flex; align-items: center; gap: 8px; text-align: left; font: inherit;
  font-size: 12px; cursor: pointer;
}
.ddc-navrow:hover { background: var(--dsw-alias-bg-layer-2); }
.ddc-navrow.active {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-1));
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, var(--dsw-alias-border-l1));
}
.ddc-navdot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--dsw-alias-state-idle-primary); opacity: .7; }
.ddc-navrow.active .ddc-navdot { background: var(--dsw-alias-brand-primary); opacity: 1; }
.ddc-navlabel { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddc-navmeta { font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; flex: none; }
.ddc-app-row { margin: 8px 0; }
.ddc-app-top { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-bottom: 4px; }
.ddc-app-top span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddc-app-top span:last-child { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; flex: none; }
.ddc-app-bar { height: 5px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.ddc-app-fill { height: 100%; border-radius: inherit; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 62%, var(--dsw-alias-bg-layer-1)); }
.ddc-hint { font-size: 10.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); margin: 8px 0 0; }
.ddc-side-actions { display: flex; flex-direction: column; gap: 6px; }
.ddc-side-link {
  appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 11.5px;
  display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer; padding: 5px 2px;
}
.ddc-side-link:hover { color: var(--dsw-alias-brand-primary); }
.ddc-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.ddc-search-wrap { position: relative; flex: 1 1 240px; min-width: 180px; }
.ddc-search-wrap .ddc-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--dsw-alias-label-secondary); pointer-events: none; }
.ddc-input, .ddc-select {
  width: 100%; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); border-radius: 9px; padding: 8px 10px; font: inherit; font-size: 12px;
  outline: none;
}
.ddc-input { padding-left: 31px; }
.ddc-input:focus, .ddc-select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 15%, transparent); }
.ddc-select { width: auto; min-width: 128px; }
.ddc-toolbar-end { display: flex; gap: 6px; flex-wrap: wrap; }
.ddc-scanline {
  display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 11.5px; color: var(--dsw-alias-label-secondary);
  padding: 2px 1px;
}
.ddc-scanline strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
.ddc-scanline button { border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11.5px; cursor: pointer; padding: 0; }
.ddc-warn-text { color: var(--dsw-alias-state-warn-primary); }
.ddc-error-text { color: var(--dsw-alias-state-error-primary); }
.ddc-content { flex: 1; min-height: 0; overflow: auto; padding-right: 2px; display: flex; flex-direction: column; gap: 10px; }
.ddc-content > * { flex: none; }
.ddc-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.ddc-stat { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 12px; padding: 11px 13px; min-width: 0; }
.ddc-stat-label { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ddc-stat-value { font-size: 18px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddc-stat-sub { font-size: 10.5px; color: var(--dsw-alias-label-secondary); margin-top: 3px; }
.ddc-group { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 12px; overflow: hidden; margin-bottom: 9px; }
.ddc-group-head { display: flex; align-items: center; gap: 8px; padding: 9px 11px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 42%, var(--dsw-alias-bg-layer-1)); min-height: 42px; }
.ddc-group-head:hover { background: var(--dsw-alias-bg-layer-2); }
.ddc-iconbtn {
  appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); width: 22px; height: 22px;
  border-radius: 6px; display: grid; place-items: center; cursor: pointer; flex: none; padding: 0;
}
.ddc-iconbtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent); color: var(--dsw-alias-label-primary); }
.ddc-chevron { transition: transform .15s ease; }
.ddc-chevron.open { transform: rotate(90deg); }
.ddc-group-title { min-width: 0; flex: 1; display: flex; align-items: baseline; gap: 7px; overflow: hidden; }
.ddc-group-name { font-size: 12.5px; font-weight: 620; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ddc-group-count { font-size: 10.5px; color: var(--dsw-alias-label-secondary); white-space: nowrap; flex: none; }
.ddc-group-side { display: flex; align-items: center; gap: 7px; flex: none; }
.ddc-group-bytes { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ddc-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.ddc-chip {
  display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 5px; font-size: 10px; font-weight: 550;
  color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); white-space: nowrap;
}
.ddc-chip.safe { color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); }
.ddc-chip.caution { color: var(--dsw-alias-state-warn-primary); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 13%, transparent); }
.ddc-chip.review { color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 11%, transparent); }
.ddc-rows { border-top: 1px solid var(--dsw-alias-border-l1); }
.ddc-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.ddc-row:last-child { border-bottom: 0; }
.ddc-row:hover { background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 42%, transparent); }
.ddc-row-main { min-width: 0; flex: 1; }
.ddc-file-line { display: flex; align-items: baseline; gap: 7px; min-width: 0; }
.ddc-file-name {
  appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; padding: 0;
  font-size: 12px; font-weight: 590; text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; min-width: 0;
}
.ddc-file-name:hover { color: var(--dsw-alias-brand-primary); text-decoration: underline; text-underline-offset: 2px; }
.ddc-file-purpose { font-size: 11px; color: var(--dsw-alias-label-secondary); line-height: 1.45; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddc-row-meta { display: flex; align-items: center; gap: 8px; flex: none; padding-top: 1px; }
.ddc-size { font-size: 11px; color: var(--dsw-alias-label-primary); font-variant-numeric: tabular-nums; min-width: 54px; text-align: right; }
.ddc-age { font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; min-width: 48px; text-align: right; }
.ddc-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; border-radius: 5px;
  padding: 2px 6px; white-space: nowrap;
}
.ddc-badge.safe { color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); }
.ddc-badge.caution { color: var(--dsw-alias-state-warn-primary); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 13%, transparent); }
.ddc-badge.review { color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 11%, transparent); }
.ddc-badge.muted { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); }
.ddc-info-btn { width: 24px; height: 24px; }
.ddc-check { width: 15px; height: 15px; flex: none; accent-color: var(--dsw-alias-brand-primary); margin: 1px 0 0; cursor: pointer; }
.ddc-check:disabled { cursor: not-allowed; opacity: .45; }
.ddc-more { border-top: 1px solid var(--dsw-alias-border-l1); padding: 7px 11px; }
.ddc-more button { border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11.5px; cursor: pointer; padding: 2px 0; }
.ddc-empty {
  border: 1px dashed var(--dsw-alias-border-l2); border-radius: 13px; padding: 34px 22px; text-align: center;
  color: var(--dsw-alias-label-secondary); font-size: 12px;
}
.ddc-empty strong { display: block; color: var(--dsw-alias-label-primary); font-size: 14px; margin-bottom: 5px; }
.ddc-footer {
  flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 13px;
  padding: 10px 12px 10px 15px;
}
.ddc-footer-copy { min-width: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); line-height: 1.35; }
.ddc-footer-copy strong { color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 650; }
.ddc-footer-actions { display: flex; align-items: center; gap: 7px; flex: none; }
.ddc-hero { display: flex; flex-direction: column; gap: 14px; max-width: 860px; margin: 0 auto; width: 100%; padding: 10px 0 26px; }
.ddc-hero-card { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 16px; padding: 25px 26px; }
.ddc-hero-kicker { font-size: 11px; color: var(--dsw-alias-brand-primary); font-weight: 650; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 8px; }
.ddc-hero h2 { margin: 0 0 8px; font-size: 24px; letter-spacing: -0.025em; font-weight: 680; }
.ddc-hero p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 1.65; max-width: 720px; }
.ddc-hero-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
.ddc-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--dsw-alias-label-primary); cursor: pointer; user-select: none; }
.ddc-toggle input { width: 15px; height: 15px; accent-color: var(--dsw-alias-brand-primary); }
.ddc-hero-hint { font-size: 10.5px; color: var(--dsw-alias-label-secondary); margin-top: 7px; line-height: 1.5; }
.ddc-scope-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-top: 13px; }
.ddc-scope-item {
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); border-radius: 8px;
  padding: 7px 9px; font-size: 11px; color: var(--dsw-alias-label-secondary); display: flex; align-items: center; gap: 6px;
}
.ddc-safety-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 16px; margin-top: 12px; }
.ddc-safety-item { display: flex; align-items: flex-start; gap: 7px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); line-height: 1.5; }
.ddc-safety-item .ddc-icon { color: var(--dsw-alias-state-success-primary); flex: none; margin-top: 1px; }
.ddc-scanning { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 340px; gap: 10px; }
.ddc-spinner {
  width: 38px; height: 38px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);
  border-top-color: var(--dsw-alias-brand-primary); animation: ddc-spin .9s linear infinite;
}
@keyframes ddc-spin { to { transform: rotate(360deg); } }
.ddc-scanning-title { font-size: 17px; font-weight: 650; }
.ddc-scanning-phase { font-size: 12px; color: var(--dsw-alias-brand-primary); }
.ddc-scanning-path {
  max-width: 640px; width: 100%; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px;
  color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; padding: 7px 9px;
}
.ddc-progress { width: min(480px, 92%); height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; margin: 4px 0; }
.ddc-progress-fill { height: 100%; width: 38%; border-radius: inherit; background: var(--dsw-alias-brand-primary); animation: ddc-indeterminate 1.5s ease-in-out infinite; }
@keyframes ddc-indeterminate { 0% { transform: translateX(-120%); } 50% { transform: translateX(140%); } 100% { transform: translateX(320%); } }
.ddc-scanning-stats { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.ddc-scanning-stats strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
.ddc-banner {
  display: flex; align-items: flex-start; gap: 8px; border-radius: 9px; padding: 9px 11px; font-size: 11.5px; line-height: 1.5;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary);
}
.ddc-banner.warn { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-layer-1)); }
.ddc-banner.error { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, var(--dsw-alias-bg-layer-1)); }
.ddc-banner.success { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 28%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, var(--dsw-alias-bg-layer-1)); }
.ddc-overlay {
  position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 68%, transparent); backdrop-filter: blur(4px);
}
.ddc-modal {
  width: 100%; max-height: calc(100vh - 48px); display: flex; flex-direction: column; overflow: hidden;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px;
  box-shadow: 0 22px 70px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);
}
.ddc-modal-head { display: flex; align-items: flex-start; gap: 12px; padding: 17px 19px 13px; border-bottom: 1px solid var(--dsw-alias-border-l1); flex: none; }
.ddc-modal-title { margin: 0; font-size: 16px; font-weight: 660; line-height: 1.35; min-width: 0; }
.ddc-modal-sub { margin: 4px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
.ddc-modal-body { padding: 16px 19px; overflow: auto; min-height: 0; }
.ddc-modal-foot { display: flex; align-items: center; justify-content: space-between; gap: 9px; padding: 12px 19px; border-top: 1px solid var(--dsw-alias-border-l1); flex: none; flex-wrap: wrap; }
.ddc-modal-foot-right { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
.ddc-detail-titleline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.ddc-detail-name { font-size: 17px; font-weight: 660; word-break: break-all; min-width: 0; }
.ddc-detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.ddc-detail-cell { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 8px 10px; min-width: 0; }
.ddc-detail-cell span { display: block; font-size: 10px; color: var(--dsw-alias-label-secondary); margin-bottom: 3px; }
.ddc-detail-cell strong { display: block; font-size: 12px; font-weight: 570; word-break: break-word; }
.ddc-section { margin-top: 15px; }
.ddc-section h4 { margin: 0 0 5px; font-size: 11.5px; font-weight: 650; color: var(--dsw-alias-label-secondary); }
.ddc-section p { margin: 0; font-size: 12px; line-height: 1.68; color: var(--dsw-alias-label-primary); }
.ddc-code {
  display: block; margin-top: 5px; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10.5px; line-height: 1.55; word-break: break-all; white-space: pre-wrap;
}
.ddc-checkline { display: flex; align-items: flex-start; gap: 8px; font-size: 11.5px; line-height: 1.55; color: var(--dsw-alias-label-primary); cursor: pointer; margin: 12px 0; }
.ddc-checkline input { margin-top: 2px; flex: none; accent-color: var(--dsw-alias-brand-primary); width: 15px; height: 15px; }
.ddc-warning-list { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }
.ddc-warning-item { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 8px; padding: 8px 10px; }
.ddc-warning-item code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; color: var(--dsw-alias-label-primary); word-break: break-all; }
.ddc-warning-item p { margin: 3px 0 0; font-size: 10.5px; color: var(--dsw-alias-label-secondary); line-height: 1.45; }
.ddc-skip-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 10px; }
.ddc-skip-cell { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 7px 8px; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.ddc-skip-cell strong { display: block; font-size: 15px; color: var(--dsw-alias-label-primary); font-weight: 620; margin-bottom: 2px; }
.ddc-batch { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 10px; padding: 11px 12px; margin-bottom: 8px; }
.ddc-batch-head { display: flex; align-items: flex-start; gap: 10px; justify-content: space-between; flex-wrap: wrap; }
.ddc-batch-title { font-size: 12.5px; font-weight: 620; }
.ddc-batch-meta { font-size: 10.5px; color: var(--dsw-alias-label-secondary); line-height: 1.55; margin-top: 2px; }
.ddc-batch-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ddc-batch-preview { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; }
.ddc-batch-preview code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ddc-toast {
  position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); z-index: 1200; max-width: min(680px, calc(100vw - 40px));
  padding: 10px 14px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 1.45;
  box-shadow: 0 12px 36px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
}
.ddc-toast.success { border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, var(--dsw-alias-border-l2)); }
.ddc-toast.error { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, var(--dsw-alias-border-l2)); }
.ddc-json-list { margin: 7px 0 0; padding-left: 16px; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
.ddc-json-list li { margin: 3px 0; word-break: break-all; }
.ddc-skeleton { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; }
.ddc-skel { height: 54px; border-radius: 10px; background: linear-gradient(90deg, var(--dsw-alias-bg-layer-1) 20%, var(--dsw-alias-bg-layer-2) 40%, var(--dsw-alias-bg-layer-1) 60%); background-size: 220% 100%; animation: ddc-shimmer 1.4s ease infinite; }
@keyframes ddc-shimmer { to { background-position: -220% 0; } }
.ddc-root button:focus-visible, .ddc-root input:focus-visible, .ddc-root select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
@media (max-width: 1100px) {
  .ddc-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ddc-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ddc-scope-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .ddc-header { padding: 16px 18px 12px; }
  .ddc-body { grid-template-columns: 1fr; overflow: auto; padding: 14px 16px 18px; }
  .ddc-side { overflow: visible; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ddc-main { overflow: visible; }
  .ddc-content { overflow: visible; }
  .ddc-footer { position: sticky; bottom: 0; }
  .ddc-safety-list { grid-template-columns: 1fr; }
  .ddc-skip-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .ddc-side { grid-template-columns: 1fr; }
  .ddc-summary { grid-template-columns: 1fr 1fr; }
  .ddc-row-meta .ddc-age { display: none; }
  .ddc-group-side .ddc-chips { display: none; }
  .ddc-detail-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .ddc-root *, .ddc-root *::before, .ddc-root *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
`

    function tr(t, key, fallback) {
      const value = t(key)
      return value === key ? (fallback || key) : value
    }

    function cx(...parts) {
      return parts.filter(Boolean).join(' ')
    }

    function formatBytes(value) {
      const number = Number(value) || 0
      if (number < 1024) return `${number} B`
      const units = ['KB', 'MB', 'GB', 'TB', 'PB']
      let size = number
      let index = -1
      do {
        size /= 1024
        index += 1
      } while (size >= 1024 && index < units.length - 1)
      return `${size >= 100 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`
    }

    function formatNumber(value) {
      try {
        return new Intl.NumberFormat('en-US').format(Number(value) || 0)
      } catch {
        return String(Number(value) || 0)
      }
    }

    function formatDuration(ms) {
      const seconds = Math.max(0, Math.round((Number(ms) || 0) / 1000))
      if (seconds < 60) return `${seconds}s`
      const minutes = Math.floor(seconds / 60)
      const rest = seconds % 60
      return `${minutes}m ${rest}s`
    }

    function formatDate(value, localeId) {
      if (!value) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      try {
        return new Intl.DateTimeFormat(localeId === 'en' ? 'en-US' : 'zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date)
      } catch {
        return date.toLocaleString()
      }
    }

    function formatAge(item, t) {
      const days = Number(item.ageDays) || 0
      if (days < 1) {
        return `${Math.max(1, Math.round(days * 24))} ${t('hours')}`
      }
      return `${days.toFixed(1)} ${t('days')}`
    }

    function categoryLabel(t, id) {
      return tr(t, `category.${id}`, id)
    }

    function riskLabel(t, risk) {
      return tr(t, `risk.${risk}`, risk)
    }

    function phaseLabel(t, phase) {
      return tr(t, `phase.${phase}`, phase)
    }

    function Icon({ name, size = 18, className = '' }) {
      const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        className: cx('ddc-icon', className),
      }
      if (name === 'search') return h('svg', common, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'm20 20-3.2-3.2' }))
      if (name === 'close') return h('svg', common, h('path', { d: 'M6 6l12 12M18 6 6 18' }))
      if (name === 'chevron') return h('svg', common, h('path', { d: 'm9 6 6 6-6 6' }))
      if (name === 'refresh') return h('svg', common, h('path', { d: 'M20 11a8.1 8.1 0 0 0-14.5-4.8L4 8' }), h('path', { d: 'M4 4v4h4M4 13a8.1 8.1 0 0 0 14.5 4.8L20 16' }), h('path', { d: 'M20 20v-4h-4' }))
      if (name === 'shield') return h('svg', common, h('path', { d: 'M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z' }), h('path', { d: 'm9 12 2 2 4-4' }))
      if (name === 'trash') return h('svg', common, h('path', { d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5' }))
      if (name === 'restore') return h('svg', common, h('path', { d: 'M4 4v6h6M4 10a8 8 0 1 1 2 8' }))
      if (name === 'info') return h('svg', common, h('circle', { cx: 12, cy: 12, r: 9 }), h('path', { d: 'M12 11v5M12 8h.01' }))
      if (name === 'check') return h('svg', common, h('path', { d: 'm5 12 4.5 4.5L19 7' }))
      if (name === 'alert') return h('svg', common, h('path', { d: 'M12 3 2.5 20h19L12 3Z' }), h('path', { d: 'M12 9v5M12 17h.01' }))
      if (name === 'disk') return h('svg', common, h('path', { d: 'M4 6.5A8 4 0 0 1 20 6.5v11a8 4 0 0 1-16 0v-11Z' }), h('path', { d: 'M4 11.5a8 4 0 0 0 16 0' }), h('circle', { cx: 12, cy: 12, r: 1.3 }), h('path', { d: 'm18 3 .8 1.8L21 5.5l-2.2.8L18 8l-.8-1.7L15 5.5l2.2-.7L18 3Z' }))
      if (name === 'folder') return h('svg', common, h('path', { d: 'M3 6.5h6l2 2h10v10.5H3V6.5Z' }))
      if (name === 'spark') return h('svg', common, h('path', { d: 'm12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z' }), h('path', { d: 'm18.5 16 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z' }))
      return h('svg', common, h('circle', { cx: 12, cy: 12, r: 8 }))
    }

    function Checkbox({ checked, indeterminate, onChange, disabled, label }) {
      const ref = React.useRef(null)
      React.useEffect(() => {
        if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
      }, [indeterminate, checked])
      return h('input', {
        ref,
        type: 'checkbox',
        className: 'ddc-check',
        checked: Boolean(checked),
        disabled: Boolean(disabled),
        'aria-label': label,
        onChange: (event) => onChange(event.target.checked),
      })
    }

    function useLocaleSnapshot(locale) {
      const [snapshot, setSnapshot] = React.useState(() => locale.getSnapshot())
      React.useEffect(() => {
        const update = () => setSnapshot(locale.getSnapshot())
        update()
        return locale.subscribe(update)
      }, [locale])
      return snapshot
    }

    function makeApi() {
      let token = null
      let handshake = null

      async function getToken() {
        if (token) return token
        if (!handshake) {
          handshake = fetch(`${API_ROOT}/handshake`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
          })
            .then(async (response) => {
              if (!response.ok) throw new Error(`本机服务握手失败 (${response.status})`)
              const payload = await response.json()
              if (!payload || typeof payload.token !== 'string') throw new Error('本机服务握手响应无效')
              token = payload.token
              return token
            })
            .finally(() => {
              handshake = null
            })
        }
        return handshake
      }

      async function request(path, options = {}) {
        const attempt = async (retry) => {
          const current = await getToken()
          const headers = { 'x-dsh-disk-cleanup-token': current }
          const init = {
            method: options.method || 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers,
            signal: options.signal,
          }
          if (options.body !== undefined) {
            headers['content-type'] = 'application/json'
            init.body = JSON.stringify(options.body)
          }
          const response = await fetch(`${API_ROOT}${path}`, init)
          let payload = null
          try {
            payload = await response.json()
          } catch {
            payload = null
          }
          if (response.status === 401 && retry) {
            token = null
            return attempt(false)
          }
          if (!response.ok) {
            const message = payload?.error?.message || `请求失败 (${response.status})`
            const error = new Error(message)
            error.code = payload?.error?.code || `HTTP_${response.status}`
            error.payload = payload
            throw error
          }
          return payload
        }
        return attempt(true)
      }

      return {
        getState: () => request('/state'),
        getLastScan: () => request('/last-scan'),
        startScan: (body) => request('/scan', { method: 'POST', body }),
        getScanStatus: (id, options = {}) => request(`/scans/${encodeURIComponent(id)}/status`, options),
        getScan: (id, options = {}) => request(`/scans/${encodeURIComponent(id)}`, options),
        cancelScan: (id) => request(`/scans/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: {} }),
        cleanup: (body) => request('/cleanup', { method: 'POST', body }),
        listQuarantine: () => request('/quarantine'),
        restoreBatch: (id) => request(`/quarantine/${encodeURIComponent(id)}/restore`, { method: 'POST', body: { confirm: true } }),
        purgeBatch: (id) => request(`/quarantine/${encodeURIComponent(id)}/purge`, { method: 'POST', body: { confirm: 'PURGE' } }),
      }
    }

    function deriveGroups(items) {
      const map = new Map()
      for (const item of items) {
        const id = item.groupId || `${item.categoryId}::${item.app}`
        let group = map.get(id)
        if (!group) {
          group = {
            id,
            categoryId: item.categoryId,
            app: item.app || '—',
            items: [],
            count: 0,
            bytes: 0,
            safe: 0,
            caution: 0,
            review: 0,
            cleanable: 0,
          }
          map.set(id, group)
        }
        group.items.push(item)
        group.count += 1
        group.bytes += item.size
        group[item.risk] = (group[item.risk] || 0) + 1
        if (item.cleanable) group.cleanable += 1
      }
      return [...map.values()].sort((left, right) => {
        const a = CATEGORY_ORDER.indexOf(left.categoryId)
        const b = CATEGORY_ORDER.indexOf(right.categoryId)
        if (a !== b) return (a < 0 ? 99 : a) - (b < 0 ? 99 : b)
        return right.bytes - left.bytes
      })
    }

    function deriveCategories(items) {
      const map = new Map()
      for (const item of items) {
        let category = map.get(item.categoryId)
        if (!category) {
          category = { id: item.categoryId, count: 0, bytes: 0 }
          map.set(item.categoryId, category)
        }
        category.count += 1
        category.bytes += item.size
      }
      return [...map.values()].sort((left, right) => {
        const a = CATEGORY_ORDER.indexOf(left.id)
        const b = CATEGORY_ORDER.indexOf(right.id)
        return (a < 0 ? 99 : a) - (b < 0 ? 99 : b)
      })
    }

    function Modal({ title, subtitle, children, footer, onClose, width = 760 }) {
      const panelRef = React.useRef(null)
      const closeRef = React.useRef(onClose)
      closeRef.current = onClose
      React.useEffect(() => {
        const previous = document.activeElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const panel = panelRef.current
        const focusableSelector =
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        const first = panel?.querySelector(focusableSelector)
        if (first) first.focus()
        else panel?.focus()
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeRef.current?.()
            return
          }
          if (event.key !== 'Tab' || !panel) return
          const focusables = [...panel.querySelectorAll(focusableSelector)]
          if (focusables.length === 0) {
            event.preventDefault()
            panel.focus()
            return
          }
          const firstEl = focusables[0]
          const lastEl = focusables[focusables.length - 1]
          if (event.shiftKey && document.activeElement === firstEl) {
            event.preventDefault()
            lastEl.focus()
          } else if (!event.shiftKey && document.activeElement === lastEl) {
            event.preventDefault()
            firstEl.focus()
          }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => {
          document.removeEventListener('keydown', onKeyDown)
          document.body.style.overflow = previousOverflow
          if (previous && typeof previous.focus === 'function') previous.focus()
        }
      }, [])
      return h(
        'div',
        {
          className: 'ddc-overlay',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose?.()
          },
        },
        h(
          'div',
          {
            className: 'ddc-modal',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
            ref: panelRef,
            tabIndex: -1,
            style: { maxWidth: `${width}px` },
          },
          h(
            'div',
            { className: 'ddc-modal-head' },
            h('div', { style: { flex: 1, minWidth: 0 } }, h('h3', { className: 'ddc-modal-title' }, title), subtitle ? h('p', { className: 'ddc-modal-sub' }, subtitle) : null),
            h(
              'button',
              { type: 'button', className: 'ddc-iconbtn', onClick: onClose, 'aria-label': 'close' },
              h(Icon, { name: 'close', size: 16 }),
            ),
          ),
          h('div', { className: 'ddc-modal-body' }, children),
          footer ? h('div', { className: 'ddc-modal-foot' }, footer) : null,
        ),
      )
    }

    function createPage(ctx, t) {
      const api = makeApi()

      function DiskDoctorPage() {
        const localeSnapshot = useLocaleSnapshot(ctx.locale)
        const localeId = localeSnapshot.active
        const [booting, setBooting] = React.useState(true)
        const [info, setInfo] = React.useState(null)
        const [scan, setScan] = React.useState(null)
        const [job, setJob] = React.useState(null)
        const [error, setError] = React.useState(null)
        const [selected, setSelected] = React.useState(() => new Set())
        const [activeCategory, setActiveCategory] = React.useState('all')
        const [search, setSearch] = React.useState('')
        const [riskFilter, setRiskFilter] = React.useState('all')
        const [expanded, setExpanded] = React.useState(() => new Set())
        const [groupLimits, setGroupLimits] = React.useState({})
        const [detail, setDetail] = React.useState(null)
        const [cleanupOpen, setCleanupOpen] = React.useState(false)
        const [cleanupConfirmed, setCleanupConfirmed] = React.useState(false)
        const [quarantineOpen, setQuarantineOpen] = React.useState(false)
        const [quarantine, setQuarantine] = React.useState({ batches: [], summary: { batches: 0, count: 0, bytes: 0 } })
        const [reportOpen, setReportOpen] = React.useState(false)
        const [result, setResult] = React.useState(null)
        const [toast, setToast] = React.useState(null)
        const [busy, setBusy] = React.useState(false)
        const [busyBatch, setBusyBatch] = React.useState(null)
        const [pendingPurge, setPendingPurge] = React.useState(null)
        const [purgeChecked, setPurgeChecked] = React.useState(false)
        const [deep, setDeep] = React.useState(true)
        const mountedRef = React.useRef(true)
        const pollRef = React.useRef(null)
        const abortRef = React.useRef(null)
        const toastRef = React.useRef(null)
        const pollScanRef = React.useRef(null)

        const notify = (kind, text) => {
          if (!mountedRef.current) return
          setToast({ kind, text })
          if (toastRef.current) clearTimeout(toastRef.current)
          toastRef.current = setTimeout(() => {
            if (mountedRef.current) setToast(null)
          }, 5000)
        }

        const refreshInfo = async () => {
          try {
            const next = await api.getState()
            if (!mountedRef.current) return
            setInfo(next)
            if (next.quarantine) {
              setQuarantine((previous) => ({ ...previous, summary: next.quarantine }))
            }
          } catch {
            // A transient refresh failure must not replace the visible result.
          }
        }

        const loadQuarantine = async () => {
          try {
            const next = await api.listQuarantine()
            if (!mountedRef.current) return next
            setQuarantine(next)
            return next
          } catch (cause) {
            if (mountedRef.current) notify('error', cause.message || t('errorTitle'))
            return null
          }
        }

        pollScanRef.current = async (scanId) => {
          if (!mountedRef.current) return
          if (pollRef.current) clearTimeout(pollRef.current)
          if (abortRef.current) abortRef.current.abort()
          const controller = new AbortController()
          abortRef.current = controller
          try {
            const status = await api.getScanStatus(scanId, { signal: controller.signal })
            if (!mountedRef.current) return
            if (status.status === 'running') {
              setJob(status)
              pollRef.current = setTimeout(() => pollScanRef.current?.(scanId), 700)
              return
            }
            if (status.status === 'done') {
              setJob({ ...status, status: 'running', progress: { ...(status.progress || {}), phase: 'finalizing' } })
              const full = await api.getScan(scanId, { signal: controller.signal })
              if (!mountedRef.current) return
              if (!full?.scan) throw new Error(t('errorTitle'))
              setJob(null)
              setScan(full.scan)
              setSelected(new Set())
              setActiveCategory('all')
              setSearch('')
              setRiskFilter('all')
              setGroupLimits({})
              setInfo((previous) =>
                previous
                  ? {
                      ...previous,
                      lastScan: {
                        scanId: full.scan.scanId,
                        startedAt: full.scan.startedAt,
                        finishedAt: full.scan.finishedAt,
                        elapsedMs: full.scan.elapsedMs,
                        totals: full.scan.totals,
                        categories: full.scan.categories,
                        volume: full.scan.volume,
                        coverage: full.scan.coverage,
                        warnings: full.scan.warningCount,
                        skipped: full.scan.skipped,
                        platform: full.scan.platform,
                      },
                    }
                  : previous,
              )
              notify('success', t('scanDone'))
              refreshInfo()
              return
            }
            setJob(null)
            if (status.status === 'cancelled') notify('info', t('scanCancelled'))
            else setError(status.error?.message || t('errorTitle'))
          } catch (cause) {
            if (cause?.name === 'AbortError') return
            if (!mountedRef.current) return
            setJob(null)
            setError(cause.message || t('connectionError'))
          }
        }

        React.useEffect(() => {
          mountedRef.current = true
          let cancelled = false
          const bootstrap = async () => {
            try {
              const nextInfo = await api.getState()
              if (cancelled) return
              setInfo(nextInfo)
              if (nextInfo.quarantine) {
                setQuarantine((previous) => ({ ...previous, summary: nextInfo.quarantine }))
              }
              if (nextInfo.activeScan?.status === 'running') {
                setJob(nextInfo.activeScan)
                setBooting(false)
                pollScanRef.current?.(nextInfo.activeScan.id)
              } else if (nextInfo.lastScan?.scanId) {
                try {
                  const full = await api.getScan(nextInfo.lastScan.scanId)
                  if (!cancelled && full?.scan) setScan(full.scan)
                } catch (cause) {
                  if (!cancelled) setError(cause.message || t('errorTitle'))
                }
                if (!cancelled) setBooting(false)
              } else {
                setBooting(false)
              }
              loadQuarantine()
            } catch (cause) {
              if (!cancelled) {
                setError(cause.message || t('connectionError'))
                setBooting(false)
              }
            }
          }
          bootstrap()
          return () => {
            cancelled = true
            mountedRef.current = false
            if (pollRef.current) clearTimeout(pollRef.current)
            if (abortRef.current) abortRef.current.abort()
            if (toastRef.current) clearTimeout(toastRef.current)
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])

        const items = scan?.items || []
        const categories = React.useMemo(() => deriveCategories(items), [items])
        const groups = React.useMemo(() => deriveGroups(items), [items])
        const totals = React.useMemo(
          () => ({
            count: items.length,
            bytes: items.reduce((sum, item) => sum + item.size, 0),
            safeBytes: items.filter((item) => item.risk === 'safe').reduce((sum, item) => sum + item.size, 0),
            reviewBytes: items.filter((item) => item.risk === 'review').reduce((sum, item) => sum + item.size, 0),
            cleanableCount: items.filter((item) => item.cleanable).length,
            cleanableBytes: items.filter((item) => item.cleanable).reduce((sum, item) => sum + item.size, 0),
          }),
          [items],
        )
        const selectedItems = React.useMemo(() => items.filter((item) => selected.has(item.id)), [items, selected])
        const selectedBytes = selectedItems.reduce((sum, item) => sum + item.size, 0)
        const hasRiskySelection = selectedItems.some((item) => item.risk !== 'safe')
        const hasProtectedSelection = selectedItems.some((item) => item.protected)
        const hasFailures = Boolean(error)

        React.useEffect(() => {
          if (!scan) {
            setExpanded(new Set())
            return
          }
          const top = groups.slice().sort((left, right) => right.bytes - left.bytes).slice(0, 4).map((group) => group.id)
          setExpanded(new Set(top))
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [scan?.scanId])

        const filteredItems = React.useMemo(() => {
          const query = search.trim().toLowerCase()
          return items.filter((item) => {
            if (activeCategory !== 'all' && item.categoryId !== activeCategory) return false
            if (riskFilter !== 'all' && item.risk !== riskFilter) return false
            if (!query) return true
            return (
              item.name.toLowerCase().includes(query) ||
              item.path.toLowerCase().includes(query) ||
              item.purpose.toLowerCase().includes(query) ||
              item.app.toLowerCase().includes(query)
            )
          })
        }, [items, activeCategory, riskFilter, search])

        const filteredGroups = React.useMemo(() => {
          const byGroup = new Map()
          for (const item of filteredItems) {
            const id = item.groupId || `${item.categoryId}::${item.app}`
            if (!byGroup.has(id)) byGroup.set(id, [])
            byGroup.get(id).push(item)
          }
          return groups
            .filter((group) => byGroup.has(group.id))
            .map((group) => {
              const groupItems = byGroup.get(group.id)
              return {
                ...group,
                items: groupItems,
                count: groupItems.length,
                bytes: groupItems.reduce((sum, item) => sum + item.size, 0),
                safe: groupItems.filter((item) => item.risk === 'safe').length,
                caution: groupItems.filter((item) => item.risk === 'caution').length,
                review: groupItems.filter((item) => item.risk === 'review').length,
                cleanable: groupItems.filter((item) => item.cleanable).length,
                visible:
                  activeCategory !== 'all' || riskFilter !== 'all' || Boolean(search.trim())
                    ? true
                    : expanded.has(group.id),
              }
            })
        }, [groups, filteredItems, expanded, activeCategory, riskFilter, search])

        const selectSafe = () => {
          const next = new Set(selected)
          for (const item of items) {
            if (item.cleanable && item.risk === 'safe') next.add(item.id)
          }
          setSelected(next)
        }

        const toggleItem = (id, checked) => {
          const next = new Set(selected)
          if (checked) next.add(id)
          else next.delete(id)
          setSelected(next)
        }

        const groupSelection = (group) => {
          const selectable = group.items.filter((item) => item.cleanable)
          if (selectable.length === 0) return { all: false, some: false }
          const count = selectable.filter((item) => selected.has(item.id)).length
          return { all: count === selectable.length, some: count > 0 && count < selectable.length }
        }

        const toggleGroup = (group, checked) => {
          const next = new Set(selected)
          for (const item of group.items) {
            if (!item.cleanable) continue
            if (checked) next.add(item.id)
            else next.delete(item.id)
          }
          setSelected(next)
        }

        const startScan = async () => {
          if (pollRef.current) clearTimeout(pollRef.current)
          if (abortRef.current) abortRef.current.abort()
          setError(null)
          setScan(null)
          setSelected(new Set())
          setDetail(null)
          setCleanupOpen(false)
          setJob({
            id: 'pending',
            status: 'running',
            progress: { phase: 'preparing', filesSeen: 0, dirsSeen: 0, candidates: 0, candidateBytes: 0, currentPath: '', elapsedMs: 0 },
          })
          try {
            const started = await api.startScan({ deep })
            setJob(started.job)
            pollScanRef.current?.(started.scanId)
          } catch (cause) {
            setJob(null)
            setError(cause.message || t('errorTitle'))
          }
        }

        const cancelScan = async () => {
          if (!job?.id || job.id === 'pending') return
          try {
            await api.cancelScan(job.id)
            setJob((previous) => (previous ? { ...previous, cancelling: true } : previous))
            notify('info', t('scanCancelled'))
          } catch (cause) {
            notify('error', cause.message || t('errorTitle'))
          }
        }

        const openCleanup = () => {
          if (selectedItems.length === 0) {
            notify('info', t('noSelection'))
            return
          }
          setCleanupConfirmed(false)
          setCleanupOpen(true)
        }

        const confirmCleanup = async () => {
          if (!scan || busy || !cleanupConfirmed) return
          setBusy(true)
          try {
            const response = await api.cleanup({
              scanId: scan.scanId,
              itemIds: selectedItems.map((item) => item.id),
              acknowledgeRisky: true,
              acknowledgeProtected: true,
              confirm: true,
            })
            const cleanedIds = new Set(response.result.cleanedIds)
            setScan((previous) =>
              previous
                ? {
                    ...previous,
                    items: previous.items.filter((item) => !cleanedIds.has(item.id)),
                  }
                : previous,
            )
            setSelected(new Set())
            setCleanupOpen(false)
            setCleanupConfirmed(false)
            if (response.quarantine) {
              setQuarantine((previous) => ({ ...previous, summary: response.quarantine }))
              setInfo((previous) => (previous ? { ...previous, quarantine: response.quarantine, lastScan: response.scan || previous.lastScan } : previous))
            }
            if (response.result.failures.length > 0) {
              setResult({ kind: 'cleanup', result: response.result })
              notify('info', t('cleanupPartial'))
            } else {
              notify(
                'success',
                `${t('cleanupDone')} · ${formatNumber(response.result.cleanedCount)} ${t('items')} · ${formatBytes(response.result.cleanedBytes)}`,
              )
            }
            loadQuarantine()
            refreshInfo()
          } catch (cause) {
            notify('error', cause.message || t('errorTitle'))
          } finally {
            setBusy(false)
          }
        }

        const openQuarantine = () => {
          setQuarantineOpen(true)
          loadQuarantine()
        }

        const handleRestore = async (batch) => {
          if (busyBatch) return
          setBusyBatch(batch.id)
          try {
            const response = await api.restoreBatch(batch.id)
            if (response.result.failures?.length > 0) {
              setResult({ kind: 'restore', result: response.result })
            } else {
              notify(
                'success',
                `${t('quarantine.restoreDone')} · ${formatNumber(response.result.restoredCount)} ${t('items')}`,
              )
            }
            if (response.quarantine) {
              setQuarantine((previous) => ({ ...previous, summary: response.quarantine }))
              setInfo((previous) => (previous ? { ...previous, quarantine: response.quarantine } : previous))
            }
            await loadQuarantine()
          } catch (cause) {
            notify('error', cause.message || t('errorTitle'))
          } finally {
            setBusyBatch(null)
          }
        }

        const requestPurge = (batch) => {
          setPurgeChecked(false)
          setPendingPurge(batch)
        }

        const confirmPurge = async () => {
          if (!pendingPurge || !purgeChecked || busyBatch) return
          setBusyBatch(pendingPurge.id)
          try {
            const response = await api.purgeBatch(pendingPurge.id)
            setPendingPurge(null)
            setPurgeChecked(false)
            if (response.quarantine) {
              setQuarantine((previous) => ({ ...previous, summary: response.quarantine }))
              setInfo((previous) => (previous ? { ...previous, quarantine: response.quarantine } : previous))
            }
            notify(
              'success',
              `${t('purged')} · ${formatNumber(response.result.purgedCount)} ${t('items')} · ${formatBytes(response.result.purgedBytes)}`,
            )
            await loadQuarantine()
            refreshInfo()
          } catch (cause) {
            notify('error', cause.message || t('errorTitle'))
          } finally {
            setBusyBatch(null)
          }
        }

        const riskCount = (group, risk) => Number(group[risk] || 0)
        const summary = info?.volume || null
        const quarantineCount = Number(quarantine?.summary?.count || 0)
        const quarantineBytes = Number(quarantine?.summary?.bytes || 0)
        const volumePercent = summary && summary.total > 0 ? Math.min(100, Math.max(0, summary.percentUsed || Math.round((summary.used / summary.total) * 100))) : 0
        const appDataTop = (scan?.appDataOverview || []).slice(0, 6)
        const maxAppData = appDataTop.length > 0 ? Math.max(...appDataTop.map((entry) => Number(entry.bytes) || 0)) : 0

        const selectedRiskNote = hasRiskySelection ? t('selectionRiskNote') : ''
        const headerActions = []
        if (job?.status === 'running') {
          headerActions.push(
            h(
              'button',
              { type: 'button', className: 'ddc-btn', onClick: cancelScan, disabled: Boolean(job.cancelling) },
              job.cancelling ? t('working') : t('cancelScan'),
            ),
          )
        } else if (scan) {
          headerActions.push(
            h('button', { type: 'button', className: 'ddc-btn', onClick: startScan }, h(Icon, { name: 'refresh', size: 15 }), t('rescan')),
          )
        }
        headerActions.push(
          h(
            'button',
            { type: 'button', className: 'ddc-btn', onClick: openQuarantine },
            h(Icon, { name: 'shield', size: 15 }),
            t('quarantineBtn'),
            quarantineCount > 0 ? h('span', { className: 'ddc-count-badge' }, formatNumber(quarantineCount)) : null,
          ),
        )

        const header = h(
          'header',
          { className: 'ddc-header' },
          h('div', { className: 'ddc-mark' }, h(Icon, { name: 'disk', size: 26 })),
          h(
            'div',
            { className: 'ddc-heading' },
            h('h1', { className: 'ddc-title' }, t('title')),
            h('p', { className: 'ddc-subtitle' }, t('subtitle')),
          ),
          h('div', { className: 'ddc-header-actions' }, ...headerActions),
        )

        const sidebar = h(
          'aside',
          { className: 'ddc-side' },
          h(
            'div',
            { className: 'ddc-card' },
            h('p', { className: 'ddc-card-title' }, t('sumFree')),
            h(
              'div',
              { className: 'ddc-volume-top' },
              h('span', { className: 'ddc-volume-value' }, summary ? formatBytes(summary.free) : '—'),
              summary ? h('span', { className: 'ddc-volume-sub' }, `${summary.percentUsed || volumePercent}% ${t('used')}`) : null,
            ),
            h('div', { className: 'ddc-meter' }, h('div', { className: 'ddc-meter-fill', style: { width: `${volumePercent}%` } })),
            summary
              ? h(
                  React.Fragment,
                  null,
                  h('div', { className: 'ddc-kv' }, h('span', null, t('total')), h('strong', null, formatBytes(summary.total))),
                  h('div', { className: 'ddc-kv' }, h('span', null, t('used')), h('strong', null, formatBytes(summary.used))),
                  h('div', { className: 'ddc-kv' }, h('span', null, t('storageNote')), h('strong', null, formatBytes(quarantineBytes))),
                )
              : null,
          ),
          scan
            ? h(
                'div',
                { className: 'ddc-card' },
                h('p', { className: 'ddc-card-title' }, t('categoryTitle')),
                h(
                  'div',
                  { className: 'ddc-nav' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: cx('ddc-navrow', activeCategory === 'all' && 'active'),
                      onClick: () => setActiveCategory('all'),
                    },
                    h('span', { className: 'ddc-navdot' }),
                    h('span', { className: 'ddc-navlabel' }, t('all')),
                    h('span', { className: 'ddc-navmeta' }, `${formatNumber(totals.count)} · ${formatBytes(totals.bytes)}`),
                  ),
                  categories.map((category) =>
                    h(
                      'button',
                      {
                        key: category.id,
                        type: 'button',
                        className: cx('ddc-navrow', activeCategory === category.id && 'active'),
                        onClick: () => setActiveCategory(category.id),
                      },
                      h('span', { className: 'ddc-navdot' }),
                      h('span', { className: 'ddc-navlabel' }, categoryLabel(t, category.id)),
                      h('span', { className: 'ddc-navmeta' }, `${formatNumber(category.count)} · ${formatBytes(category.bytes)}`),
                    ),
                  ),
                ),
              )
            : null,
          scan && appDataTop.length > 0
            ? h(
                'div',
                { className: 'ddc-card' },
                h('p', { className: 'ddc-card-title' }, t('appDataTitle')),
                appDataTop.map((entry) =>
                  h(
                    'div',
                    { className: 'ddc-app-row', key: `${entry.root}:${entry.label}`, title: entry.path },
                    h(
                      'div',
                      { className: 'ddc-app-top' },
                      h('span', null, `${entry.root} / ${entry.label}`),
                      h('span', null, formatBytes(entry.bytes)),
                    ),
                    h(
                      'div',
                      { className: 'ddc-app-bar' },
                      h('div', {
                        className: 'ddc-app-fill',
                        style: { width: `${maxAppData > 0 ? Math.max(2, (Number(entry.bytes) / maxAppData) * 100) : 0}%` },
                      }),
                    ),
                  ),
                ),
                h('p', { className: 'ddc-hint' }, t('appDataHint')),
              )
            : null,
          h(
            'div',
            { className: 'ddc-card' },
            h('p', { className: 'ddc-card-title' }, t('report.title')),
            h(
              'div',
              { className: 'ddc-side-actions' },
              h(
                'button',
                { type: 'button', className: 'ddc-side-link', onClick: () => setReportOpen(true), disabled: !scan },
                h('span', null, t('viewReport')),
                h('span', { className: 'ddc-navmeta' }, scan ? formatNumber(scan.warningCount || 0) : '—'),
              ),
              h(
                'button',
                { type: 'button', className: 'ddc-side-link', onClick: openQuarantine },
                h('span', null, t('openQuarantine')),
                h('span', { className: 'ddc-navmeta' }, formatNumber(quarantineCount)),
              ),
            ),
            h('p', { className: 'ddc-hint' }, t('localOnly')),
          ),
        )

        const summaryCards = h(
          'div',
          { className: 'ddc-summary' },
          h(
            'div',
            { className: 'ddc-stat' },
            h('div', { className: 'ddc-stat-label' }, t('sumCandidates')),
            h('div', { className: 'ddc-stat-value' }, formatNumber(totals.count)),
            h('div', { className: 'ddc-stat-sub' }, formatBytes(totals.bytes)),
          ),
          h(
            'div',
            { className: 'ddc-stat' },
            h('div', { className: 'ddc-stat-label' }, t('sumSafe')),
            h('div', { className: 'ddc-stat-value' }, formatBytes(totals.safeBytes)),
            h('div', { className: 'ddc-stat-sub' }, `${formatNumber(items.filter((item) => item.risk === 'safe').length)} ${t('files')}`),
          ),
          h(
            'div',
            { className: 'ddc-stat' },
            h('div', { className: 'ddc-stat-label' }, t('sumReview')),
            h('div', { className: 'ddc-stat-value' }, formatBytes(totals.reviewBytes)),
            h('div', { className: 'ddc-stat-sub' }, `${formatNumber(items.filter((item) => item.risk === 'review').length)} ${t('files')}`),
          ),
          h(
            'div',
            { className: 'ddc-stat' },
            h('div', { className: 'ddc-stat-label' }, t('sumFree')),
            h('div', { className: 'ddc-stat-value' }, summary ? formatBytes(summary.free) : '—'),
            h('div', { className: 'ddc-stat-sub' }, summary ? `${volumePercent}% ${t('used')}` : t('localOnly')),
          ),
        )

        const scanLine = scan
          ? h(
              'div',
              { className: 'ddc-scanline' },
              h('span', null, h('strong', null, t('scannedAt'))),
              h('span', null, formatDate(scan.finishedAt, localeId)),
              h('span', null, `${t('elapsed')} ${formatDuration(scan.elapsedMs)}`),
              h('span', null, `${t('filesSeen')} ${formatNumber(scan.coverage?.filesSeen || 0)}`),
              scan.warningCount > 0 ? h('span', { className: 'ddc-warn-text' }, `${t('warnings')} ${formatNumber(scan.warningCount)}`) : null,
              scan.coverage?.partial
                ? h('button', { type: 'button', onClick: () => setReportOpen(true) }, `${t('partial')} · ${t('viewReport')}`)
                : null,
              h('button', { type: 'button', onClick: () => setReportOpen(true) }, t('viewReport')),
            )
          : null

        const renderRow = (item) => {
          const isSelected = selected.has(item.id)
          return h(
            'div',
            { className: 'ddc-row', key: item.id },
            h(Checkbox, {
              checked: isSelected,
              onChange: (checked) => toggleItem(item.id, checked),
              disabled: !item.cleanable,
              label: item.cleanable ? item.name : t('infoOnly'),
            }),
            h(
              'div',
              { className: 'ddc-row-main' },
              h(
                'div',
                { className: 'ddc-file-line' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ddc-file-name',
                    title: item.path,
                    onClick: () => setDetail(item),
                  },
                  item.name,
                ),
                item.protected ? h('span', { className: 'ddc-badge muted' }, t('protected')) : null,
                item.requiresAdmin ? h('span', { className: 'ddc-badge muted' }, t('admin')) : null,
              ),
              h('div', { className: 'ddc-file-purpose', title: item.purpose }, item.purpose),
            ),
            h(
              'div',
              { className: 'ddc-row-meta' },
              h('span', { className: 'ddc-size' }, formatBytes(item.size)),
              h('span', { className: 'ddc-age' }, formatAge(item, t)),
              h('span', { className: `ddc-badge ${item.risk}` }, riskLabel(t, item.risk)),
              h(
                'button',
                {
                  type: 'button',
                  className: 'ddc-iconbtn ddc-info-btn',
                  onClick: () => setDetail(item),
                  'aria-label': t('details'),
                  title: t('details'),
                },
                h(Icon, { name: 'info', size: 15 }),
              ),
            ),
          )
        }

        const renderGroup = (group) => {
          const selection = groupSelection(group)
          const limit = groupLimits[group.id] || (search.trim() ? 200 : 40)
          const shown = group.items.slice(0, limit)
          const isOpen = group.visible
          return h(
            'section',
            { className: 'ddc-group', key: group.id },
            h(
              'div',
              { className: 'ddc-group-head' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'ddc-iconbtn',
                  onClick: () => {
                    const next = new Set(expanded)
                    if (next.has(group.id)) next.delete(group.id)
                    else next.add(group.id)
                    setExpanded(next)
                  },
                  'aria-expanded': isOpen,
                  'aria-label': group.app,
                },
                h(Icon, { name: 'chevron', size: 14, className: cx('ddc-chevron', isOpen && 'open') }),
              ),
              h(Checkbox, {
                checked: selection.all,
                indeterminate: selection.some,
                onChange: (checked) => toggleGroup(group, checked),
                disabled: group.cleanable === 0,
                label: group.app,
              }),
              h(
                'div',
                { className: 'ddc-group-title' },
                h('span', { className: 'ddc-group-name' }, group.app),
                h('span', { className: 'ddc-group-count' }, `${formatNumber(group.count)} ${t('files')}`),
              ),
              h(
                'div',
                { className: 'ddc-group-side' },
                h(
                  'div',
                  { className: 'ddc-chips' },
                  riskCount(group, 'safe') > 0 ? h('span', { className: 'ddc-chip safe' }, `${t('risk.safe')} ${riskCount(group, 'safe')}`) : null,
                  riskCount(group, 'caution') > 0 ? h('span', { className: 'ddc-chip caution' }, `${t('risk.caution')} ${riskCount(group, 'caution')}`) : null,
                  riskCount(group, 'review') > 0 ? h('span', { className: 'ddc-chip review' }, `${t('risk.review')} ${riskCount(group, 'review')}`) : null,
                ),
                h('span', { className: 'ddc-group-bytes' }, formatBytes(group.bytes)),
              ),
            ),
            isOpen
              ? h(
                  'div',
                  { className: 'ddc-rows' },
                  shown.map(renderRow),
                  group.items.length > limit
                    ? h(
                        'div',
                        { className: 'ddc-more' },
                        h(
                          'button',
                          {
                            type: 'button',
                            onClick: () =>
                              setGroupLimits((previous) => ({
                                ...previous,
                                [group.id]: Math.min(group.items.length, limit + 120),
                              })),
                          },
                          `${t('showMore')} (${formatNumber(group.items.length - limit)})`,
                        ),
                      )
                    : null,
                )
              : null,
          )
        }

        const results = []
        if (scan) {
          results.push(summaryCards, scanLine)
          if (scan.coverage?.partial) {
            results.push(
              h(
                'div',
                { className: 'ddc-banner warn' },
                h(Icon, { name: 'alert', size: 15 }),
                h('span', null, h('strong', null, `${t('partial')}. `), t('partialHint')),
              ),
            )
          }
          results.push(
            h(
              'div',
              { className: 'ddc-toolbar' },
              h(
                'div',
                { className: 'ddc-search-wrap' },
                h(Icon, { name: 'search', size: 14 }),
                h('input', {
                  className: 'ddc-input',
                  type: 'search',
                  value: search,
                  placeholder: t('search'),
                  'aria-label': t('search'),
                  onChange: (event) => setSearch(event.target.value),
                }),
              ),
              h(
                'select',
                {
                  className: 'ddc-select',
                  value: riskFilter,
                  'aria-label': t('riskFiltered'),
                  onChange: (event) => setRiskFilter(event.target.value),
                },
                h('option', { value: 'all' }, t('filterAll')),
                h('option', { value: 'safe' }, t('filterSafe')),
                h('option', { value: 'caution' }, t('filterCaution')),
                h('option', { value: 'review' }, t('filterReview')),
              ),
              h(
                'div',
                { className: 'ddc-toolbar-end' },
                h('button', { type: 'button', className: 'ddc-btn', onClick: selectSafe, disabled: totals.cleanableCount === 0 }, t('selectSafe')),
                h('button', { type: 'button', className: 'ddc-btn ddc-btn-quiet', onClick: () => setSelected(new Set()), disabled: selected.size === 0 }, t('clear')),
              ),
            ),
          )
          if (search.trim() || riskFilter !== 'all' || activeCategory !== 'all') {
            results.push(
              h(
                'div',
                { className: 'ddc-scanline' },
                h('span', null, `${formatNumber(filteredItems.length)} ${t('files')}`),
                h(
                  'button',
                  {
                    type: 'button',
                    onClick: () => {
                      setSearch('')
                      setRiskFilter('all')
                      setActiveCategory('all')
                    },
                  },
                  t('clearFilters'),
                ),
              ),
            )
          }
          if (filteredItems.length === 0) {
            results.push(h('div', { className: 'ddc-empty' }, h('strong', null, items.length === 0 ? t('emptyScan') : t('noResults'))))
          } else {
            results.push(h('div', null, filteredGroups.map(renderGroup)))
          }
        }

        const content = h(
          'div',
          { className: 'ddc-content' },
          booting
            ? h(
                'div',
                { className: 'ddc-skeleton' },
                h('div', { className: 'ddc-skel' }),
                h('div', { className: 'ddc-skel' }),
                h('div', { className: 'ddc-skel' }),
              )
            : job?.status === 'running'
              ? h(
                  'div',
                  { className: 'ddc-scanning' },
                  h('div', { className: 'ddc-spinner' }),
                  h('div', { className: 'ddc-scanning-title' }, t('scanning')),
                  h('div', { className: 'ddc-scanning-phase' }, phaseLabel(t, job.progress?.phase || 'preparing')),
                  h('div', { className: 'ddc-progress' }, h('div', { className: 'ddc-progress-fill' })),
                  h(
                    'div',
                    { className: 'ddc-scanning-stats' },
                    h('span', null, `${t('filesSeen')} `, h('strong', null, formatNumber(job.progress?.filesSeen || 0))),
                    h('span', null, `${t('sumCandidates')} `, h('strong', null, formatNumber(job.progress?.candidates || 0))),
                    h('span', null, formatBytes(job.progress?.candidateBytes || 0)),
                  ),
                  job.progress?.currentPath ? h('div', { className: 'ddc-scanning-path', title: job.progress.currentPath }, job.progress.currentPath) : null,
                  h(
                    'button',
                    { type: 'button', className: 'ddc-btn ddc-btn-quiet', onClick: cancelScan, disabled: Boolean(job.cancelling) },
                    job.cancelling ? t('working') : t('cancelScan'),
                  ),
                  h('p', { className: 'ddc-hero-hint' }, t('scopeNote')),
                )
              : error && !scan
                ? h(
                    'div',
                    { className: 'ddc-empty', style: { borderStyle: 'solid', paddingTop: '26px' } },
                    h('strong', { className: 'ddc-error-text' }, t('errorTitle')),
                    h('p', { style: { margin: '0 0 14px', lineHeight: 1.6 } }, error),
                    h('button', { type: 'button', className: 'ddc-btn ddc-btn-primary', onClick: startScan }, t('retry')),
                    h('button', { type: 'button', className: 'ddc-btn', style: { marginLeft: '8px' }, onClick: () => window.location.reload() }, t('reloadPage')),
                  )
                : !scan
                  ? h(
                      'div',
                      { className: 'ddc-hero' },
                      h(
                        'div',
                        { className: 'ddc-hero-card' },
                        h('div', { className: 'ddc-hero-kicker' }, t('nav')),
                        h('h2', null, t('initialTitle')),
                        h('p', null, t('initialBody')),
                        h(
                          'div',
                          { className: 'ddc-hero-actions' },
                          h(
                            'button',
                            { type: 'button', className: 'ddc-btn ddc-btn-primary', onClick: startScan },
                            h(Icon, { name: 'disk', size: 16 }),
                            t('startScan'),
                          ),
                          h(
                            'label',
                            { className: 'ddc-toggle' },
                            h('input', { type: 'checkbox', checked: deep, onChange: (event) => setDeep(event.target.checked) }),
                            t('deep'),
                          ),
                        ),
                        h('p', { className: 'ddc-hero-hint' }, t('deepHint')),
                        h('p', { className: 'ddc-hero-hint' }, t('scopeNote')),
                        h(
                          'div',
                          { className: 'ddc-scope-grid' },
                          CATEGORY_ORDER.slice(0, 9).map((id) =>
                            h('div', { className: 'ddc-scope-item', key: id }, h(Icon, { name: 'folder', size: 13 }), categoryLabel(t, id)),
                          ),
                        ),
                      ),
                      h(
                        'div',
                        { className: 'ddc-hero-card' },
                        h('div', { className: 'ddc-hero-kicker' }, t('safetyTitle')),
                        h(
                          'div',
                          { className: 'ddc-safety-list' },
                          [t('safety1'), t('safety2'), t('safety3'), t('safety4')].map((copy, index) =>
                            h('div', { className: 'ddc-safety-item', key: copy }, h(Icon, { name: index === 2 ? 'shield' : 'check', size: 14 }), h('span', null, copy)),
                          ),
                        ),
                      ),
                    )
                  : h(React.Fragment, null, ...results),
          error && scan
            ? h('div', { className: 'ddc-banner error', style: { marginTop: '10px' } }, h(Icon, { name: 'alert', size: 15 }), h('span', null, error))
            : null,
        )

        const footer = scan
          ? h(
              'div',
              { className: 'ddc-footer' },
              h(
                'div',
                { className: 'ddc-footer-copy' },
                h('strong', null, `${t('selected')} ${formatNumber(selectedItems.length)} ${t('files')}`),
                selectedBytes > 0 ? ` · ${formatBytes(selectedBytes)}` : '',
                selectedRiskNote ? h('div', { className: 'ddc-warn-text' }, selectedRiskNote) : null,
              ),
              h(
                'div',
                { className: 'ddc-footer-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ddc-btn ddc-btn-quiet',
                    onClick: () => setSelected(new Set()),
                    disabled: selectedItems.length === 0,
                  },
                  t('clear'),
                ),
                h(
                  'button',
                  { type: 'button', className: 'ddc-btn ddc-btn-primary', onClick: openCleanup, disabled: selectedItems.length === 0 },
                  t('move'),
                ),
              ),
            )
          : null

        const cleanupModal = cleanupOpen
          ? h(
              Modal,
              {
                title: t('confirm.title'),
                subtitle: t('confirm.body'),
                onClose: () => {
                  if (!busy) {
                    setCleanupOpen(false)
                    setCleanupConfirmed(false)
                  }
                },
                footer: h(
                  React.Fragment,
                  null,
                  h('span', { className: 'ddc-footer-copy' }, `${formatNumber(selectedItems.length)} ${t('files')} · ${formatBytes(selectedBytes)}`),
                  h(
                    'div',
                    { className: 'ddc-modal-foot-right' },
                    h('button', { type: 'button', className: 'ddc-btn', onClick: () => setCleanupOpen(false), disabled: busy }, t('cancel')),
                    h(
                      'button',
                      { type: 'button', className: 'ddc-btn ddc-btn-primary', onClick: confirmCleanup, disabled: busy || !cleanupConfirmed },
                      busy ? t('working') : t('confirm.move'),
                    ),
                  ),
                ),
              },
              hasRiskySelection ? h('div', { className: 'ddc-banner warn' }, h(Icon, { name: 'alert', size: 15 }), h('span', null, t('confirm.risk'))) : null,
              hasProtectedSelection ? h('div', { className: 'ddc-banner warn', style: { marginTop: '8px' } }, h(Icon, { name: 'shield', size: 15 }), h('span', null, t('confirm.protected'))) : null,
              h('div', { className: 'ddc-banner', style: { marginTop: '8px' } }, h(Icon, { name: 'info', size: 15 }), h('span', null, t('confirm.quarantine'))),
              h(
                'label',
                { className: 'ddc-checkline' },
                h('input', { type: 'checkbox', checked: cleanupConfirmed, onChange: (event) => setCleanupConfirmed(event.target.checked), disabled: busy }),
                h('span', null, t('confirm.check')),
              ),
              h(
                'div',
                { className: 'ddc-code', style: { maxHeight: '160px', overflow: 'auto' } },
                selectedItems.slice(0, 40).map((item) => item.path).join('\n') + (selectedItems.length > 40 ? `\n… +${selectedItems.length - 40}` : ''),
              ),
            )
          : null

        const detailModal = detail
          ? h(
              Modal,
              {
                title: t('detail.title'),
                subtitle: detail.name,
                width: 780,
                onClose: () => setDetail(null),
                footer: h(
                  React.Fragment,
                  null,
                  h(
                    'span',
                    { className: 'ddc-badge ' + detail.risk },
                    riskLabel(t, detail.risk),
                  ),
                  h(
                    'div',
                    { className: 'ddc-modal-foot-right' },
                    h('button', { type: 'button', className: 'ddc-btn', onClick: () => setDetail(null) }, t('close')),
                    detail.cleanable
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'ddc-btn ddc-btn-primary',
                            onClick: () => {
                              toggleItem(detail.id, !selected.has(detail.id))
                              setDetail(null)
                            },
                          },
                          selected.has(detail.id) ? t('detail.deselect') : t('detail.select'),
                        )
                      : h('span', { className: 'ddc-badge muted' }, t('infoOnly')),
                  ),
                ),
              },
              h(
                'div',
                { className: 'ddc-detail-titleline' },
                h('span', { className: 'ddc-badge ' + detail.risk }, riskLabel(t, detail.risk)),
                detail.protected ? h('span', { className: 'ddc-badge muted' }, t('protected')) : null,
                detail.requiresAdmin ? h('span', { className: 'ddc-badge muted' }, t('admin')) : null,
                h('span', { className: 'ddc-badge muted' }, categoryLabel(t, detail.categoryId)),
              ),
              h(
                'div',
                { className: 'ddc-detail-grid' },
                h('div', { className: 'ddc-detail-cell' }, h('span', null, t('size')), h('strong', null, formatBytes(detail.size))),
                h('div', { className: 'ddc-detail-cell' }, h('span', null, t('age')), h('strong', null, formatAge(detail, t))),
                h('div', { className: 'ddc-detail-cell' }, h('span', null, t('modified')), h('strong', null, formatDate(detail.modifiedMs, localeId))),
                h('div', { className: 'ddc-detail-cell' }, h('span', null, t('app')), h('strong', null, detail.app)),
                h('div', { className: 'ddc-detail-cell' }, h('span', null, t('risk')), h('strong', null, riskLabel(t, detail.risk))),
                h('div', { className: 'ddc-detail-cell' }, h('span', null, t('category')), h('strong', null, categoryLabel(t, detail.categoryId))),
              ),
              h('div', { className: 'ddc-section' }, h('h4', null, t('path')), h('code', { className: 'ddc-code' }, detail.path)),
              h('div', { className: 'ddc-section' }, h('h4', null, t('detail.purpose')), h('p', null, detail.purpose)),
              h('div', { className: 'ddc-section' }, h('h4', null, t('detail.reason')), h('p', null, detail.reason)),
              detail.duplicateOf
                ? h(
                    'div',
                    { className: 'ddc-section' },
                    h('h4', null, t('duplicateOf')),
                    h('code', { className: 'ddc-code' }, detail.duplicateOf),
                  )
                : null,
              h('div', { className: 'ddc-section' }, h('h4', null, t('quarantineBtn')), h('p', null, t('quarantineNote'))),
            )
          : null

        const resultModal = result
          ? h(
              Modal,
              {
                title: t('result.title'),
                width: 780,
                onClose: () => setResult(null),
                footer: h(
                  React.Fragment,
                  null,
                  h('span', { className: 'ddc-footer-copy' }, result.kind === 'cleanup' ? t('cleanupPartial') : t('failures')),
                  h('button', { type: 'button', className: 'ddc-btn ddc-btn-primary', onClick: () => setResult(null) }, t('close')),
                ),
              },
              h(
                'div',
                { className: 'ddc-skip-grid' },
                result.kind === 'cleanup'
                  ? h(
                      React.Fragment,
                      null,
                      h('div', { className: 'ddc-skip-cell' }, h('strong', null, formatNumber(result.result.cleanedCount)), t('result.cleaned')),
                      h('div', { className: 'ddc-skip-cell' }, h('strong', null, formatBytes(result.result.cleanedBytes)), t('size')),
                      h('div', { className: 'ddc-skip-cell' }, h('strong', null, formatNumber(result.result.failures.length)), t('result.failed')),
                      h('div', { className: 'ddc-skip-cell' }, h('strong', null, formatNumber(result.result.totalRequested)), t('files')),
                    )
                  : h(
                      React.Fragment,
                      null,
                      h('div', { className: 'ddc-skip-cell' }, h('strong', null, formatNumber(result.result.restoredCount)), t('result.restored')),
                      h('div', { className: 'ddc-skip-cell' }, h('strong', null, formatNumber(result.result.failures?.length || 0)), t('result.failed')),
                    ),
              ),
              result.result.failures?.length
                ? h(
                    'div',
                    { className: 'ddc-warning-list' },
                    result.result.failures.map((failure, index) =>
                      h(
                        'div',
                        { className: 'ddc-warning-item', key: `${failure.itemId || index}` },
                        h('code', null, failure.path || failure.message),
                        h('p', null, `${failure.code || 'ERROR'} · ${failure.message || ''}`),
                      ),
                    ),
                  )
                : h('p', { className: 'ddc-hint' }, t('report.noPermission')),
            )
          : null

        const quarantineModal = quarantineOpen
          ? h(
              Modal,
              {
                title: t('quarantine.title'),
                subtitle: `${formatNumber(quarantineCount)} ${t('items')} · ${formatBytes(quarantineBytes)}`,
                width: 900,
                onClose: () => setQuarantineOpen(false),
                footer: h(
                  React.Fragment,
                  null,
                  h('span', { className: 'ddc-footer-copy' }, t('confirm.quarantine')),
                  h(
                    'button',
                    { type: 'button', className: 'ddc-btn', onClick: () => setQuarantineOpen(false) },
                    t('close'),
                  ),
                ),
              },
              !quarantine.batches?.length
                ? h('div', { className: 'ddc-empty' }, h('strong', null, t('quarantine.empty')))
                : quarantine.batches.map((batch) =>
                    h(
                      'div',
                      { className: 'ddc-batch', key: batch.id },
                      h(
                        'div',
                        { className: 'ddc-batch-head' },
                        h(
                          'div',
                          { style: { minWidth: 0 } },
                          h(
                            'div',
                            { className: 'ddc-batch-title' },
                            `${formatNumber(batch.count)} ${t('items')} · ${formatBytes(batch.bytes)}`,
                          ),
                          h('div', { className: 'ddc-batch-meta' }, `${t('batch.created')} ${formatDate(batch.createdAt, localeId)}`),
                        ),
                        h(
                          'div',
                          { className: 'ddc-batch-actions' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'ddc-btn',
                              onClick: () => handleRestore(batch),
                              disabled: Boolean(busyBatch),
                            },
                            h(Icon, { name: 'restore', size: 14 }),
                            busyBatch === batch.id ? t('working') : t('restore'),
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'ddc-btn ddc-btn-danger',
                              onClick: () => requestPurge(batch),
                              disabled: Boolean(busyBatch),
                            },
                            h(Icon, { name: 'trash', size: 14 }),
                            t('purge'),
                          ),
                        ),
                      ),
                      batch.preview?.length
                        ? h(
                            'div',
                            { className: 'ddc-batch-preview' },
                            batch.preview.slice(0, 5).map((item, index) =>
                              h('code', { key: `${batch.id}-${index}`, title: item.path }, item.path),
                            ),
                          )
                        : null,
                    ),
                  ),
            )
          : null

        const purgeModal = pendingPurge
          ? h(
              Modal,
              {
                title: t('purgeTitle'),
                subtitle: `${formatNumber(pendingPurge.count)} ${t('items')} · ${formatBytes(pendingPurge.bytes)}`,
                width: 640,
                onClose: () => {
                  if (!busyBatch) {
                    setPendingPurge(null)
                    setPurgeChecked(false)
                  }
                },
                footer: h(
                  React.Fragment,
                  null,
                  h('span', { className: 'ddc-footer-copy ddc-error-text' }, t('purgeBody')),
                  h(
                    'div',
                    { className: 'ddc-modal-foot-right' },
                    h('button', { type: 'button', className: 'ddc-btn', onClick: () => setPendingPurge(null), disabled: Boolean(busyBatch) }, t('cancel')),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'ddc-btn ddc-btn-danger',
                        onClick: confirmPurge,
                        disabled: !purgeChecked || Boolean(busyBatch),
                      },
                      busyBatch ? t('working') : t('purgeDo'),
                    ),
                  ),
                ),
              },
              h(
                'label',
                { className: 'ddc-checkline' },
                h('input', {
                  type: 'checkbox',
                  checked: purgeChecked,
                  onChange: (event) => setPurgeChecked(event.target.checked),
                  disabled: Boolean(busyBatch),
                }),
                h('span', null, t('purgeCheck')),
              ),
            )
          : null

        const reportModal = reportOpen
          ? h(
              Modal,
              {
                title: t('report.title'),
                subtitle: scan ? `${formatDate(scan.finishedAt, localeId)} · ${formatDuration(scan.elapsedMs)}` : '',
                width: 860,
                onClose: () => setReportOpen(false),
                footer: h(
                  'button',
                  { type: 'button', className: 'ddc-btn', onClick: () => setReportOpen(false) },
                  t('close'),
                ),
              },
              !scan
                ? h('p', { className: 'ddc-hint' }, t('emptyScan'))
                : h(
                    React.Fragment,
                    null,
                    scan.coverage?.partial ? h('div', { className: 'ddc-banner warn' }, h(Icon, { name: 'alert', size: 15 }), h('span', null, t('partialHint'))) : null,
                    h(
                      'div',
                      { className: 'ddc-skip-grid' },
                      ['permission', 'protected', 'symlink', 'recent', 'small', 'active', 'error', 'limit'].map((key) =>
                        h(
                          'div',
                          { className: 'ddc-skip-cell', key },
                          h('strong', null, formatNumber(scan.skipped?.[key] || 0)),
                          tr(t, `skip.${key}`, key),
                        ),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'ddc-section' },
                      h('h4', null, t('scanRoots')),
                      h(
                        'div',
                        { className: 'ddc-warning-list' },
                        (scan.roots || []).map((root) =>
                          h(
                            'div',
                            { className: 'ddc-warning-item', key: root.id },
                            h('code', null, root.path),
                            h('p', null, `${root.label}${root.requiresAdmin ? ` · ${t('admin')}` : ''}`),
                          ),
                        ),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'ddc-section' },
                      h('h4', null, t('warnings')),
                      scan.warningCount === 0
                        ? h('p', { className: 'ddc-hint' }, t('noWarnings'))
                        : h(
                            'div',
                            { className: 'ddc-warning-list' },
                            (scan.warnings || []).map((warning, index) =>
                              h(
                                'div',
                                { className: 'ddc-warning-item', key: `${warning.path}-${index}` },
                                h('code', null, warning.path),
                                h('p', null, `${warning.code} · ${warning.message}`),
                              ),
                            ),
                            scan.warningCount > (scan.warnings?.length || 0)
                              ? h('p', { className: 'ddc-hint' }, `+${scan.warningCount - (scan.warnings?.length || 0)}`)
                              : null,
                          ),
                    ),
                  ),
            )
          : null

        return h(
          React.Fragment,
          null,
          h('style', null, CSS),
          h(
            'div',
            { className: 'ddc-root' },
            header,
            h('div', { className: 'ddc-body' }, sidebar, h('main', { className: 'ddc-main' }, content, footer)),
          ),
          detailModal,
          cleanupModal,
          quarantineModal,
          purgeModal,
          reportModal,
          resultModal,
          toast ? h('div', { className: `ddc-toast ${toast.kind}` }, toast.text) : null,
        )
      }

      return DiskDoctorPage
    }

    function SidebarDiskIcon({ size = 20, active }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', { d: 'M4 6.8C4 4.98 7.58 3.5 12 3.5s8 1.48 8 3.3v10.4c0 1.82-3.58 3.3-8 3.3s-8-1.48-8-3.3V6.8Z' }),
        h('path', { d: 'M4 11.6c0 1.82 3.58 3.3 8 3.3s8-1.48 8-3.3' }),
        h('circle', { cx: 15.2, cy: 15.2, r: 1.1, fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'm19 2 .7 1.6L21.3 4.3l-1.6.7L19 6.6l-.7-1.6-1.6-.7 1.6-.7L19 2Z', fill: 'currentColor', stroke: 'none' }),
      )
    }

    return {
      name: NS,
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () =>
            ctx.locale.register(NS, {
              zh: ZH,
              en: EN,
            }),
          'dsh-disk-cleanup: locale dictionaries',
        )
        const t = ctx.locale.bind(NS)
        const Page = createPage(ctx, t)

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'disk-cleanup',
              order: 20,
              label: () => t('nav'),
            },
            SidebarDiskIcon,
          ),
        )

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: 'disk-cleanup',
            },
            Page,
          ),
        )
      },
    }
  },
})

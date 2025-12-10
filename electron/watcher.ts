import chokidar, { type FSWatcher } from 'chokidar';
import fs from 'fs-extra';
import { BrowserWindow } from 'electron';
import { scanFolder } from './fileScanner';
import { moveFiles } from './fileMover';
import { Config, LogLevel, ProgressEvent } from './types';

let watcher: FSWatcher | null = null;
let debounceTimer: NodeJS.Timeout | null = null;

export async function startWatcher(
  config: Config,
  mainWindow: BrowserWindow,
  log?: (message: string, level?: LogLevel) => void
) {
  if (watcher) return;
  await fs.ensureDir(config.sourceDir);
  log?.(`Старт watch на ${config.sourceDir}`);
  watcher = chokidar.watch(config.sourceDir, {
    ignoreInitial: true,
    persistent: true,
    depth: 5
  });

  const trigger = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const scan = await scanFolder(config.sourceDir, config, log);
      mainWindow.webContents.send('summary', scan.summary);
      await moveFiles(
        scan.items,
        config,
        (message, level) => log?.(message, level),
        (event: ProgressEvent) => mainWindow.webContents.send('progress', event)
      );
    }, 300);
  };

  watcher
    .on('add', trigger)
    .on('addDir', trigger)
    .on('change', trigger)
    .on('error', (err: unknown) => log?.(`Watcher error: ${String(err)}`, 'error'));
}

export async function stopWatcher(log?: (message: string, level?: LogLevel) => void) {
  if (!watcher) return;
  await watcher.close();
  watcher = null;
  if (debounceTimer) clearTimeout(debounceTimer);
  log?.('Watcher остановлен');
}

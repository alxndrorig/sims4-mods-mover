import { BrowserWindow, dialog, ipcMain } from 'electron';
import { extractArchive } from './archiveExtractor';
import { loadConfig, saveConfig } from './config';
import { moveFiles } from './fileMover';
import { scanFolder } from './fileScanner';
import { startWatcher, stopWatcher } from './watcher';
import { Config, LogMessage, ScanItem } from './types';

let configCache: Config;

export async function registerIpcHandlers(mainWindow: BrowserWindow) {
  configCache = await loadConfig();

  const sendLog = (message: string, level: LogMessage['level'] = 'info') => {
    const payload: LogMessage = { level, message, timestamp: Date.now() };
    mainWindow.webContents.send('log', payload);
  };

  ipcMain.handle('get-config', async () => configCache);

  ipcMain.handle('set-config', async (_event, payload: Partial<Config>) => {
    configCache = { ...configCache, ...payload } as Config;
    await saveConfig(configCache);
    sendLog('Конфиг обновлен');
    return configCache;
  });

  ipcMain.handle('scan-folder', async (_event, source?: string) => {
    if (source) configCache.sourceDir = source;
    const result = await scanFolder(configCache.sourceDir, configCache, sendLog);
    mainWindow.webContents.send('summary', result.summary);
    return result;
  });

  ipcMain.handle('move-files', async (_event, items: ScanItem[]) => {
    const operations = await moveFiles(
      items,
      configCache,
      sendLog,
      (event) => mainWindow.webContents.send('progress', event)
    );
    return operations;
  });

  ipcMain.handle('extract-archive', async (_event, archivePath: string) => {
    const dest = await extractArchive(archivePath, configCache.tempDir, sendLog);
    return dest;
  });

  ipcMain.handle('watch-start', async () => {
    await startWatcher(configCache, mainWindow, sendLog);
    configCache.watcherEnabled = true;
    await saveConfig(configCache);
    return { enabled: true };
  });

  ipcMain.handle('watch-stop', async () => {
    await stopWatcher(sendLog);
    configCache.watcherEnabled = false;
    await saveConfig(configCache);
    return { enabled: false };
  });

  ipcMain.handle('choose-folder', async (_event, defaultPath?: string) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      defaultPath
    });
    if (canceled || !filePaths[0]) return null;
    return filePaths[0];
  });

  sendLog('IPC готов');

  if (configCache.watcherEnabled) {
    await startWatcher(configCache, mainWindow, sendLog);
  }
}

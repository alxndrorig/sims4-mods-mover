import { app, BrowserWindow, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { registerIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;

function resolvePreload() {
  const preloadJs = path.join(__dirname, 'preload.js');
  const preloadDev = path.join(__dirname, 'preload-dev.js');
  if (process.env.VITE_DEV_SERVER_URL) {
    return preloadDev;
  }
  return fs.pathExistsSync(preloadJs) ? preloadJs : preloadDev;
}

async function createWindow() {
  await fs.ensureDir(path.join(app.getPath('userData'), 'logs'));
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: resolvePreload(),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Регистрируем IPC до загрузки renderer, чтобы renderer не успел дернуть invoke без handler
  await registerIpcHandlers(mainWindow);

  const devServer = process.env.VITE_DEV_SERVER_URL;
  if (devServer) {
    await waitForDevServer(devServer);
    await mainWindow.loadURL(devServer);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function waitForDevServer(url: string, retries = 30, delayMs = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (err) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Dev server ${url} недоступен после ожидания`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

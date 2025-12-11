// Dev preload (plain JS) — повторяет electron/preload.ts без ts-node
const { contextBridge, ipcRenderer } = require('electron');

const api = {
  scanFolder: (source) => ipcRenderer.invoke('scan-folder', source),
  moveFiles: (items) => ipcRenderer.invoke('move-files', items),
  extractArchive: (archivePath) => ipcRenderer.invoke('extract-archive', archivePath),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  watchStart: () => ipcRenderer.invoke('watch-start'),
  watchStop: () => ipcRenderer.invoke('watch-stop'),
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  onLog: (cb) => ipcRenderer.on('log', (_event, payload) => cb(payload)),
  onProgress: (cb) => ipcRenderer.on('progress', (_event, payload) => cb(payload)),
  onSummary: (cb) => ipcRenderer.on('summary', (_event, payload) => cb(payload)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
};

contextBridge.exposeInMainWorld('api', api);

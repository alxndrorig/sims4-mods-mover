import { contextBridge, ipcRenderer } from 'electron';
import { Config, LogMessage, ProgressEvent, ScanItem, ScanResult, ScanSummary } from './types';

type Listener<T> = (payload: T) => void;

const api = {
  scanFolder: (source?: string): Promise<ScanResult> => ipcRenderer.invoke('scan-folder', source),
  moveFiles: (items: ScanItem[]) => ipcRenderer.invoke('move-files', items),
  extractArchive: (archivePath: string) => ipcRenderer.invoke('extract-archive', archivePath),
  getConfig: (): Promise<Config> => ipcRenderer.invoke('get-config'),
  setConfig: (config: Partial<Config>): Promise<Config> => ipcRenderer.invoke('set-config', config),
  watchStart: () => ipcRenderer.invoke('watch-start'),
  watchStop: () => ipcRenderer.invoke('watch-stop'),
  chooseFolder: (): Promise<string | null> => ipcRenderer.invoke('choose-folder'),
  onLog: (cb: Listener<LogMessage>) => ipcRenderer.on('log', (_event, payload) => cb(payload)),
  onProgress: (cb: Listener<ProgressEvent>) => ipcRenderer.on('progress', (_event, payload) => cb(payload)),
  onSummary: (cb: Listener<ScanSummary>) => ipcRenderer.on('summary', (_event, payload) => cb(payload)),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
};

contextBridge.exposeInMainWorld('api', api);

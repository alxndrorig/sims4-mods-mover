import { Config, LogMessage, ProgressEvent, ScanItem, ScanResult, ScanSummary } from '../../../electron/types';
import { NestedArchivesRequest, NestedArchivesSelection } from './types';

type Listener<T> = (payload: T) => void;

type ApiShape = {
  scanFolder: (source?: string) => Promise<ScanResult>;
  moveFiles: (items: ScanItem[]) => Promise<any>;
  extractArchive: (path: string) => Promise<string>;
  getConfig: () => Promise<Config>;
  setConfig: (config: Partial<Config>) => Promise<Config>;
  watchStart: () => Promise<any>;
  watchStop: () => Promise<any>;
  chooseFolder: () => Promise<string | null>;
  onLog: (cb: Listener<LogMessage>) => void;
  onProgress: (cb: Listener<ProgressEvent>) => void;
  onSummary: (cb: Listener<ScanSummary>) => void;
  removeAllListeners: (channel: string) => void;
  onNestedArchives: (cb: Listener<NestedArchivesRequest>) => void;
  chooseNestedArchives: (payload: NestedArchivesSelection) => Promise<void>;
};

const nativeApi = (window as any)?.api as ApiShape | undefined;

function assertApi(): ApiShape {
  if (!nativeApi) {
    throw new Error('IPC мост недоступен: preload не загрузился. Проверьте preload путь и dev-режим.');
  }
  return nativeApi;
}

export const ipcClient = {
  getConfig: () => assertApi().getConfig(),
  setConfig: (config: Partial<Config>) => assertApi().setConfig(config),
  scanFolder: (source?: string) => assertApi().scanFolder(source),
  moveFiles: (items: ScanItem[]) => assertApi().moveFiles(items),
  extractArchive: (archivePath: string) => assertApi().extractArchive(archivePath),
  watchStart: () => assertApi().watchStart(),
  watchStop: () => assertApi().watchStop(),
  chooseFolder: () => assertApi().chooseFolder(),
  onLog: (_cb: Listener<LogMessage>) => undefined,
  onProgress: (cb: Listener<ProgressEvent>) => nativeApi?.onProgress(cb),
  onSummary: (cb: Listener<ScanSummary>) => nativeApi?.onSummary(cb),
  onNestedArchives: (cb: Listener<NestedArchivesRequest>) => nativeApi?.onNestedArchives(cb),
  chooseNestedArchives: (payload: NestedArchivesSelection) => assertApi().chooseNestedArchives(payload),
  cleanup: () => {
    nativeApi?.removeAllListeners('log');
    nativeApi?.removeAllListeners('progress');
    nativeApi?.removeAllListeners('summary');
  }
};

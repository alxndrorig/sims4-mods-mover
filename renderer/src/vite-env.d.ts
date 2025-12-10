/// <reference types="vite/client" />
import { Config, LogMessage, ProgressEvent, ScanItem, ScanResult, ScanSummary } from '../../electron/types';

declare global {
  interface Window {
    api: {
      scanFolder: (source?: string) => Promise<ScanResult>;
      moveFiles: (items: ScanItem[]) => Promise<any>;
      extractArchive: (path: string) => Promise<string>;
      getConfig: () => Promise<Config>;
      setConfig: (config: Partial<Config>) => Promise<Config>;
      watchStart: () => Promise<any>;
      watchStop: () => Promise<any>;
      chooseFolder: () => Promise<string | null>;
      onLog: (cb: (payload: LogMessage) => void) => void;
      onProgress: (cb: (payload: ProgressEvent) => void) => void;
      onSummary: (cb: (payload: ScanSummary) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

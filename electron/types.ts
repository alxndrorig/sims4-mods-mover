export type FileType = 'mod' | 'tray' | 'save' | 'archive' | 'trash' | 'unknown';

export interface ScanItem {
  path: string;
  name: string;
  ext: string;
  type: FileType;
  size: number;
  mtime: number;
  relativePath: string;
  nested?: boolean;
}

export interface ScanSummary {
  mod: number;
  tray: number;
  save: number;
  archive: number;
  trash: number;
  unknown: number;
  total: number;
}

export interface ScanResult {
  items: ScanItem[];
  summary: ScanSummary;
}

export interface MoveOperation {
  from: string;
  to: string;
  type: FileType;
}

export interface Config {
  sourceDir: string;
  simsRoot: string;
  modsDir: string;
  trayDir: string;
  savesDir: string;
  tempDir: string;
  watcherEnabled: boolean;
  nestedArchiveMode?: 'all' | 'first' | 'skip' | 'prompt';
}

export interface NestedArchivesRequest {
  requestId: string;
  archives: string[];
}

export interface ProgressEvent {
  total: number;
  processed: number;
  current?: string;
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: number;
}

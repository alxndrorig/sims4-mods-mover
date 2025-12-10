import { create } from 'zustand';
import { ipcClient } from '../api/ipcClient';
import { Config, FileType, LogMessage, ProgressEvent, ScanItem, ScanResult, ScanSummary } from '../../electron/types';

interface AppState {
  config?: Config;
  items: ScanItem[];
  summary?: ScanSummary;
  logs: LogMessage[];
  progress?: ProgressEvent;
  filter: FileType | 'all';
  loading: boolean;
  init: () => Promise<void>;
  scan: () => Promise<ScanResult | undefined>;
  moveAll: () => Promise<void>;
  updateConfig: (patch: Partial<Config>) => Promise<void>;
  toggleWatcher: (enabled: boolean) => Promise<void>;
  setFilter: (type: FileType | 'all') => void;
  addLog: (log: LogMessage) => void;
  setSummary: (summary: ScanSummary) => void;
  setProgress: (progress?: ProgressEvent) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  items: [],
  logs: [],
  filter: 'all',
  loading: false,
  init: async () => {
    const config = await ipcClient.getConfig();
    set({ config });
    const result = await ipcClient.scanFolder(config.sourceDir);
    set({ items: result.items, summary: result.summary });
  },
  scan: async () => {
    const { config } = get();
    if (!config) return;
    set({ loading: true });
    try {
      const result = await ipcClient.scanFolder(config.sourceDir);
      set({ items: result.items, summary: result.summary });
      return result;
    } finally {
      set({ loading: false });
    }
  },
  moveAll: async () => {
    const { items } = get();
    if (!items.length) return;
    set({ loading: true, progress: { total: items.length, processed: 0 } });
    try {
      await ipcClient.moveFiles(items);
      await get().scan();
    } finally {
      set({ loading: false, progress: undefined });
    }
  },
  updateConfig: async (patch) => {
    const next = await ipcClient.setConfig(patch);
    set({ config: next });
  },
  toggleWatcher: async (enabled) => {
    if (enabled) await ipcClient.watchStart();
    else await ipcClient.watchStop();
    set((state) => ({ config: state.config ? { ...state.config, watcherEnabled: enabled } : state.config }));
  },
  setFilter: (type) => set({ filter: type }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 500) })),
  setSummary: (summary) => set({ summary }),
  setProgress: (progress) => set({ progress })
}));

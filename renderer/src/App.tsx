import { useEffect, useMemo, useState } from "react";
import { ipcClient } from "./api/ipcClient";
import { useAppStore } from "./store/appStore";
import Summary from "./components/Summary";
import FileTable from "./components/FileTable";
import Settings from "./components/Settings";
import ProgressBar from "./components/ProgressBar";
import { NestedArchiveModal } from "./components/NestedArchiveModal";
import { FileType } from "../../electron/types";

function App() {
  const hasIpc = Boolean((window as any)?.api);
  const {
    init,
    scan,
    moveAll,
    items,
    summary,
    filter,
    setFilter,
    setSummary,
    setProgress,
    progress,
    loading,
    config,
  } = useAppStore();

  const [selectedType, setSelectedType] = useState<FileType | "all">("all");

  useEffect(() => {
    init();
    ipcClient.onProgress((event) => setProgress(event));
    ipcClient.onSummary((s) => setSummary(s));
    return () => ipcClient.cleanup();
  }, [init, setProgress, setSummary]);

  useEffect(() => {
    setFilter(selectedType);
  }, [selectedType, setFilter]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  return (
    <div style={{ padding: 16, color: "white" }}>
      <h1>Sims 4 Mods Mover</h1>
      <p>
        Автосортировка модов/трей/сейвов The Sims 4 с предпросмотром и watcher.
      </p>
      {!hasIpc && (
        <div
          className="card"
          style={{ borderColor: "#f97316", color: "#fde68a", marginBottom: 12 }}
        >
          <strong>IPC недоступен.</strong> Откройте приложение в окне Electron
          (npm run dev) — запуск только в браузере не подгружает preload и
          настройки.
        </div>
      )}

      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 12 }}
      >
        <div className="card">
          <Summary
            summary={summary}
            onSelect={setSelectedType}
            selected={selectedType}
          />
          <div className="flex" style={{ marginTop: 12 }}>
            <button disabled={loading} onClick={() => scan()}>
              Сканировать
            </button>
            <button
              disabled={loading || !items.length}
              onClick={() => moveAll()}
            >
              Разложить
            </button>
            {progress && <ProgressBar progress={progress} />}
          </div>
        </div>
        <div className="card">
          <Settings />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <FileTable items={filteredItems} typeFilter={filter} />
      </div>
      <NestedArchiveModal />
    </div>
  );
}

export default App;

import { useState } from "react";
import { useAppStore } from "../store/appStore";

export function NestedArchiveModal() {
  const { nestedModal, respondNestedArchives, clearNestedModal } = useAppStore();
  const [selected, setSelected] = useState<string[]>(nestedModal?.archives || []);

  if (!nestedModal) return null;

  const toggle = (arch: string) => {
    setSelected((prev) =>
      prev.includes(arch) ? prev.filter((a) => a !== arch) : [...prev, arch]
    );
  };

  const submitSelected = () => respondNestedArchives(selected);
  const submitAll = () => respondNestedArchives(nestedModal.archives);
  const submitSkip = () => respondNestedArchives([]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{ width: 420, maxHeight: "80vh", overflow: "auto", color: "white" }}
      >
        <h3>Вложенные архивы</h3>
        <p style={{ color: "#cbd5e1" }}>
          Выберите, какие вложенные архивы распаковать. Если пропустите, исходный архив будет перенесён как есть.
        </p>
        <div className="grid" style={{ gap: 8 }}>
          {nestedModal.archives.map((arch) => (
            <label key={arch} className="flex" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={selected.includes(arch)}
                onChange={() => toggle(arch)}
              />
              <span>{arch.split(/[/\\]/).slice(-1)[0]}</span>
            </label>
          ))}
          {!nestedModal.archives.length && (
            <div style={{ color: "#94a3b8" }}>Вложенных архивов не обнаружено.</div>
          )}
        </div>
        <div className="flex" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={submitSkip} style={{ background: "#475569" }}>
            Пропустить
          </button>
          <button onClick={submitAll} style={{ background: "#1d4ed8" }}>
            Все
          </button>
          <button onClick={submitSelected} disabled={!selected.length}>
            Распаковать выбранные
          </button>
        </div>
        <div className="flex" style={{ marginTop: 8, justifyContent: "flex-end" }}>
          <button onClick={clearNestedModal} style={{ background: "#334155" }}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

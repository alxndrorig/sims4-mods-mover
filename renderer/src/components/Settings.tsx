import { useState } from "react";
import { useAppStore } from "../store/appStore";
import { ipcClient } from "../api/ipcClient";

export default function Settings() {
  const { config, updateConfig, toggleWatcher, scan } = useAppStore();
  const [saving, setSaving] = useState(false);

  if (!config) return <div>Загрузка конфигурации...</div>;

  const handlePathChange =
    (key: keyof typeof config) => async (value: string) => {
      setSaving(true);
      await updateConfig({ [key]: value } as any);
      setSaving(false);
    };

  const chooseFolder = async (key: keyof typeof config) => {
    const chosen = await ipcClient.chooseFolder();
    if (chosen) {
      await handlePathChange(key)(chosen);
    }
  };

  const chooseSimsRootAndFill = async () => {
    const chosen = await ipcClient.chooseFolder();
    if (!chosen) return;
    setSaving(true);
    const next = {
      simsRoot: chosen,
      modsDir: `${chosen}/Mods`,
      trayDir: `${chosen}/Tray`,
      savesDir: `${chosen}/Saves`,
    };
    await updateConfig(next);
    setSaving(false);
  };

  return (
    <div className="grid" style={{ gap: 10 }}>
      <h3>Настройки путей</h3>
      <label className="grid" style={{ gap: 4 }}>
        <span>Источник (куда складываете новые моды)</span>
        <div className="flex">
          <input
            value={config.sourceDir}
            onChange={(e) => handlePathChange("sourceDir")(e.target.value)}
          />
          <button onClick={() => chooseFolder("sourceDir")}>Выбрать</button>
        </div>
      </label>
      <label className="grid" style={{ gap: 4 }}>
        <span>Папка Sims 4 (Documents/Electronic Arts/The Sims 4)</span>
        <input
          value={config.simsRoot}
          onChange={(e) => handlePathChange("simsRoot")(e.target.value)}
        />
        <div className="flex">
          <button onClick={() => chooseFolder("simsRoot")}>Выбрать</button>
          <button onClick={chooseSimsRootAndFill}>
            Выбрать и заполнить Mods/Tray/Saves
          </button>
        </div>
      </label>
      <label className="grid" style={{ gap: 4 }}>
        <span>Mods</span>
        <div className="flex">
          <input
            value={config.modsDir}
            onChange={(e) => handlePathChange("modsDir")(e.target.value)}
          />
          <button onClick={() => chooseFolder("modsDir")}>Выбрать</button>
        </div>
      </label>
      <label className="grid" style={{ gap: 4 }}>
        <span>Tray</span>
        <div className="flex">
          <input
            value={config.trayDir}
            onChange={(e) => handlePathChange("trayDir")(e.target.value)}
          />
          <button onClick={() => chooseFolder("trayDir")}>Выбрать</button>
        </div>
      </label>
      <label className="grid" style={{ gap: 4 }}>
        <span>Saves</span>
        <div className="flex">
          <input
            value={config.savesDir}
            onChange={(e) => handlePathChange("savesDir")(e.target.value)}
          />
          <button onClick={() => chooseFolder("savesDir")}>Выбрать</button>
        </div>
      </label>
      <label
        className="flex"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <span className="flex" style={{ gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={config.watcherEnabled}
            onChange={(e) => toggleWatcher(e.target.checked)}
          />
          Авто-режим (watcher)
        </span>
        <span
          className="badge"
          style={{ background: config.watcherEnabled ? "#22c55e" : "#475569" }}
        >
          {config.watcherEnabled ? "Включен" : "Выкл"}
        </span>
      </label>
      <div className="flex" style={{ justifyContent: "space-between" }}>
        <button onClick={() => scan()} disabled={saving}>
          Пересканировать
        </button>
        {saving && <span style={{ color: "#94a3b8" }}>Сохранение...</span>}
      </div>
    </div>
  );
}

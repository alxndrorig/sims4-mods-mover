import { app } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Config } from './types';

const defaultSimsRoot = path.join(os.homedir(), 'Documents', 'Electronic Arts', 'The Sims 4');
const defaultSource = path.join(os.homedir(), 'Downloads', 'new_mods');

const defaultConfig: Config = {
  sourceDir: defaultSource,
  simsRoot: defaultSimsRoot,
  modsDir: path.join(defaultSimsRoot, 'Mods'),
  trayDir: path.join(defaultSimsRoot, 'Tray'),
  savesDir: path.join(defaultSimsRoot, 'Saves'),
  tempDir: path.join(app.getPath('temp'), 'sims4-mods-mover'),
  watcherEnabled: false,
  theme: 'dark'
};

const configPath = path.join(app.getPath('userData'), 'config.json');

export async function loadConfig(): Promise<Config> {
  await fs.ensureDir(path.dirname(configPath));
  if (!(await fs.pathExists(configPath))) {
    await saveConfig(defaultConfig);
    return defaultConfig;
  }
  const current = await fs.readJson(configPath).catch(() => ({}));
  return { ...defaultConfig, ...current } as Config;
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export { configPath, defaultConfig };

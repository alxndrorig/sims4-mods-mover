import fs from 'fs-extra';
import path from 'path';
import { extractArchive } from './archiveExtractor';
import { scanFolder } from './fileScanner';
import { Config, LogLevel, MoveOperation, ProgressEvent, ScanItem } from './types';

async function uniquePath(targetDir: string, filename: string): Promise<string> {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  let candidate = path.join(targetDir, filename);
  let counter = 1;
  while (await fs.pathExists(candidate)) {
    candidate = path.join(targetDir, `${name} (${counter})${ext}`);
    counter += 1;
  }
  return candidate;
}

function resolveTarget(item: ScanItem, config: Config): string | null {
  switch (item.type) {
    case 'mod':
      return path.join(config.modsDir, path.basename(item.path));
    case 'tray':
      return path.join(config.trayDir, path.basename(item.path));
    case 'save':
      return path.join(config.savesDir, path.basename(item.path));
    default:
      return null;
  }
}

export async function moveFiles(
  items: ScanItem[],
  config: Config,
  log?: (message: string, level?: LogLevel) => void,
  onProgress?: (event: ProgressEvent) => void
): Promise<MoveOperation[]> {
  const operations: MoveOperation[] = [];
  let processed = 0;
  const total = items.length;

  const notify = (current?: string) => {
    processed += 1;
    onProgress?.({ total, processed, current });
  };

  for (const item of items) {
    if (item.type === 'trash') {
      await fs.remove(item.path);
      log?.(`Удален мусор ${item.path}`);
      notify(item.path);
      continue;
    }

    if (item.type === 'unknown') {
      log?.(`Неизвестный файл пропущен: ${item.path}`);
      notify(item.path);
      continue;
    }

    if (item.type === 'archive') {
      const extracted = await extractArchive(item.path, config.tempDir, log);
      const nestedResult = await scanFolder(extracted, config, log);
      const nestedOps = await moveFiles(nestedResult.items, config, log, onProgress);
      operations.push(...nestedOps);
      // очищаем исходный архив и временную распаковку
      await fs.remove(item.path).catch(() => undefined);
      await fs.remove(extracted).catch(() => undefined);
      notify(item.path);
      continue;
    }

    const targetBase = resolveTarget(item, config);
    if (!targetBase) {
      notify(item.path);
      continue;
    }

    const dest = await uniquePath(path.dirname(targetBase), path.basename(targetBase));
    await fs.ensureDir(path.dirname(dest));
    await fs.move(item.path, dest, { overwrite: false });
    operations.push({ from: item.path, to: dest, type: item.type });
    log?.(`Перемещено ${item.path} -> ${dest}`);
    notify(dest);
  }

  return operations;
}

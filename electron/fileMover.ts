import fs from 'fs-extra';
import path from 'path';
import { extractArchive, findNestedArchives } from './archiveExtractor';
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
  onProgress?: (event: ProgressEvent) => void,
  requestNestedSelection?: (archives: string[]) => Promise<'all' | 'first' | 'skip' | { selected: string[] }>
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
      let mode: 'all' | 'first' | 'skip' = config.nestedArchiveMode === 'skip' ? 'skip' : (config.nestedArchiveMode as any) || 'all';

      // режим обработки вложенных архивов: all (по умолчанию), first, skip
      if (mode === 'skip') {
        const destArchive = await uniquePath(config.modsDir, path.basename(item.path));
        await fs.ensureDir(path.dirname(destArchive));
        await fs.move(item.path, destArchive, { overwrite: false });
        operations.push({ from: item.path, to: destArchive, type: 'archive' });
        log?.(`Архив перемещен без распаковки: ${item.path} -> ${destArchive}`);
        notify(item.path);
        continue;
      }

      const extracted = await extractArchive(item.path, config.tempDir, log);

      let nestedAllowed: string[] | undefined = undefined;

      if (config.nestedArchiveMode === 'prompt' && requestNestedSelection) {
        const nestedList = await findNestedArchives(extracted, new Set<string>());
        if (nestedList.length > 1) {
          const decision = await requestNestedSelection(nestedList);
          if (typeof decision === 'string') {
            mode = decision;
          } else {
            nestedAllowed = decision.selected;
            mode = nestedAllowed.length === 0 ? 'skip' : 'first';
          }
        }
      }

      if (mode === 'first') {
        const nested = nestedAllowed ?? (await findNestedArchives(extracted, new Set<string>()));
        if (nested.length > 1) {
          const keepList = nestedAllowed ?? [nested[0]];
          const keepSet = new Set(keepList);
          const toRemove = nested.filter((n) => !keepSet.has(n));
          for (const rem of toRemove) {
            await fs.remove(rem).catch(() => undefined);
          }
          log?.(
            `Вложенные архивы: выбрано ${keepList.length} из ${nested.length}, удалено ${toRemove.length} остальных`
          );
        }
      }

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

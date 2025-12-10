import fs from 'fs-extra';
import path from 'path';
import { Config, FileType, ScanItem, ScanResult, ScanSummary, LogLevel } from './types';

const MOD_EXT = new Set(['.package', '.ts4script']);
const TRAY_EXT = new Set(['.trayitem', '.blueprint', '.bpi', '.householdbinary']);
const SAVE_EXT = new Set(['.save']);
const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z']);
const TRASH_EXT = new Set([
  '.txt', '.md', '.rtf', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.url', '.ini'
]);
const TRASH_NAMES = new Set(['thumbs.db']);

function classifyFile(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (TRASH_NAMES.has(base)) return 'trash';
  if (TRASH_EXT.has(ext)) return 'trash';
  if (MOD_EXT.has(ext)) return 'mod';
  if (TRAY_EXT.has(ext)) return 'tray';
  if (SAVE_EXT.has(ext) || base.includes('.save')) return 'save';
  if (ARCHIVE_EXT.has(ext)) return 'archive';
  return 'unknown';
}

function emptySummary(): ScanSummary {
  return { mod: 0, tray: 0, save: 0, archive: 0, trash: 0, unknown: 0, total: 0 };
}

export async function scanFolder(
  sourceDir: string,
  _config: Config,
  log?: (message: string, level?: LogLevel) => void
): Promise<ScanResult> {
  const items: ScanItem[] = [];
  const summary = emptySummary();

  const walk = async (dir: string) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__MACOSX') {
          await fs.remove(full);
          log?.(`Удалена мусорная папка ${full}`);
          continue;
        }
        await walk(full);
        continue;
      }

      const stats = await fs.stat(full);
      if (!stats.isFile()) continue;
      const type = classifyFile(full);
      if (type === 'trash') {
        await fs.remove(full);
        summary.trash += 1;
        summary.total += 1;
        log?.(`Удален мусорный файл ${full}`);
        continue;
      }

      const item: ScanItem = {
        path: full,
        name: entry.name,
        ext: path.extname(entry.name).toLowerCase(),
        type,
        size: stats.size,
        mtime: stats.mtimeMs,
        relativePath: path.relative(sourceDir, full)
      };
      items.push(item);
      summary[type] += 1 as any;
      summary.total += 1;
    }
  };

  await fs.ensureDir(sourceDir);
  await walk(sourceDir);

  return { items, summary };
}

export function filterItemsByType(items: ScanItem[], types: FileType[]): ScanItem[] {
  const set = new Set(types);
  return items.filter((item) => set.has(item.type));
}

export function describeSummary(summary: ScanSummary): string {
  return `Найдено: моды ${summary.mod}, трей ${summary.tray}, сейвы ${summary.save}, архивы ${summary.archive}, неизвестные ${summary.unknown}`;
}

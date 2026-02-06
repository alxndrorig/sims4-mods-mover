import path from 'path';
import fs from 'fs-extra';
import { path7za } from '7zip-bin';
import { spawn } from 'child_process';
import { LogLevel } from './types';

const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z']);

async function extractWith7z(
  archivePath: string,
  dest: string,
  log?: (message: string, level?: LogLevel) => void
): Promise<void> {
  await fs.ensureDir(dest);
  const sevenZipBinPath = path7za.includes('app.asar')
    ? path7za.replace('app.asar', 'app.asar.unpacked')
    : path7za;

  return new Promise((resolve, reject) => {
    log?.(`Начинаем распаковку: ${archivePath}`);

    const args = [
      'x',
      archivePath,
      `-o${dest}`,
      '-y',
      '-bsp1',
      '-bb1',
      '-sccUTF-8'
    ];

    const child = spawn(sevenZipBinPath, args, {
      windowsHide: true
    });

    let stderrText = '';
    let stdoutTail = '';
    let lastLoggedPercent = -25;

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      stdoutTail = `${stdoutTail}${text}`.slice(-8000);
      const percentMatch = text.match(/(\d{1,3})%/g);
      if (!percentMatch) return;
      const last = percentMatch[percentMatch.length - 1];
      const value = Number.parseInt(last.replace('%', ''), 10);
      if (Number.isFinite(value) && value >= lastLoggedPercent + 25) {
        lastLoggedPercent = value;
        log?.(`Распаковка ${path.basename(archivePath)}: ${value}%`);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrText += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      const details = `${err.message}${stderrText ? ` | stderr: ${stderrText.trim()}` : ''}`;
      const errorMessage = `Ошибка распаковки ${archivePath}: ${details}`;
      log?.(errorMessage, 'error');
      reject(new Error(errorMessage));
    });

    child.on('close', (code) => {
      if (code === 0) {
        log?.(`Распакован архив ${archivePath} -> ${dest}`);
        resolve();
        return;
      }

      const stderrClean = stderrText.trim();
      const stdoutClean = stdoutTail.trim();
      const details = stderrClean || stdoutClean || `код выхода 7z: ${String(code)}`;
      const errorMessage = `Ошибка распаковки ${archivePath}: ${details}`;
      log?.(errorMessage, 'error');
      reject(new Error(errorMessage));
    });
  });
}

export async function findNestedArchives(folder: string, seen: Set<string>): Promise<string[]> {
  const results: string[] = [];
  
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    for (const entry of entries) {
      try {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await findNestedArchives(full, seen)));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ARCHIVE_EXT.has(ext) && !seen.has(full)) {
            results.push(full);
          }
        }
      } catch (entryError) {
        // Пропускаем проблемные файлы (например, с некорректными именами)
        console.warn(`Не удалось обработать файл в ${folder}:`, entry.name, entryError);
      }
    }
  } catch (error) {
    // Если не удалось прочитать директорию, возвращаем пустой массив
    console.warn(`Не удалось прочитать директорию ${folder}:`, error);
  }
  
  return results;
}

export async function extractArchive(
  archivePath: string,
  tempDir: string,
  log?: (message: string, level?: LogLevel) => void
): Promise<string> {
  const baseName = path.basename(archivePath, path.extname(archivePath));
  const dest = path.join(tempDir, baseName);
  await fs.remove(dest).catch(() => undefined);
  await extractWith7z(archivePath, dest, log);

  const seen = new Set<string>([archivePath]);
  const queue = await findNestedArchives(dest, seen);
  while (queue.length) {
    const nested = queue.pop() as string;
    seen.add(nested);
    const nestedDest = path.join(path.dirname(nested), path.basename(nested, path.extname(nested)));
    await extractWith7z(nested, nestedDest, log);
    await fs.remove(nested).catch(() => undefined);
    const more = await findNestedArchives(nestedDest, seen);
    queue.push(...more);
  }

  return dest;
}

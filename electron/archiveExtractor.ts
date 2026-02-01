import path from 'path';
import fs from 'fs-extra';
import { path7za } from '7zip-bin';
import { LogLevel } from './types';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Seven = require('node-7z');

const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z']);

async function extractWith7z(
  archivePath: string,
  dest: string,
  log?: (message: string, level?: LogLevel) => void
): Promise<void> {
  await fs.ensureDir(dest);
  return new Promise((resolve, reject) => {
    log?.(`Начинаем распаковку: ${archivePath}`);
    
    // Опции для корректной работы с Unicode и большими архивами
    const options = {
      $bin: path7za,
      recursive: true,
      // Флаги для корректной обработки Unicode путей (русские символы)
      charset: 'UTF-8',
      // Переключатели для 7z
      $raw: [
        '-sccUTF-8', // Console output charset UTF-8
        '-scsUTF-8', // Source archive charset UTF-8
      ],
      // Увеличиваем размер буфера для больших файлов
      $spawnOptions: {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer для stdout/stderr
        windowsHide: true,
      },
    };

    const stream = Seven.extractFull(archivePath, dest, options);
    
    let lastError: string | null = null;
    
    // Логируем прогресс для больших архивов
    stream.on('progress', (progress: { percent: number; fileCount: number }) => {
      if (progress.percent && progress.percent % 25 === 0) {
        log?.(`Распаковка ${path.basename(archivePath)}: ${progress.percent}%`);
      }
    });

    // Собираем данные об ошибках
    stream.on('data', (data: { status?: string; file?: string }) => {
      if (data.status && data.status.toLowerCase().includes('error')) {
        lastError = data.file || data.status;
      }
    });

    stream.on('end', () => {
      log?.(`Распакован архив ${archivePath} -> ${dest}`);
      resolve();
    });

    stream.on('error', (err: Error) => {
      const errorMessage = lastError 
        ? `Ошибка распаковки ${archivePath}: ${err.message}. Файл: ${lastError}`
        : `Ошибка распаковки ${archivePath}: ${err.message}`;
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

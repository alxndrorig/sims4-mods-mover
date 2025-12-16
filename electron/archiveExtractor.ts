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
    const stream = Seven.extractFull(archivePath, dest, { $bin: path7za, recursive: true });
    stream.on('end', () => {
      log?.(`Распакован архив ${archivePath} -> ${dest}`);
      resolve();
    });
    stream.on('error', (err: Error) => reject(err));
  });
}

export async function findNestedArchives(folder: string, seen: Set<string>): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(folder, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findNestedArchives(full, seen)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ARCHIVE_EXT.has(ext) && !seen.has(full)) {
        results.push(full);
      }
    }
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

# Sims 4 Mods Mover (Electron + React + TypeScript)

## 1. Описание приложения
Портативное настольное приложение для Windows, которое автоматически сортирует содержимое папки с новыми модами/архивами The Sims 4. Умеет:
- Сканировать выбранную папку.
- Определять типы файлов (моды, треи, сейвы, архивы, мусор, неизвестные).
- Рекурсивно распаковывать .zip/.rar/.7z, включая вложенные архивы.
- Удалять мусор (txt/jpg/png/pdf/url/ini/Thumbs.db/__MACOSX и т.д.).
- Перекладывать файлы в нужные папки Sims 4: Mods, Tray, Saves.
- Показывать предпросмотр и лог операций.
- Авто-режим (watcher): следит за папкой и автоматически раскладывает новые файлы.
- Портативная сборка .exe без установки.

## 2. Структура проекта
- `electron/main.ts` — создание окна, загрузка renderer, регистрация IPC.
- `electron/preload.ts` — безопасный мост IPC для renderer.
- `electron/ipcHandlers.ts` — обработчики IPC: scan-folder, move-files, extract-archive, get-config, set-config, watch-start, watch-stop, choose-folder.
- `electron/config.ts` — загрузка/сохранение `config.json`, дефолтные пути Sims 4 и temp.
- `electron/types.ts` — общие типы (FileType, ScanItem, MoveOperation, Config и др.).
- `electron/fileScanner.ts` — рекурсивный обход, классификация файлов, удаление мусора.
- `electron/archiveExtractor.ts` — распаковка zip/rar/7z через adm-zip + 7zip, поиск вложенных архивов.
- `electron/fileMover.ts` — перемещение с разрешением конфликтов имён, обработка архивов рекурсивно.
- `electron/watcher.ts` — chokidar watcher, автоскан и автосортировка при изменениях.
- `renderer/src` — React + Vite UI.
  - `App.tsx` — компоновка: сводка, таблица, настройки, логи, прогресс.
  - `components/` — Summary, FileTable, Settings, Logs, ProgressBar.
  - `store/appStore.ts` — Zustand store, вызовы IPC, состояние прогресса/логов/фильтров.
  - `api/ipcClient.ts` — вызовы IPC из renderer.
  - `styles.css` — базовые тёмные стили.
- `electron-builder.yml` — portable сборка для Windows.

## 3. Команды разработки
```bash
npm install
npm run dev      # Vite + Electron (ts-node) в режиме разработки
npm run build    # Сборка main/preload (tsc) и renderer (Vite)
npm run dist     # Полная сборка + electron-builder
```

## 4. Как собрать portable-версию для Windows
- Убедитесь, что установлены Node LTS и Windows 10/11.
- Выполните:
```bash
npm install
npm run dist
```
- Конфигурация `electron-builder.yml` (ключевые части):
```yaml
win:
  target: portable
  icon: build/icon.ico
portable:
  artifactName: "ModsMover.exe"
```
- Готовый файл появится в `dist/release`.

## 5. Как работает авто-режим (watcher)
- При включении watcher (`Settings` → чекбокс) запускается chokidar на папке `sourceDir`.
- При появлении/изменении файлов запускается скан, UI получает свежую сводку.
- Затем автоматически выполняется разборка: архивы распаковываются рекурсивно, мусор удаляется, нужные файлы перекладываются в Mods/Tray/Saves.
- Прогресс и логи транслируются в UI в реальном времени.

## 6. Как добавлять новые типы файлов/мусора
- Правила лежат в `electron/fileScanner.ts` (множества MOD_EXT, TRAY_EXT, SAVE_EXT, ARCHIVE_EXT, TRASH_EXT, TRASH_NAMES).
- Добавьте новое расширение в соответствующий Set и, при необходимости, логику в `classifyFile`.
- Соберите и перезапустите приложение.

## 7. Требования к окружению
- Node.js LTS (рекомендуется 20.x).
- Windows 10/11 для целевой portable-сборки (dev можно на macOS/Linux, но таргет — Windows).
- Для распаковки 7z/rar используется встроенный `7zip-bin` (портативно, без системных установок).

## Быстрый старт (dev)
```bash
npm install
npm run dev
# Vite доступен на http://localhost:5173, Electron загрузит его автоматически.
```

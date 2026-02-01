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
  artifactName: "ModsMoverPortable.exe"
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

## 8. Windows SmartScreen и предупреждение "Windows protected your PC"

При запуске `.exe` файла на Windows может появиться предупреждение:
> **Windows protected your PC**  
> Microsoft Defender SmartScreen prevented an unrecognized app from starting.

### Почему это происходит?
Это нормальное поведение для **неподписанных** приложений. SmartScreen использует:
1. **Цифровую подпись** — проверяет, подписан ли файл доверенным сертификатом.
2. **Репутацию** — новые/редкие файлы помечаются как потенциально опасные.

### Как запустить приложение?
1. Нажмите **"More info"** (Подробнее).
2. Нажмите **"Run anyway"** (Всё равно запустить).

### Как убрать предупреждение (для разработчиков)?
| Вариант | Стоимость | Результат |
|---------|-----------|-----------|
| **EV Code Signing Certificate** | ~$200-400/год | ✅ Убирает сразу |
| **Standard Code Signing Certificate** | ~$70-200/год | ⚠️ Убирает после накопления репутации |
| **Azure Trusted Signing** | Бесплатно (нужен Azure) | ✅ Работает |

Для подписи используйте workflow `.github/workflows/build-win-signed.yml` и настройте секреты:
- `WINDOWS_CERTIFICATE` — Base64 закодированный `.pfx` файл
- `WINDOWS_CERTIFICATE_PASSWORD` — пароль от сертификата

## 9. Оптимизация размера билда

### Почему билд большой?
Типичный размер portable `.exe` для Electron-приложения: **80-120 MB**

**Основные компоненты:**
- **Electron Framework** (~90-100MB) — Chromium + Node.js
- **7zip-bin** (~12MB) — нативные бинарники для распаковки архивов
- **Ваш код + зависимости** (~5-10MB)

### Применённые оптимизации

✅ **ASAR упаковка** — файлы приложения упакованы в архив (экономия ~30-40%)  
✅ **Исключение ненужных файлов** — `@types`, тесты, `.map`, `README`, `LICENSE`  
✅ **Максимальная компрессия** — `compression: maximum` в electron-builder  
✅ **Предотвращение рекурсии** — `dist/release` исключён из билда  
✅ **Удалены неиспользуемые зависимости** — `adm-zip` больше не нужен  
✅ **Фильтрация платформ** — бинарники 7zip удаляются для нецелевых OS (экономия ~8MB)

### Дополнительные способы уменьшения размера

1. **Отключить DevTools в production** (экономия ~5-10MB)
   ```typescript
   // electron/main.ts
   if (!isDev) {
     mainWindow.webContents.closeDevTools();
   }
   ```

2. **Использовать V8 snapshot** (продвинутая оптимизация)
   - Требует настройки `mksnapshot` в electron-builder

### Рекомендуемый размер
- **Portable .exe**: 60-90 MB (после оптимизаций)
- **Installer .exe**: 50-70 MB (с NSIS компрессией)

Используйте `npm run dist:clean` для чистой сборки с оптимизациями.

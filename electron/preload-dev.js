// Dev preload bootstrap: подключаем ts-node явно через require.resolve,
// чтобы Electron preload видел модуль даже в песочнице.
const path = require('path');

try {
  const tsNodeRegister = require.resolve('ts-node/register/transpile-only');
  require(tsNodeRegister);
  require(path.join(__dirname, 'preload.ts'));
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[preload-dev] failed to load preload.ts', err);
  throw err;
}

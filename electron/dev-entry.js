// Bootstrap для Electron в dev-режиме: вешаем ts-node hook и грузим main.ts
require('ts-node/register/transpile-only');
require('./main.ts');

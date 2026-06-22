const { copyFileSync, mkdirSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const source = resolve('node_modules/@mmote/niimbluelib/dist/umd/niimbluelib.min.js');
const destination = resolve('src/web/vendor/niimbluelib.min.js');

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const fs = require('fs');

const jindanDistPath = path.resolve(__dirname, '../../../dist/jindan.js');
const copyTargetPath = path.resolve(__dirname, '../dist/jindan.js');

if (fs.existsSync(jindanDistPath)) {
  fs.copyFileSync(jindanDistPath, copyTargetPath);
}

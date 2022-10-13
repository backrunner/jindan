/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const distPath = path.resolve(__dirname, '../dist/jindan.js');
const copyTargetPath = path.resolve(__dirname, '../packages/webpack-plugin/dist/jindan.js');
const copyTargetDirPath = path.dirname(distPath);

if (!fs.existsSync(distPath)) {
  throw new Error('Could not locate the dist file path.');
}

if (!fs.existsSync(copyTargetDirPath)) {
  fs.mkdirSync(copyTargetDirPath, { recursive: true });
}

const fileContent = fs.readFileSync(distPath, 'utf-8');

fs.writeFileSync(copyTargetPath, fileContent, { encoding: 'utf-8' });

console.log(chalk.green('Dist file has copied to webpack-plugin directory.'));

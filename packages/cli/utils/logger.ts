import chalk from 'chalk';

export default {
  info(...args) {
    console.log(chalk.cyan('[jindan]', ...args));
  },
  warn(...args) {
    console.warn(chalk.yellow('[jindan]', ...args));
  },
  error(...args) {
    console.error(chalk.red('[jindan]', ...args));
  },
  success(...args) {
    console.log(chalk.green('[jindan]', ...args));
  },
};

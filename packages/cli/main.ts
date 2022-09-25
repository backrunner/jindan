import path from 'path';
import fs from 'fs';
import { Command } from 'commander';
import { version } from './package.json';
import { generateManifest } from './modules/generate';
import logger from './utils/logger';

interface JinDanCliOptions {
  output?: string;
}

const program = new Command();

program.name('jindan-cli').version(version);

program
  .command('generate', { isDefault: true })
  .description('Generate a resource manifest based on the entry HTML file.')
  .argument('[inputHtmlPath]', 'The entry HTML file.')
  .option('-o, --output <path>', 'Manifest output path.')
  .action(async (inputHtmlPath: string | undefined, options: JinDanCliOptions) => {
    // build up the target path
    let targetHtmlPath = '';
    if (inputHtmlPath) {
      targetHtmlPath = path.resolve(process.cwd(), inputHtmlPath);
    } else {
      targetHtmlPath = path.resolve(process.cwd(), './dist/index.html');
    }
    if (!fs.existsSync(targetHtmlPath)) {
      throw new Error(`Could not find the target HTML entry: "${targetHtmlPath}"`);
    }
    // build up the output path
    let outputPath = path.resolve(process.cwd(), './jindan.manifest.json');
    if (options.output) {
      outputPath = path.resolve(process.cwd(), options.output);
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
    } else if (fs.existsSync(path.resolve(process.cwd(), './dist'))) {
      outputPath = path.resolve(process.cwd(), './dist/jindan.manifest.json');
    }
    // read the entry html file
    logger.info('Read the html files...');
    const html = fs.readFileSync(targetHtmlPath, { encoding: 'utf-8' });
    // generate the manifest file
    logger.info('Starting to generate the manifest...');
    const manifest = await generateManifest({
      content: html,
      htmlPath: targetHtmlPath,
    });
    logger.info('Manifest generated.');
    // write the manifest file
    logger.info('Writing the manifest file...');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    logger.success('Manifest file generated.');
  });

program.parse();

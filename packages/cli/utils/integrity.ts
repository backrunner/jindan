import * as crypto from 'crypto';
import fs from 'fs';

export const getIntegrity = (targetPath: string) => {
  const content = fs.readFileSync(targetPath, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('base64');
  return `sha256-${hash}`;
};

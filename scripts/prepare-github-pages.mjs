import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('dist', 'happy-grad-sweetie', 'browser');
await mkdir(outputDirectory, { recursive: true });

await Promise.all([
  copyFile(resolve('404.html'), resolve(outputDirectory, '404.html')),
  copyFile(resolve('.nojekyll'), resolve(outputDirectory, '.nojekyll')),
]);

console.log(`Prepared GitHub Pages files in ${outputDirectory}.`);

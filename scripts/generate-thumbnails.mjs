import { mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const imageDirectory = resolve('public', 'Image');
const thumbnailDirectory = join(imageDirectory, 'thumb');
const files = (await readdir(imageDirectory))
  .filter((file) => /^\d+\.jpg$/i.test(file))
  .sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));

if (files.length !== 34) {
  throw new Error(`Expected 34 original images in public/Image, received ${files.length}.`);
}

await mkdir(thumbnailDirectory, { recursive: true });

for (const file of files) {
  const source = join(imageDirectory, file);
  const destination = join(thumbnailDirectory, file);

  await sharp(source)
    .rotate()
    .resize({ width: 640, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toFile(destination);
}

console.log(`Created ${files.length} thumbnails in ${thumbnailDirectory}.`);

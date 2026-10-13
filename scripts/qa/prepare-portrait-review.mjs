// REVIEW ONLY: compose a candidate alpha mask with untouched source pixels.
// This script never writes public/Image or installs/changes the Hero asset.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(root, 'public/Image/original/1.jpg');
const maskPath = process.argv[2];
const attemptPath = process.argv[3];
if (!maskPath || !attemptPath) throw new Error('Usage: node scripts/qa/prepare-portrait-review.mjs <mask.png> <first-cutout.png>');
const output = path.join(root, 'qa/plan1/portrait-review-2026-10-11');
await mkdir(output, { recursive: true });
async function save(name, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const target = path.join(output, name);
  try { await writeFile(target, bytes, { flag: 'wx' }); } catch (error) {
    if (error.code !== 'EEXIST' || !(await readFile(target)).equals(bytes)) throw error;
  }
}
await save('generated-mask-attempt-2.png', await readFile(maskPath));
await save('generated-cutout-attempt-1-rejected.png', await readFile(attemptPath));
const sourceBytes = await readFile(source);
const originalHash = createHash('sha256').update(sourceBytes).digest('hex');
const { data: rgb, info } = await sharp(sourceBytes).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
const { data: alpha } = await sharp(maskPath).removeAlpha().greyscale()
  .resize(info.width, info.height, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);
for (let pixel = 0; pixel < info.width * info.height; pixel++) {
  rgba[pixel * 4] = rgb[pixel * 3]; rgba[pixel * 4 + 1] = rgb[pixel * 3 + 1];
  rgba[pixel * 4 + 2] = rgb[pixel * 3 + 2]; rgba[pixel * 4 + 3] = alpha[pixel];
}
const candidate = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
const png = await candidate.clone().png().toBuffer();
const webp = await candidate.clone().webp({ quality: 92, alphaQuality: 100 }).toBuffer();
await save('candidate-NOT-APPROVED.png', png);
await save('candidate-NOT-APPROVED.webp', webp);

const backgrounds = { ivory: '#FFF9F3', blush: '#EAB8BE', lavender: '#E7E0F1', navy: '#27324B' };
for (const [name, background] of Object.entries(backgrounds)) {
  const preview = await sharp(png).resize({ height: 1200 }).flatten({ background }).png().toBuffer();
  await save(`candidate-${name}.png`, preview);
}
const difference = await sharp(sourceBytes).composite([{ input: png, blend: 'difference' }]).png().toBuffer();
const overlay = await sharp(difference).resize({ height: 1200 }).png().toBuffer();
await save('alignment-difference.png', overlay);
const decoded = await sharp(png).raw().toBuffer();
let rgbDifferences = 0;
for (let pixel = 0; pixel < info.width * info.height; pixel++) {
  for (let channel = 0; channel < 3; channel++) {
    if (decoded[pixel * 4 + channel] !== rgb[pixel * 3 + channel]) rgbDifferences++;
  }
}
const result = { status: 'PENDING_VISUAL_REVIEW_NOT_FOR_PRODUCTION', source: 'public/Image/original/1.jpg',
  sourceSha256: originalHash, width: info.width, height: info.height,
  sourceRgbDifferentChannels: rgbDifferences, pngBytes: png.length, webpBytes: webp.length,
  notes: ['Generated mask resized to source dimensions, no deformation of source RGB.',
    'RGB identity does NOT prove mask alignment or quality. Background contamination/holes require visual review.',
    'No asset copied into public/Image/hero; no Hero source code changed.'] };
await save('review-metadata.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ output, ...result }, null, 2));

// Read-only inputs; writes review evidence only, never production assets.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const inputPath = resolve(root, 'public/Image/original/canva.png');
const sourcePath = resolve(root, 'public/Image/original/1.jpg');
const output = resolve(root, 'qa/plan1/portrait-canva-2026-10-11/received-533x800');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const [input, source, baseline] = await Promise.all([
  readFile(inputPath),
  readFile(sourcePath),
  readFile(resolve(root, 'qa/plan1/baseline-2026-10-11/baseline.json'), 'utf8').then(JSON.parse),
]);
const metadata = await sharp(input).metadata();
const sourceMetadata = await sharp(source).metadata();
if (metadata.width !== 533 || metadata.height !== 800 || !metadata.hasAlpha) {
  throw new Error(
    'Review regions are for the received 533x800 RGBA PNG only; inspect a new file separately.',
  );
}
const preservation = await Promise.all(
  baseline.assets.map(async (asset) => ({
    path: asset.path,
    unchanged: hash(await readFile(resolve(root, asset.path))) === asset.sha256,
  })),
);
if (preservation.some((asset) => !asset.unchanged))
  throw new Error('A baseline image changed; inspect before continuing.');

await mkdir(output, { recursive: true });
async function save(name, bytes) {
  const target = resolve(output, name);
  if (!relative(output, target) || relative(output, target).startsWith('..'))
    throw new Error('Invalid output path');
  try {
    await writeFile(target, bytes, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST' || !Buffer.from(bytes).equals(await readFile(target))) throw error;
  }
}
const rgba = await sharp(input).toColourspace('srgb').ensureAlpha().raw().toBuffer();
const sourceSized = await sharp(source)
  .resize(533, 800, { fit: 'fill' })
  .toColourspace('srgb')
  .ensureAlpha()
  .raw()
  .toBuffer();
let opaque = 0,
  transparent = 0,
  partial = 0,
  absoluteDifference = 0;
for (let i = 0; i < rgba.length; i += 4) {
  const alpha = rgba[i + 3];
  if (alpha === 0) transparent++;
  else if (alpha < 255) partial++;
  else {
    opaque++;
    for (let c = 0; c < 3; c++) absoluteDifference += Math.abs(rgba[i + c] - sourceSized[i + c]);
  }
}
const backgrounds = { ivory: '#FFF9F3', blush: '#EAB8BE', lavender: '#E7E0F1', navy: '#27324B' };
const panels = [];
for (const [index, [name, background]] of Object.entries(backgrounds).entries()) {
  const full = await sharp(input).flatten({ background }).png().toBuffer();
  await save(`received-${name}.png`, full);
  panels.push({
    input: await sharp(full).resize(266, 400).png().toBuffer(),
    left: index * 266,
    top: 0,
  });
}
await save(
  'four-backgrounds.png',
  await sharp({ create: { width: 1064, height: 400, channels: 3, background: '#FFF9F3' } })
    .composite(panels)
    .png()
    .toBuffer(),
);

const reference = await sharp(sourceSized, { raw: { width: 533, height: 800, channels: 4 } })
  .png()
  .toBuffer();
const flattened = await sharp(input).flatten({ background: backgrounds.navy }).png().toBuffer();
for (const [name, region] of Object.entries({
  'cap-hair-tassel': { left: 85, top: 120, width: 315, height: 350 },
  'hands-table': { left: 265, top: 635, width: 268, height: 165 },
})) {
  const width = region.width * 2;
  const height = region.height * 2;
  const originals = await Promise.all(
    [reference, flattened].map((bytes) =>
      sharp(bytes).extract(region).resize(width, height, { kernel: 'nearest' }).png().toBuffer(),
    ),
  );
  await save(
    `${name}-200-percent.png`,
    await sharp({ create: { width: width * 2, height, channels: 3, background: backgrounds.navy } })
      .composite(originals.map((bytes, index) => ({ input: bytes, left: width * index, top: 0 })))
      .png()
      .toBuffer(),
  );
}
const report = {
  status: 'NOT_APPROVED_LOW_RESOLUTION_AND_TABLE_RETAINED',
  input: {
    path: relative(root, inputPath).replaceAll('\\', '/'),
    sha256: hash(input),
    bytes: input.length,
    width: metadata.width,
    height: metadata.height,
  },
  source: {
    path: 'public/Image/original/1.jpg',
    sha256: hash(source),
    width: sourceMetadata.width,
    height: sourceMetadata.height,
  },
  alpha: { transparentPixels: transparent, partialPixels: partial, opaquePixels: opaque },
  diagnosticOnly: {
    description:
      'Comparison against a downsampled source, not proof of full-resolution alignment or exact source RGB. Different resize/color pipelines affect this number.',
    opaqueMeanAbsoluteChannelDifference: Number(
      (absoluteDifference / Math.max(1, opaque * 3)).toFixed(4),
    ),
  },
  baselineAssetCount: preservation.length,
  baselineAssetsUnchanged: preservation.every((asset) => asset.unchanged),
  inputModified: false,
  productionAssetsWritten: false,
  userApproval: false,
};
await save('inspection.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));

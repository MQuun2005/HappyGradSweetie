// Read-only verification; reports failures instead of treating collector completion as a pass.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const main = await read(process.argv[2]);
const interactions = await read(process.argv[3]);
const baseline = await read('qa/plan1/hero-2026-10-11-final/hero.json');
const failures = [];
const check = (condition, label) => { if (!condition) failures.push(label); };
const alignment = main.profiles.flatMap(p => (p.alignment ?? []).map(a => ({ profile: p.name, ...a })));
for (const report of [main, interactions]) {
  check(report.errors.length === 0, 'Collector error');
  for (const profile of report.profiles) {
    check(profile.errors.length === 0, `Runtime/network: ${profile.name}`);
    check(profile.network.every(response => response.status < 400), `HTTP failure: ${profile.name}`);
  }
}
for (const row of alignment) check(row.error <= 4, `Alignment: ${JSON.stringify(row)}`);
for (const p of main.profiles.filter(p => p.baseline)) {
  for (const sample of [p.baseline, ...p.storySamples]) {
    check(sample.pinSpacers === 0, `Unexpected pin spacer: ${p.name}`);
    check(sample.portraitCount === 1 && sample.portrait.naturalWidth > 0, `Portrait: ${p.name}`);
    check(sample.scrollHeight === p.baseline.scrollHeight, `Scroll height changed: ${p.name}`);
  }
}
for (const p of interactions.profiles.filter(p => p.beforeModal)) {
  check(Math.abs(p.beforeModal.scrollY - p.afterModal.scrollY) <= 1, `Modal restoration: ${p.name}`);
  check(p.afterModal.focused.includes('photo-card'), `Focus return: ${p.name}`);
  check(p.focusTrap.length === 8 && p.focusTrap.every(Boolean), `Focus trap: ${p.name}`);
  check(p.replay.scrollY === 0, `Replay: ${p.name}`);
  for (const sample of p.longReading) check(Math.abs(sample.target - sample.y) <= 1, `Long reading: ${p.name}`);
  if (p.touch) {
    check(p.horizontal.before === p.horizontal.after && !p.horizontal.lightbox, `Horizontal gesture: ${p.name}`);
    check(p.verticalInGallery.after > p.verticalInGallery.before + 100, `Vertical gesture: ${p.name}`);
  }
}
const originals = baseline.assets.filter(a => /\/\d+\.jpg$/.test(a.path));
check(originals.length === 68, 'Baseline must contain 34 originals + 34 thumbnails');
for (const asset of originals) {
  const hash = createHash('sha256').update(await readFile(path.join(root, asset.path))).digest('hex');
  check(hash === asset.sha256, `Changed personal asset: ${asset.path}`);
}
const sources = [];
async function fingerprint(directory) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const file = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) await fingerprint(file);
    else sources.push({ file, sha256: createHash('sha256').update(await readFile(path.join(root, file))).digest('hex') });
  }
}
await fingerprint('src');
console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), alignmentCases: alignment.length,
  maxAlignmentError: Math.max(...alignment.map(a => a.error)), unchangedPhotos: originals.length,
  failures, sources }, null, 2));
if (failures.length) process.exitCode = 1;

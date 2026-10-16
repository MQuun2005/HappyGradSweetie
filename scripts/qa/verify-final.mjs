// Immutable handoff manifest. Earlier full-loop/lifecycle captures explicitly
// predate only the invitation ribbon spacing fix; never relabel them as a rerun.
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const checks = [],
  evidence = [],
  media = [],
  diagnostics = [];
const check = (passed, label, actual) =>
  checks.push({ label, passed: !!passed, ...(actual === undefined ? {} : { actual }) });
const read = async (f) => JSON.parse(await readFile(f, 'utf8'));
const digest = (b) => createHash('sha256').update(b).digest('hex');
const hash = async (f) => digest(await readFile(f));
const old = await read('qa/plan1/hero-2026-10-11-final/hero.json');
const assets = old.assets.filter((a) => /\/\d+\.jpg$/.test(a.path));
check(assets.length === 68, '34 original + 34 thumbnail baselines');
for (const a of assets) check((await hash(a.path)) === a.sha256, 'Unchanged asset: ' + a.path);
check(
  (await hash('public/Image/hero/mai-khue-cutout.png')) ===
    'c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011',
  'Approved Hero PNG unchanged',
);
check(
  (await hash('Docs/Notes/note4.txt')) ===
    '883ebbb06d693cb75a47101ca30b2b4c5fa39556c56af62a9498782b64bbd7a1',
  'Approved note4 unchanged',
);
const contentFile = 'src/app/data/celebration-content.ts';
const contentCapture = await read('qa/plan1/content-2026-10-14-final/content.json');
check(
  (await hash(contentFile)) === contentCapture.sources.find((s) => s.file === contentFile).sha256,
  'Phase 6 approved personal content unchanged',
);
const js = ts.transpileModule(await readFile(contentFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const content = (await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64')))
  .celebrationContent;
const audio = 'public/' + content.music.src;
check(
  (await hash(audio)) ===
    digest(execFileSync('git', ['show', 'HEAD:' + audio], { maxBuffer: 100 * 1024 * 1024 })),
  'Audio bytes unchanged from Git checkpoint',
);
const captures = [
  ['final-journey-2026-10-15-handoff', false],
  ['final-scroll-2026-10-15-handoff', false],
  ['final-contrast-2026-10-15-handoff', false],
  ['final-loop-2026-10-15-pass1', true],
  ['final-lifecycle-2026-10-15-final', true],
  ['final-resilience-2026-10-15-final', true],
  ['final-lifecycle-2026-10-15-soak', false],
  ['final-heap-2026-10-15-diagnostic', false],
];
for (const [name, beforeRibbon] of captures) {
  const file = 'qa/plan1/' + name + '/final.json',
    r = await read(file),
    diff = [];
  check(!r.errors.length, name + ' collector completed', r.errors);
  check(r.checks.length > 0 && r.checks.every((c) => c.passed), name + ' assertions passed', {
    checks: r.checks.length,
    failed: r.failed,
  });
  for (const s of r.sources) {
    const current = await hash(s.file);
    if (current !== s.sha256) diff.push({ file: s.file, captured: s.sha256, current });
  }
  check(
    beforeRibbon
      ? diff.every(
          (d) => d.file === 'src/app/components/graduation-invitation/graduation-invitation.css',
        )
      : diff.length === 0,
    name + ' source provenance',
    diff,
  );
  if (!beforeRibbon)
    for (const a of r.artifact)
      check(
        (await hash('dist/happy-grad-sweetie/browser/' + a.file)) === a.sha256,
        name + ' built artifact ' + a.file,
      );
  evidence.push({
    file,
    sha256: await hash(file),
    checks: r.checks.length,
    sourceDifferences: diff,
    scope: beforeRibbon
      ? 'Before ribbon padding only; application logic/Gallery/audio/Lightbox source unchanged. Not a full-loop rerun of the final bundle.'
      : 'Exact handoff source and built artifact',
  });
}
const heapDir = 'qa/plan1/final-heap-2026-10-15-diagnostic/';
const heapComparison = await read(heapDir + 'comparison-retainers.json');
for (const snapshot of [heapComparison.before, heapComparison.after]) {
  check(
    (await hash(snapshot.file)) === snapshot.sha256,
    'Heap comparison input unchanged: ' + snapshot.file,
  );
  diagnostics.push({ file: snapshot.file, sha256: snapshot.sha256 });
}
diagnostics.push({
  file: heapDir + 'comparison-retainers.json',
  sha256: await hash(heapDir + 'comparison-retainers.json'),
  scope:
    'Shallow-size comparison and selected strong retainer paths, not dominator/retained-size or long-term leak-free proof',
  totals: heapComparison.totals,
  byType: heapComparison.byType,
});
for (const file of [
  'qa/plan1/final-loop-2026-10-15-pass1/gallery-45s.webm',
  ...['desktop', 'iphone', 'ipad-p'].map(
    (name) => 'qa/plan1/final-journey-2026-10-15-handoff/' + name + '-journey.webm',
  ),
]) {
  const bytes = await readFile(file),
    metadata = await read(file + '.json');
  check(
    bytes.subarray(0, 4).toString('hex') === '1a45dfa3' && metadata.frames > 0,
    'Encoded video container: ' + file,
  );
  media.push({ file, bytes: bytes.length, sha256: digest(bytes), metadata });
}
check(
  (await readFile('dist/happy-grad-sweetie/browser/index.html', 'utf8')).includes(
    '<base href="/HappyGradSweetie/">',
  ),
  'Pages base path',
);
const report = {
  date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Saigon' }).format(new Date()),
  timezone: 'Asia/Saigon',
  createdAt: new Date().toISOString(),
  checks,
  failed: checks.filter((c) => !c.passed),
  evidence,
  media,
  diagnostics,
  userReview: {
    recordedDate: '2026-10-16',
    response: 'Duyệt bản Chromium, giữ Safari Pending',
    scope: 'Chromium creative review approved; subsequent device waiver recorded separately',
    source:
      'Explicit human reply to Phase 7 Final Creative Review question, recorded in Docs/Reviews/plan1/PHASE7-FINAL-QA.md',
  },
  waivers: [
    {
      date: '2026-10-16',
      scope:
        'Physical Safari/iPhone/iPad, hardware safe area/toolbar, pinch/real trackpad, audible device audio',
      response:
        'bỏ qua phần kiểm chứng trên thiết bị thật đi, hãy hoàn thành tất cả. Nếu xong rồi, hãy commit, push code theo từng phase đi',
      status: 'Waived by user, not tested and not passed',
    },
  ],
  pending: [],
  limitations: [
    'Physical devices not tested; no cross-browser guarantee',
    'Long-term heap plateau not proven; snapshots identify mainly compiled-code and browser/inspector growth, not a confirmed app leak',
  ],
  note: 'Unit/build outcomes are recorded separately in the review, not inferred from this verifier.',
};
await writeFile(
  process.argv[2] ?? 'qa/plan1/PHASE7-VERIFICATION-v3.json',
  JSON.stringify(report, null, 2),
  { flag: 'wx' },
);
console.log(
  JSON.stringify(
    {
      checks: checks.length,
      failed: report.failed,
      evidence: evidence.map((e) => ({
        file: e.file,
        checks: e.checks,
        sourceDifferences: e.sourceDifferences.map((d) => d.file),
      })),
    },
    null,
    2,
  ),
);
if (report.failed.length) process.exitCode = 1;

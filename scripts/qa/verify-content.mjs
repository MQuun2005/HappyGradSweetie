// Read-only verifier: produces JSON on stdout; does not rewrite historical evidence.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const checks = [],
  failures = [];
const check = (passed, label) => {
  checks.push({ label, passed: !!passed });
  if (!passed) failures.push(label);
};
const read = async (file) => JSON.parse(await readFile(file, 'utf8'));
const hash = async (file) =>
  createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
const loadContent = async (source) => {
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return (await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64')))
    .celebrationContent;
};
const contentFile = 'src/app/data/celebration-content.ts';
const content = await loadContent(await readFile(contentFile, 'utf8'));
const previous = await loadContent(
  execFileSync('git', ['show', `1251d20:${contentFile}`], { encoding: 'utf8' }),
);
const brief = (await readFile('Docs/Notes/note4.txt', 'utf8')).replaceAll('\r\n', '\n');
const copy = [];
for (const group of ['intro', 'invitation', 'message', 'gallery', 'letter', 'closing']) {
  for (const [key, value] of Object.entries(content[group])) {
    for (const [index, text] of (Array.isArray(value) ? value : [value]).entries()) {
      check(
        brief.includes(text),
        `Approved brief: ${group}.${key}${Array.isArray(value) ? '.' + index : ''}`,
      );
      copy.push(text);
    }
  }
}
check(
  JSON.stringify(content.hero) === JSON.stringify(previous.hero),
  'Approved Hero data unchanged',
);
check(
  JSON.stringify(content.music) === JSON.stringify(previous.music),
  'Audio path/config unchanged',
);
check(content.photos.length === 34, '34 photos');
check(
  content.photos
    .filter((p) => p.caption)
    .map((p) => p.id)
    .join(',') === '1,5,9,14,18,23,29,34',
  'Caption ID set unchanged',
);
for (const photo of content.photos) {
  const { caption, ...record } = photo,
    { caption: oldCaption, ...oldRecord } = previous.photos.find((p) => p.id === photo.id);
  check(
    JSON.stringify(record) === JSON.stringify(oldRecord),
    `Photo ${photo.id}: metadata/paths unchanged`,
  );
  if (caption) check(brief.includes(caption), `Photo ${photo.id}: caption from approved samples`);
}
check(content.letter.paragraphs.length === 4, 'Four complete letter paragraphs');
check(content.letter.signature === 'Thương vợ iu rất nhiều,\nQuân iu', 'Two-line signature');
check(!/(?:\+84|\b0)[\d .-]{8,}\b/.test(copy.join(' ')), 'No contact number in copy');
const baseline = await read('qa/plan1/hero-2026-10-11-final/hero.json');
const assets = baseline.assets.filter((a) => /\/\d+\.jpg$/.test(a.path));
check(assets.length === 68, '68 original/thumbnail baselines');
for (const a of assets) check((await hash(a.path)) === a.sha256, `Asset unchanged: ${a.path}`);
check(
  (await hash('public/Image/hero/mai-khue-cutout.png')) ===
    'c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011',
  'Approved portrait unchanged',
);
check(
  (await hash('Docs/Notes/note4.txt')) ===
    '883ebbb06d693cb75a47101ca30b2b4c5fa39556c56af62a9498782b64bbd7a1',
  'Original brief unchanged',
);

const reportFile = process.argv[2];
if (!reportFile) throw Error('Pass the content.json browser capture to verify');
const r = await read(reportFile);
check(!r.errors.length, 'Collector completed');
check(r.profiles.length === 9, 'Nine content QA profiles');
for (const source of r.sources)
  check(
    (await hash(source.file)) === source.sha256,
    `Capture matches current source: ${source.file}`,
  );
for (const p of r.profiles) {
  check(!p.errors.length, `Console/runtime/network: ${p.name}`);
  check(
    p.network.every((n) => n.status < 400),
    `HTTP assets: ${p.name}`,
  );
  check(p.sections.length === 6, `Six chapters: ${p.name}`);
  const button = p.intro.text.find((t) => t.tag === 'BUTTON');
  check(button.y >= 0 && button.bottom <= p.height + 1, `Intro action reachable: ${p.name}`);
  check(p.introScroll.overflow === 'auto', `Intro native scroll: ${p.name}`);
  check(
    p.introTop.text.every((t) => t.y >= 0),
    `Intro first lines reachable: ${p.name}`,
  );
  for (const s of p.sections) {
    check(
      s.width <= p.width + 1 && s.scrollWidth <= p.width + 1,
      `No widened viewport/overflow: ${p.name}/${s.id}`,
    );
    check(
      s.text.every((t) => !t.clippedInline),
      `No inline text clipping: ${p.name}/${s.id}`,
    );
    check(
      s.text.every((t) => Number(t.opacity) > 0.99),
      `Text revealed: ${p.name}/${s.id}`,
    );
    if (s.id === 'letter') {
      check(s.signature === content.letter.signature, `Signature DOM: ${p.name}`);
      check(
        s.text.find((t) => t.tag === 'FOOTER')?.whiteSpace === 'pre-line',
        `Signature CSS: ${p.name}`,
      );
      check(
        content.letter.paragraphs.every((text) => s.text.some((t) => t.text === text)),
        `Complete Letter DOM: ${p.name}`,
      );
      if (s.section.height > p.height * 1.12)
        check(
          Math.abs(p.letterReading.after - p.letterReading.before) <= 1,
          `Long letter reading position: ${p.name}`,
        );
    }
    if (s.id === 'memories') {
      check(s.cardCount <= 11, `Virtual window bounded: ${p.name}`);
      check(
        s.text.some((t) => t.text.includes(content.gallery.instruction)),
        `Gallery instruction DOM: ${p.name}`,
      );
    }
    if (s.id === 'closing')
      check(
        s.text.some((t) => t.text === content.closing.finalHighlight),
        `Closing highlight DOM: ${p.name}`,
      );
  }
  check(p.audioBefore.count === 1 && p.audioAfter.count === 1, `Single audio: ${p.name}`);
  if (!p.audioBefore.paused)
    check(p.audioAfter.time >= p.audioBefore.time, `Audio not reset by chapters: ${p.name}`);
}
console.log(
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      reportFile,
      checks: checks.length,
      failures,
      details: checks,
      limitations: r.limitations,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;

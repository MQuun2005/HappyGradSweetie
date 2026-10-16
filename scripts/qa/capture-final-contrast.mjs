// Computed styles + conservative solid-pastel contrast bounds. Not a full WCAG audit.
import { startQA, wait } from './browser-session.mjs';
const qa = await startQA(process.argv[2], process.argv[3]),
  checks = [];
const { evaluate, send, until, capture } = qa;
const colors = {
  ivory: '#fff9f3',
  card: '#f7ede3',
  blush: '#eab8be',
  peach: '#f4ccb9',
  lavender: '#e7e0f1',
  white: '#ffffff',
};
const rgb = (s) =>
  s.startsWith('#')
    ? s
        .slice(1)
        .match(/../g)
        .map((c) => parseInt(c, 16))
    : s
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
const luminance = (s) =>
  rgb(s)
    .map((c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
try {
  for (const [name, width, height, touch] of [
    ['desktop', 1440, 900, false],
    ['iphone', 393, 852, true],
    ['ipad', 820, 1180, true],
  ]) {
    const p = qa.case(name, { samples: [] });
    await qa.viewport(width, height, touch);
    await send('Page.navigate', { url: qa.url.href });
    await until('!!document.querySelector("#home")');
    if (!(await evaluate('!!document.querySelector(".gift-intro")'))) {
      await evaluate('sessionStorage.clear()');
      await send('Page.reload');
      await until('!!document.querySelector(".gift-intro")');
    }
    await evaluate('document.fonts.ready.then(()=>true)');
    await wait(500);
    const sample = async (selector, backgrounds) => {
      const actual = await evaluate(
        `(()=>{const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e);return{color:s.color,background:s.backgroundColor,fontSize:s.fontSize,text:e.textContent.trim()}})()`,
      );
      const ratios = backgrounds.map((b) => ({ background: b, ratio: ratio(actual.color, b) }));
      p.samples.push({ selector, ...actual, ratios });
      checks.push({
        label: name + ' ' + selector + ' >=4.5',
        passed: ratios.every((r) => r.ratio >= 4.5),
      });
    };
    await sample('.gift-intro__eyebrow', Object.values(colors));
    const button = await evaluate(
      `(()=>{const s=getComputedStyle(document.querySelector('.gift-intro button'));return{color:s.color,background:s.backgroundColor}})()`,
    );
    p.button = { ...button, ratio: ratio(button.color, button.background) };
    checks.push({ label: name + ' gift button >=4.5', passed: p.button.ratio >= 4.5 });
    await capture(name + '-intro-navy');
    await qa.click('.gift-intro button', touch);
    await until('!document.querySelector(".gift-intro")');
    await wait(1400);
    for (const [id, selectors] of [
      ['home', ['.hero__eyebrow', '.hero__subheading']],
      ['invitation', ['.invitation__eyebrow', '.invitation__degree']],
      ['message', ['#message .section__eyebrow']],
      ['memories', ['.gallery__eyebrow']],
      ['letter', ['.letter__eyebrow']],
    ]) {
      await evaluate(`document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);
      await wait(700);
      for (const selector of selectors) await sample(selector, Object.values(colors));
      await capture(name + '-' + id + '-navy');
    }
    checks.push({ label: name + ' no unexpected errors', passed: !p.errors.length });
  }
} catch (error) {
  qa.report.errors.push(String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  qa.report.checks = checks;
  qa.report.failed = checks.filter((c) => !c.passed);
  if (qa.report.failed.length) process.exitCode = 1;
  await qa.close();
}

// Local-only visual evidence collector. Uses the installed Edge/Chromium and ws
// already present in the project's tooling; no application changes or uploads.
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const root = fileURLToPath(new URL('../../', import.meta.url));
const url = new URL(process.argv[2] ?? 'http://127.0.0.1:4201/');
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
  throw new Error('This QA collector only navigates to a local preview.');
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(root, process.argv[3] ?? `qa/plan1/baseline-${stamp}`);
if (!output.startsWith(path.resolve(root) + path.sep) || existsSync(output)) {
  throw new Error('Choose a new output directory inside this project; existing evidence is never overwritten.');
}
const executable = process.env.HAPPYGRAD_QA_BROWSER ??
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(executable)) throw new Error('Set HAPPYGRAD_QA_BROWSER to an installed Chromium browser.');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), 'happygrad-baseline-'));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  capturedAt: new Date().toISOString(), url: url.href,
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  localDiff: execFileSync('git', ['diff', '--', 'src'], { cwd: root, encoding: 'utf8' }),
  renderer: 'Headless Chromium / Edge; viewport and touch emulation, NOT Safari or real iOS/iPadOS.',
  limitations: ['Dev-server build, not a production performance benchmark.',
    'Gallery motion evidence is a timed screenshot sequence, not a continuous video.',
    'No real trackpad, Safari toolbar, safe-area hardware or physical orientation testing.'],
  assets: [], profiles: [], errors: [],
};
for (const directory of ['public/Image/original', 'public/Image/thumb']) {
  for (const name of (await readdir(path.join(root, directory))).sort()) {
    const asset = path.join(directory, name);
    const bytes = await readFile(path.join(root, asset));
    report.assets.push({ path: asset.replaceAll('\\', '/'), bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex') });
  }
}

const browser = spawn(executable, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let browserLog = '';
let socket;
let nextId = 0;
const pending = new Map();
const listeners = new Map();
let sessionId;
let currentProfile;

async function send(method, params = {}, session = sessionId) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression, timeout = 15000) {
  const end = Date.now() + timeout;
  do {
    if (await evaluate(expression)) return;
    await wait(100);
  } while (Date.now() < end);
  throw new Error(`Condition not met: ${expression}`);
}
async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64'), { flag: 'wx' });
  return `${name}.png`;
}
async function click(selector) {
  const point = await evaluate(`(() => {const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
}
const metrics = `(() => {
  const box = (el) => { if (!el) return null; const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}; };
  const audio=document.querySelector('audio');
  return {url:location.href,scrollY,viewport:{width:innerWidth,height:innerHeight,visualHeight:visualViewport?.height},
    overflow:document.documentElement.scrollWidth>innerWidth,
    coarse:matchMedia('(pointer: coarse)').matches,hover:matchMedia('(hover: hover)').matches,
    fonts:document.fonts.status,audio:audio?{paused:audio.paused,readyState:audio.readyState,error:audio.error?.message,volume:audio.volume}:null,
    activeSection:document.querySelector('[aria-current="step"]')?.getAttribute('aria-label'),
    sections:[...document.querySelectorAll('main section[id]')].map(el=>({id:el.id,...box(el)})),
    scene:box(document.querySelector('.gallery__scene')),
    stageTransform:getComputedStyle(document.querySelector('.gallery__stage')).transform,
    cards:[...document.querySelectorAll('.photo-card')].map(el=>{const image=el.querySelector('img');const style=getComputedStyle(el);return {
      logicalIndex:el.dataset.logicalIndex,src:image?.currentSrc,complete:image?.complete,naturalWidth:image?.naturalWidth,
      front:el.classList.contains('photo-card--front'),transform:style.transform,opacity:style.opacity,...box(el)};})};
})()`;

try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Browser did not start: ${browserLog.slice(-2500)}`)), 20000);
    browser.stderr.on('data', (data) => {
      browserLog = (browserLog + data.toString()).slice(-12000);
      const match = browserLog.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    browser.once('error', reject);
    browser.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Browser exited ${code}: ${browserLog.slice(-2000)}`)); });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    if (message.id) {
      const task = pending.get(message.id);
      if (!task) return;
      clearTimeout(task.timer); pending.delete(message.id);
      if (message.error) task.reject(new Error(JSON.stringify(message.error))); else task.resolve(message.result);
    } else {
      listeners.get(message.method)?.(message.params);
    }
  });
  report.browser = await send('Browser.getVersion', {}, null);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }, null));
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  listeners.set('Runtime.exceptionThrown', (event) => currentProfile?.errors.push({ kind: 'runtime', detail: event.exceptionDetails }));
  listeners.set('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error') currentProfile?.errors.push({ kind: 'browser', text: entry.text, url: entry.url });
  });
  listeners.set('Network.responseReceived', ({ response, type }) => {
    currentProfile?.network.push({ url: response.url, status: response.status, type, mimeType: response.mimeType,
      fromDiskCache: response.fromDiskCache ?? false });
  });
  listeners.set('Network.loadingFailed', ({ errorText, canceled, type }) => {
    if (!canceled) currentProfile?.errors.push({ kind: 'network', errorText, type });
  });
  const profiles = [
    ['desktop-1366', 1366, 768, false], ['desktop-1440', 1440, 900, false],
    ['desktop-1920', 1920, 1080, false], ['iphone-portrait', 393, 852, true],
    ['iphone-landscape', 852, 393, true], ['ipad-portrait', 820, 1180, true],
    ['ipad-landscape', 1180, 820, true],
  ];
  for (const [name, width, height, touch] of profiles) {
    console.log(`Capturing ${name}: ${width}x${height}`);
    currentProfile = { name, width, height, touch, screenshots: [], snapshots: [], network: [], errors: [] };
    report.profiles.push(currentProfile);
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
    await send('Page.navigate', { url: 'about:blank' });
    await send('Page.navigate', { url: url.href });
    await until('!!document.querySelector("#home") && !!document.querySelector(".gift-intro")');
    await evaluate('Promise.race([document.fonts.ready.then(()=>true),new Promise(r=>setTimeout(()=>r(false),8000))])');
    await wait(500);
    currentProfile.screenshots.push(await screenshot(`${name}-00-intro`));
    await click('.gift-intro button');
    await until('!document.querySelector(".gift-intro")');
    await wait(800);
    for (const section of ['home', 'invitation', 'message', 'memories', 'letter', 'closing']) {
      await evaluate(`document.getElementById('${section}').scrollIntoView({behavior:'instant',block:'start'})`);
      await wait(900);
      currentProfile.screenshots.push(await screenshot(`${name}-${section}`));
      currentProfile.snapshots.push({ section, ...(await evaluate(metrics)) });
    }
    await evaluate("document.getElementById('memories').scrollIntoView({behavior:'instant',block:'start'})");
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await wait(1000);
    if (name === 'desktop-1440') {
      currentProfile.motion = [];
      const started = Date.now();
      for (const seconds of [0, 5, 15, 30]) {
        await wait(Math.max(0, seconds * 1000 - (Date.now() - started)));
        currentProfile.motion.push({ seconds: (Date.now() - started) / 1000, metrics: await evaluate(metrics),
          screenshot: await screenshot(`${name}-motion-${seconds}s`) });
        console.log(`Motion snapshot ${seconds}s`);
      }
    }
    const front = await evaluate("[...document.querySelectorAll('.photo-card--front')].findIndex(el=>el.getAttribute('aria-current')==='true')");
    if (front >= 0) {
      const selector = '.photo-card[aria-current="true"]';
      await click(selector);
      await wait(600);
      currentProfile.lightboxOpened = await evaluate('!!document.querySelector(".lightbox")');
      if (currentProfile.lightboxOpened) {
        await until('document.querySelector(".lightbox img")?.naturalWidth>0');
        currentProfile.screenshots.push(await screenshot(`${name}-lightbox`));
        currentProfile.lightbox = await evaluate("({src:document.querySelector('.lightbox img').currentSrc,naturalWidth:document.querySelector('.lightbox img').naturalWidth,bodyPosition:document.body.style.position})");
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      }
    }
    await evaluate('sessionStorage.clear()');
  }
} catch (error) {
  report.errors.push(String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'baseline.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  await writeFile(path.join(output, 'browser.log'), browserLog, { flag: 'wx' });
  try { if (socket?.readyState === WebSocket.OPEN) await send('Browser.close', {}, null); } catch { /* Browser may close before replying. */ }
  socket?.close();
  for (const { timer } of pending.values()) clearTimeout(timer);
  if (browser.exitCode === null) browser.kill();
  console.log(`Evidence: ${output}`);
  console.log(`Profiles: ${report.profiles.length}; collector errors: ${report.errors.length}`);
}

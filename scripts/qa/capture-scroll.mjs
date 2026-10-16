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
const output = path.resolve(root, process.argv[3] ?? `qa/plan1/scroll-${stamp}`);
if (!output.startsWith(path.resolve(root) + path.sep) || existsSync(output)) {
  throw new Error(
    'Choose a new output directory inside this project; existing evidence is never overwritten.',
  );
}
const executable =
  process.env.HAPPYGRAD_QA_BROWSER ??
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(executable))
  throw new Error('Set HAPPYGRAD_QA_BROWSER to an installed Chromium browser.');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), 'happygrad-scroll-'));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  capturedAt: new Date().toISOString(),
  url: url.href,
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  localDiff: execFileSync('git', ['diff', '--', 'src'], { cwd: root, encoding: 'utf8' }),
  renderer:
    'Headless Chromium / Edge; viewport and touch emulation, NOT Safari or real iOS/iPadOS.',
  limitations: [
    'Dev-server build, not a production performance benchmark.',
    'Entrance WebM is a timestamped CDP screencast re-encoded with Chromium MediaRecorder; no audio.',
    'No real trackpad, Safari toolbar, safe-area hardware or physical orientation testing.',
  ],
  assets: [],
  profiles: [],
  errors: [],
};
for (const directory of ['public/Image/original', 'public/Image/thumb']) {
  for (const name of (await readdir(path.join(root, directory))).sort()) {
    const asset = path.join(directory, name);
    const bytes = await readFile(path.join(root, asset));
    report.assets.push({
      path: asset.replaceAll('\\', '/'),
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
}

const browser = spawn(
  executable,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
);
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
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 60000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
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
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64'), {
    flag: 'wx',
  });
  return `${name}.png`;
}
async function click(selector) {
  const point = await evaluate(
    `(() => {const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
  );
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    ...point,
    button: 'left',
    clickCount: 1,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    ...point,
    button: 'left',
    clickCount: 1,
  });
}

const metrics = `(() => {
 const box = element => { const b = element.getBoundingClientRect(); return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}; };
 const story = document.querySelector('.opening-story');
 const portrait = document.querySelector('.hero__portrait-position img');
 return {scrollY, rootState:{...document.documentElement.dataset}, story:{...story.dataset},
  viewport:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight,visualWidth:visualViewport.width,visualHeight:visualViewport.height,scale:visualViewport.scale},
  scrollHeight:document.documentElement.scrollHeight,pinSpacers:document.querySelectorAll('.pin-spacer').length,
  sections:['home','invitation','message','memories','letter','closing'].map(id=>({id,...box(document.getElementById(id))})),
  portrait:portrait?{...box(portrait),complete:portrait.complete,naturalWidth:portrait.naturalWidth}:null,
  portraitCount:document.querySelectorAll('.hero__portrait-position img').length,
  motion:getComputedStyle(document.querySelector('.hero__portrait-motion')).transform,
  opacity:getComputedStyle(document.querySelector('.hero__portrait-motion')).opacity,
  sticky:getComputedStyle(document.querySelector('.hero__portrait-stage')).position,
  active:document.querySelector('[aria-current=step]')?.getAttribute('aria-label'),
  hash:location.hash, historyLength:history.length, bodyPosition:document.body.style.position
 };
})()`;
let captureFrames = null;
async function beginRecording() {
  captureFrames = [];
  await send('Page.startScreencast', {
    format: 'jpeg',
    quality: 85,
    maxWidth: 1440,
    maxHeight: 1180,
    everyNthFrame: 1,
  });
}
async function endRecording(name) {
  await send('Page.stopScreencast');
  const frames = captureFrames;
  captureFrames = null;
  const start = frames[0].metadata.timestamp;
  const manifest = frames.map((frame, i) => ({
    file: String(i).padStart(3, '0') + '.jpg',
    milliseconds: Math.round((frame.metadata.timestamp - start) * 1000),
  }));
  const dir = path.join(output, name + '-frames');
  await mkdir(dir);
  for (let i = 0; i < frames.length; i++)
    await writeFile(path.join(dir, manifest[i].file), Buffer.from(frames[i].data, 'base64'), {
      flag: 'wx',
    });
  await writeFile(path.join(dir, 'frames.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  return { name, manifest, _frames: frames };
}
async function wheel(delta, width = 1440, height = 900) {
  await send('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: Math.round(width * 0.18),
    y: Math.round(height * 0.65),
    deltaX: 0,
    deltaY: delta,
  });
}
async function go(y) {
  await evaluate('scrollTo({top:' + y + ',behavior:"instant"})');
  await wait(300);
}
async function settled() {
  await wait(400);
  await until(
    '!["navigation","alignment","restoration"].includes(document.documentElement.dataset.scrollState)',
    6000,
  );
  await wait(500);
}
async function encodeRecording(recording) {
  // A separate blank target encodes actual captured frames, not a reconstruction of the application.
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  const { sessionId: encoder } = await send(
    'Target.attachToTarget',
    { targetId, flatten: true },
    null,
  );
  await send('Target.activateTarget', { targetId }, null);
  const data = recording._frames.map((frame, i) => ({
    data: frame.data,
    at: recording.manifest[i].milliseconds,
  }));
  const result = await send(
    'Runtime.evaluate',
    {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async()=>{
    const frames=${JSON.stringify(data)};
    const images=await Promise.all(frames.map(async f=>{const im=new Image();im.src='data:image/jpeg;base64,'+f.data;await im.decode();return im;}));
    const canvas=document.createElement('canvas');canvas.width=images[0].width;canvas.height=images[0].height;document.body.append(canvas);
    const ctx=canvas.getContext('2d');ctx.drawImage(images[0],0,0);
    const stream=canvas.captureStream(30);const chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:4000000});
    const done=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=async()=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
    recorder.start();const began=performance.now();
    for(let i=0;i<frames.length;i++){await new Promise(r=>setTimeout(r,Math.max(0,frames[i].at-(performance.now()-began))));ctx.drawImage(images[i],0,0);}
    await new Promise(r=>setTimeout(r,500));recorder.stop();const output=await done;stream.getTracks().forEach(track=>track.stop());return output;
  })()`,
    },
    encoder,
  );
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  await writeFile(
    path.join(output, recording.name + '.webm'),
    Buffer.from(result.result.value.split(',')[1], 'base64'),
    { flag: 'wx' },
  );
  await send('Target.closeTarget', { targetId }, null);
  delete recording._frames;
  return recording.name + '.webm';
}
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Browser did not start: ${browserLog.slice(-2500)}`)),
      20000,
    );
    browser.stderr.on('data', (data) => {
      browserLog = (browserLog + data.toString()).slice(-12000);
      const match = browserLog.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    browser.once('error', reject);
    browser.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Browser exited ${code}: ${browserLog.slice(-2000)}`));
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    if (message.id) {
      const task = pending.get(message.id);
      if (!task) return;
      clearTimeout(task.timer);
      pending.delete(message.id);
      if (message.error) task.reject(new Error(JSON.stringify(message.error)));
      else task.resolve(message.result);
    } else {
      listeners.get(message.method)?.(message.params);
    }
  });
  report.browser = await send('Browser.getVersion', {}, null);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }, null));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  listeners.set('Runtime.exceptionThrown', (event) =>
    currentProfile?.errors.push({ kind: 'runtime', detail: event.exceptionDetails }),
  );
  listeners.set('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error')
      currentProfile?.errors.push({ kind: 'browser', text: entry.text, url: entry.url });
  });
  listeners.set('Network.responseReceived', ({ response, type }) => {
    currentProfile?.network.push({
      url: response.url,
      status: response.status,
      type,
      mimeType: response.mimeType,
      fromDiskCache: response.fromDiskCache ?? false,
    });
  });
  listeners.set('Network.loadingFailed', ({ errorText, canceled, type }) => {
    if (!canceled) currentProfile?.errors.push({ kind: 'network', errorText, type });
  });

  listeners.set('Page.screencastFrame', (event) => {
    if (captureFrames) captureFrames.push(event);
    send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      "window.__heroCls=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__heroCls+=e.value}).observe({type:'layout-shift',buffered:true});",
  });

  const profiles = [
    ['desktop-1366', 1366, 768, false],
    ['desktop-1440', 1440, 900, false],
    ['desktop-1920', 1920, 1080, false],
    ['iphone-portrait', 393, 852, true],
    ['iphone-landscape', 852, 393, true],
    ['ipad-portrait', 820, 1180, true],
    ['ipad-landscape', 1180, 820, true],
  ];
  for (const [name, width, height, touch] of profiles) {
    console.log('Scroll ' + name);
    currentProfile = {
      name,
      width,
      height,
      touch,
      screenshots: [],
      network: [],
      errors: [],
      storySamples: [],
      alignment: [],
    };
    report.profiles.push(currentProfile);
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: touch,
    });
    await send('Emulation.setTouchEmulationEnabled', {
      enabled: touch,
      maxTouchPoints: touch ? 5 : 1,
    });
    await send('Page.navigate', { url: 'about:blank' });
    await send('Page.navigate', { url: url.href });
    await until(
      '!!document.querySelector(".gift-intro") && !!document.querySelector(".hero__portrait-position img")',
    );
    await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,8000))])');
    await until('document.querySelector(".hero__portrait-position img").naturalWidth>0');
    currentProfile.intro = await evaluate(metrics);
    await click('.gift-intro button');
    await wait(1500);
    const baseline = await evaluate(metrics);
    currentProfile.baseline = baseline;
    currentProfile.screenshots.push(await screenshot(name + '-home'));
    const anchor = baseline.sections.find((s) => s.id === 'invitation').y + baseline.scrollY;
    const record = ['desktop-1440', 'ipad-portrait'].includes(name);
    if (record) await beginRecording();
    for (const progress of [0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
      const before = await evaluate('scrollY');
      if (touch) await go(Math.round(anchor * progress));
      else await wheel(Math.round(anchor * progress - before), width, height);
      await settled();
      currentProfile.storySamples.push({ progress, ...(await evaluate(metrics)) });
      if (progress > 0 && progress <= 1 && currentProfile.screenshots.length < 5)
        currentProfile.screenshots.push(
          await screenshot(name + '-story-' + Math.round(progress * 100)),
        );
    }
    if (record) {
      const recording = await endRecording(name + '-scroll-both-directions');
      currentProfile.video = await encodeRecording(recording);
      await send('Target.activateTarget', { targetId }, null);
    }
    // CTA uses a real click; scrolling the CTA into view is setup for natural-height touch chapters.
    await evaluate(
      'document.querySelector(".hero__cta").scrollIntoView({block:"center",behavior:"instant"})',
    );
    await wait(250);
    await click('.hero__cta');
    await settled();
    currentProfile.cta = await evaluate(metrics);
    // All real adjacent short pairs: 25/50/75%, both actual scroll directions.
    let m = await evaluate(metrics);
    const H = m.viewport.visualHeight;
    const sections = m.sections.map((s) => ({ ...s, top: s.y + m.scrollY }));
    for (let index = 1; index < sections.length - 1; index++) {
      const a = sections[index],
        b = sections[index + 1];
      if (a.height > H + 8 || b.height > H + 8 || b.top - a.top > 1.12 * H) continue;
      for (const direction of [1, -1])
        for (const progress of [0.25, 0.5, 0.75]) {
          const destination = a.top + (b.top - a.top) * progress;
          await go(destination - direction * 20);
          await wheel(direction * 20, width, height);
          await settled();
          const result = await evaluate(metrics);
          const expected = touch
            ? progress === 0.5
              ? direction < 0
                ? a
                : b
              : progress < 0.5
                ? a
                : b
            : direction > 0
              ? progress >= 0.35
                ? b
                : a
              : progress <= 0.65
                ? a
                : b;
          currentProfile.alignment.push({
            pair: a.id + '-' + b.id,
            direction,
            progress,
            expected: expected.top,
            actual: result.scrollY,
            error: Math.abs(result.scrollY - expected.top),
            reason: result.rootState.scrollReason,
          });
        }
    }
    await evaluate('sessionStorage.removeItem("happy-grad-sweetie:intro-seen")');
  }
  currentProfile = { name: 'history-modal-reduced', network: [], errors: [] };
  report.profiles.push(currentProfile);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.navigate', { url: 'about:blank' });
  await send('Page.navigate', { url: url.href + '#memories' });
  await until('!!document.querySelector(".gift-intro")');
  await evaluate('document.fonts.ready');
  await click('.gift-intro button');
  await settled();
  currentProfile.deepLink = await evaluate(metrics);
  await send('Page.reload', { ignoreCache: true });
  await until('!!document.querySelector("#memories")');
  await settled();
  currentProfile.reload = await evaluate(metrics);
  // Native history via existing UI navigation (not direct application method calls).
  const navs = await evaluate(
    '[...document.querySelectorAll("app-section-navigator button")].map(el=>el.getAttribute("aria-label"))',
  );
  currentProfile.navLabels = navs;
  await click('app-section-navigator li:nth-child(2) button');
  await settled();
  currentProfile.navigation = await evaluate(metrics);
  await evaluate('history.back()');
  await settled();
  currentProfile.back = await evaluate(metrics);
  await evaluate('history.forward()');
  await settled();
  currentProfile.forward = await evaluate(metrics);
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await go(350);
  await wheel(20);
  await settled();
  currentProfile.reduced = await evaluate(metrics);
  currentProfile.reducedScreenshot = await screenshot('reduced-motion');
  await send('Emulation.setEmulatedMedia', { features: [] });
} catch (error) {
  report.errors.push(String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'scroll.json'), JSON.stringify(report, null, 2), {
    flag: 'wx',
  });
  await writeFile(path.join(output, 'browser.log'), browserLog, { flag: 'wx' });
  try {
    if (socket?.readyState === WebSocket.OPEN) await send('Browser.close', {}, null);
  } catch {
    /* Browser may close before replying. */
  }
  socket?.close();
  for (const { timer } of pending.values()) clearTimeout(timer);
  if (browser.exitCode === null) browser.kill();
  console.log(`Evidence: ${output}`);
  console.log(`Profiles: ${report.profiles.length}; collector errors: ${report.errors.length}`);
}

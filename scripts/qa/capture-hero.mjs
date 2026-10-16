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
const output = path.resolve(root, process.argv[3] ?? `qa/plan1/hero-${stamp}`);
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
const profile = await mkdtemp(path.join(tmpdir(), 'happygrad-hero-'));
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
    }, 20000);
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
  const box = el => {const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
  const hero = document.querySelector('#home');
  const img = hero.querySelector('img');
  const audio = document.querySelector('audio');
  return {scrollY, viewport:{width:innerWidth,height:innerHeight}, overflow:document.documentElement.scrollWidth>innerWidth,
    state:document.querySelector('.opening-story').dataset.entranceState,
    coarse:matchMedia('(pointer:coarse)').matches, hover:matchMedia('(hover:hover)').matches,
    layoutViewport:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight},
    visualViewport:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale},
    heroOverflow:[...hero.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>hero.getBoundingClientRect().right+1 || el.getBoundingClientRect().left<hero.getBoundingClientRect().left-1).map(el=>({class:el.className,...box(el)})),
    galleryScene:box(document.querySelector('.gallery__scene')),
    hero:box(hero), image:img?{...box(img),src:img.currentSrc,naturalWidth:img.naturalWidth,complete:img.complete}:null,
    heading:box(hero.querySelector('h1')), cta:box(hero.querySelector('a')),
    elements:[...hero.querySelectorAll('[data-hero-heading],[data-hero-portrait],[data-hero-details]')].map(el=>({
      tag:el.tagName,opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform,...box(el)})),
    cls:window.__heroCls ?? null,
    audio:audio?{paused:audio.paused,currentTime:audio.currentTime,readyState:audio.readyState,error:audio.error?.message}:null,
    errorText:hero.querySelector('[role=status]')?.textContent ?? null};
})()`;

async function fullHero(name) {
  const bounds = await evaluate(
    '(()=>{const r=document.querySelector("#home").getBoundingClientRect();return{x:r.left,y:scrollY+r.top,width:r.width,height:r.height,scale:1}})()',
  );
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: bounds,
  });
  const filename = name + '-full.png';
  await writeFile(path.join(output, filename), Buffer.from(result.data, 'base64'), { flag: 'wx' });
  return filename;
}
let captureFrames = null;
async function recordEntrance(name) {
  captureFrames = [];
  await send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: 1440,
    maxHeight: 900,
    everyNthFrame: 1,
  });
  await wait(200);
  await click('.gift-intro button');
  const samples = [];
  for (let i = 0; i < 16; i++) {
    samples.push({ at: Date.now(), ...(await evaluate(metrics)) });
    await wait(85);
  }
  await send('Page.stopScreencast');
  const frames = captureFrames;
  captureFrames = null;
  if (frames.length < 2) throw new Error('No real entrance frames received');
  const dir = path.join(output, name + '-frames');
  await mkdir(dir);
  const start = frames[0].metadata.timestamp;
  const manifest = [];
  for (let i = 0; i < frames.length; i++) {
    const file = String(i).padStart(3, '0') + '.jpg';
    await writeFile(path.join(dir, file), Buffer.from(frames[i].data, 'base64'), { flag: 'wx' });
    manifest.push({
      file,
      milliseconds: Math.round((frames[i].metadata.timestamp - start) * 1000),
    });
  }
  await writeFile(path.join(dir, 'frames.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  return { name, frames: frames.length, manifest, samples, _frames: frames };
}
async function encodeRecording(recording) {
  // A separate blank target encodes actual captured frames, not a reconstruction of the application.
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  const { sessionId: encoder } = await send(
    'Target.attachToTarget',
    { targetId, flatten: true },
    null,
  );
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
    console.log('Hero ' + name);
    currentProfile = { name, width, height, touch, screenshots: [], network: [], errors: [] };
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
    await until('!!document.querySelector(".gift-intro") && !!document.querySelector("#home img")');
    await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,8000))])');
    await until(
      'document.querySelector("#home img").complete && document.querySelector("#home img").naturalWidth>0',
    );
    currentProfile.beforeOpen = await evaluate(metrics);
    if (name === 'desktop-1440') {
      const recording = await recordEntrance('desktop-entrance');
      currentProfile.video = await encodeRecording(recording);
      currentProfile.entrance = recording;
      await send('Target.activateTarget', { targetId }, null);
    } else {
      await click('.gift-intro button');
      await wait(1400);
    }
    currentProfile.metrics = await evaluate(metrics);
    currentProfile.screenshots.push(
      await screenshot(name + '-hero'),
      await fullHero(name + '-hero'),
    );
    await evaluate(
      'document.querySelector(".hero__cta").scrollIntoView({block:"center",behavior:"instant"})',
    );
    await wait(400);
    await click('.hero__cta');
    await wait(1600);
    currentProfile.cta = await evaluate(
      '({hash:location.hash,top:document.querySelector("#invitation").getBoundingClientRect().top,active:document.querySelector("[aria-current=step]")?.getAttribute("aria-label")})',
    );
    await evaluate('sessionStorage.removeItem("happy-grad-sweetie:intro-seen")');
  }

  currentProfile = { name: 'lifecycle-fallback', network: [], errors: [] };
  report.profiles.push(currentProfile);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await send('Page.navigate', { url: url.href });
  await until('!!document.querySelector(".gift-intro")');
  await evaluate('document.fonts.ready');
  await until('document.querySelector("#home img")?.naturalWidth>0');
  const reduced = await recordEntrance('reduced-motion');
  currentProfile.reducedMotion = {
    ...(await evaluate(metrics)),
    video: await encodeRecording(reduced),
    samples: reduced.samples,
  };
  await send('Target.activateTarget', { targetId }, null);
  await send('Emulation.setEmulatedMedia', { features: [] });
  currentProfile.fallbacks = [];
  for (const [name, urls] of [
    ['png', ['*Image/hero/*.webp']],
    ['original', ['*Image/hero/*.webp', '*Image/hero/*.png']],
    ['unavailable', ['*Image/hero/*.webp', '*Image/hero/*.png', '*Image/original/1.jpg']],
  ]) {
    await send('Network.setBlockedURLs', { urls });
    await send('Page.reload', { ignoreCache: true });
    await until('!!document.querySelector("#home")');
    await wait(1700);
    currentProfile.fallbacks.push({
      name,
      ...(await evaluate(metrics)),
      screenshot: await screenshot('fallback-' + name),
    });
  }
  await send('Network.setBlockedURLs', { urls: [] });
  await send('Page.navigate', { url: url.href + '#memories' });
  await until('!!document.querySelector("#home")');
  await wait(1500);
  currentProfile.deepLink = await evaluate(
    '({hash:location.hash,state:document.querySelector(".opening-story").dataset.entranceState,top:document.querySelector("#memories").getBoundingClientRect().top})',
  );
  await evaluate(
    'document.querySelector("#closing").scrollIntoView({behavior:"instant",block:"start"})',
  );
  await wait(500);
  const hasReplay = await evaluate(
    '[...document.querySelectorAll("#closing button")].some(el=>el.textContent.includes("Mở lại"))',
  );
  if (hasReplay) {
    await click('#closing button');
    await until('!!document.querySelector(".gift-intro")');
    await click('.gift-intro button');
    await wait(1200);
    currentProfile.replay = await evaluate(metrics);
  }
} catch (error) {
  report.errors.push(String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'hero.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
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

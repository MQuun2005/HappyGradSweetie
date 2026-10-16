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
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
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
    }, 180000);
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
    everyNthFrame: 3,
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

  currentProfile = {
    name: 'production-desktop',
    width: 1440,
    height: 900,
    touch: false,
    network: [],
    errors: [],
    screenshots: [],
    samples: [],
  };
  report.profiles.push(currentProfile);
  report.limitations = [
    'Production build, isolated Edge headless; not Safari/physical hardware.',
    'Real-speed full-cycle log; first 45 seconds captured as timestamped frames.',
    'Profiling includes CDP screencast overhead, not a user-device FPS guarantee.',
  ];
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: url.href });
  await until('!!document.querySelector(".gift-intro")');
  await evaluate('document.fonts.ready');
  await wait(500);
  await click('.gift-intro button');
  await wait(300);
  if (await evaluate('!!document.querySelector(".gift-intro")')) await click('.gift-intro button');
  await until('!document.querySelector(".gift-intro")');
  await wait(1100);
  await evaluate(
    'document.getElementById("memories").scrollIntoView({behavior:"instant"});document.activeElement?.blur()',
  );
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  await wait(700);
  const state =
    '(()=>{const cards=[...document.querySelectorAll(".photo-card")];const active=document.querySelector(".photo-card[aria-current=true]");return{time:performance.now(),active:Number(active?.getAttribute("aria-posinset")),logical:Number(active?.parentElement.dataset.logicalIndex),windowStart:Number(document.querySelector(".photo-card__rail")?.dataset.logicalIndex),dom:cards.length,loaded:cards.every(e=>e.querySelector("img")?.naturalWidth>0),scrollY,overflow:document.documentElement.scrollWidth>innerWidth,visible:document.visibilityState,ids:cards.map(e=>e.getAttribute("aria-posinset")),transforms:cards.filter(e=>e.classList.contains("photo-card--front")).map(e=>({id:e.getAttribute("aria-posinset"),transform:e.parentElement.style.transform}))}})()';
  await evaluate(
    'window.__galleryLongTasks=[];window.__galleryDeltas=[];window.__galleryMutations=0;window.__galleryProfiling=true;new PerformanceObserver(l=>{if(window.__galleryProfiling)for(const e of l.getEntries())window.__galleryLongTasks.push({start:e.startTime,duration:e.duration})}).observe({type:"longtask",buffered:false});new MutationObserver(entries=>{window.__galleryMutations+=entries.length}).observe(document.querySelector(".gallery__stage"),{childList:true});(()=>{let last=0;function frame(now){if(last)window.__galleryDeltas.push(now-last);last=now;if(window.__galleryProfiling)requestAnimationFrame(frame)}requestAnimationFrame(frame)})()',
  );
  await beginRecording();
  const started = Date.now(),
    seen = new Set();
  let recordingDone = false,
    complete = false;
  while (Date.now() - started < 495000) {
    const sample = await evaluate(state);
    sample.elapsed = Date.now() - started;
    currentProfile.samples.push(sample);
    seen.add(sample.active);
    if ([5, 15, 30, 45].some((t) => Math.abs(sample.elapsed / 1000 - t) < 0.6))
      currentProfile.screenshots.push(
        await screenshot('motion-' + Math.round(sample.elapsed / 1000) + 's'),
      );
    if (!recordingDone && sample.elapsed >= 45000) {
      const recording = await endRecording('production-45s');
      currentProfile.recording = {
        name: recording.name,
        frames: recording.manifest.length,
        duration: recording.manifest.at(-1)?.milliseconds,
      };
      recordingDone = true;
      currentProfile.performance = await evaluate(
        '(()=>{window.__galleryProfiling=false;const a=window.__galleryDeltas.sort((a,b)=>a-b);return{frameCount:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],over50:a.filter(x=>x>50).length,longTasks:window.__galleryLongTasks,childListMutations:window.__galleryMutations}})()',
      );
    }
    if (
      sample.elapsed > 30000 &&
      seen.size === 34 &&
      sample.active === 1 &&
      sample.windowStart >= 29
    ) {
      complete = true;
      break;
    }
    if (currentProfile.samples.length % 30 === 0)
      console.log(
        'Real-speed ' +
          Math.round(sample.elapsed / 1000) +
          's; seen ' +
          seen.size +
          '/34; active ' +
          sample.active,
      );
    await wait(1000);
  }
  currentProfile.loop = { complete, seen: [...seen], elapsedMs: Date.now() - started };
  if (!complete) throw new Error('Real-speed loop did not complete all 34 photos within 495s');
  // Real keyboard traversal provides a reverse-seam integration check without fast autoplay.
  await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');
  await wait(500);
  currentProfile.seam = [];
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowLeft']) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
    await wait(150);
    currentProfile.seam.push({ key, ...(await evaluate(state)) });
  }
  currentProfile.screenshots.push(await screenshot('full-loop-final'));
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

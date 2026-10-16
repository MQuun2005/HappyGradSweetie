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
    ['iphone', 393, 852, true],
    ['ipad-portrait', 820, 1180, true],
    ['ipad-landscape', 1180, 820, true],
    ['desktop', 1366, 768, false],
  ];
  async function touchDrag(x, y, dx, dy) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 12; i++) {
      await send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / 12, y: y + (dy * i) / 12, id: 1 }],
      });
      await wait(35);
    }
    await wait(250);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settled();
  }
  for (const [name, width, height, touch] of profiles) {
    console.log('Interactions ' + name);
    currentProfile = { name, width, height, touch, network: [], errors: [], screenshots: [] };
    report.profiles.push(currentProfile);
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: touch,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 5 });
    await send('Page.navigate', { url: url.href });
    await until('!!document.querySelector("#home")');
    await evaluate('document.fonts.ready');
    if (await evaluate('!!document.querySelector(".gift-intro")'))
      await click('.gift-intro button');
    await wait(1200);
    await go(0);
    if (touch) {
      if (name === 'iphone') await beginRecording();
      await touchDrag(width * 0.5, height * 0.78, 0, -220);
      currentProfile.nativeTouch = await evaluate(metrics);
      if (name === 'iphone') {
        const recording = await endRecording('iphone-native-touch');
        currentProfile.video = await encodeRecording(recording);
        await send('Target.activateTarget', { targetId }, null);
      }
    }
    const letter = await evaluate(
      '(()=>{const r=document.getElementById("letter").getBoundingClientRect();return{top:scrollY+r.top,height:r.height,H:visualViewport.height}})()',
    );
    currentProfile.longReading = [];
    if (letter.height > letter.H + 8)
      for (const p of [0.25, 0.5, 0.75]) {
        const target = letter.top + (letter.height - letter.H) * p;
        await go(target - 10);
        await wheel(10, width, height);
        await settled();
        currentProfile.longReading.push({ p, target, y: await evaluate('scrollY') });
      }
    await evaluate('document.getElementById("memories").scrollIntoView({behavior:"instant"})');
    await wait(700);
    currentProfile.beforeModal = await evaluate(metrics);
    // Use keyboard for a deterministic active-card Lightbox integration test.
    const hasCard = await evaluate('!!document.querySelector(".photo-card[aria-current=true]")');
    if (hasCard) {
      await evaluate(
        'document.querySelector(".photo-card[aria-current=true]").focus({preventScroll:true})',
      );
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      });
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      });
      await until('!!document.querySelector(".lightbox")');
      await until('document.querySelector(".lightbox img")?.naturalWidth>0');
      await wait(300);
      currentProfile.modal = await evaluate(
        '({y:scrollY,top:document.body.style.top,padding:document.body.style.paddingRight,state:document.documentElement.dataset.scrollState,src:document.querySelector(".lightbox img").currentSrc})',
      );
      currentProfile.screenshots.push(await screenshot(name + '-lightbox'));
      currentProfile.focusTrap = [];
      for (let i = 0; i < 8; i++) {
        await send('Input.dispatchKeyEvent', {
          type: 'keyDown',
          key: 'Tab',
          code: 'Tab',
          windowsVirtualKeyCode: 9,
        });
        await send('Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: 'Tab',
          code: 'Tab',
          windowsVirtualKeyCode: 9,
        });
        currentProfile.focusTrap.push(
          await evaluate('!!document.activeElement?.closest(".lightbox")'),
        );
      }
      await wheel(150, width, height);
      currentProfile.lockedAfterWheel = await evaluate('({y:scrollY,top:document.body.style.top})');
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await until('!document.querySelector(".lightbox")');
      await settled();
      currentProfile.afterModal = {
        ...(await evaluate(metrics)),
        focused: await evaluate('document.activeElement?.className'),
      };
    }
    if (touch) {
      await go(currentProfile.beforeModal.scrollY);
      const start = await evaluate('scrollY');
      await touchDrag(width * 0.5, height * 0.65, -100, 0);
      currentProfile.horizontal = {
        before: start,
        after: await evaluate('scrollY'),
        lightbox: await evaluate('!!document.querySelector(".lightbox")'),
      };
      await touchDrag(width * 0.12, height * 0.85, 0, -height * 0.68);
      currentProfile.verticalInGallery = { before: start, after: await evaluate('scrollY') };
    }
    if (name === 'ipad-portrait') {
      await evaluate('document.getElementById("letter").scrollIntoView({behavior:"instant"})');
      await wait(300);
      const before = await evaluate(metrics);
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1180,
        height: 820,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await wait(800);
      currentProfile.orientation = { before, after: await evaluate(metrics) };
      await send('Emulation.setDeviceMetricsOverride', {
        width: 820,
        height: 1180,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await wait(500);
    }
    await evaluate('document.getElementById("closing").scrollIntoView({behavior:"instant"})');
    await wait(500);
    await click('#closing button');
    await until('!!document.querySelector(".gift-intro")');
    currentProfile.replayLocked = await evaluate(metrics);
    await click('.gift-intro button');
    await wait(1200);
    currentProfile.replay = await evaluate(metrics);
  }
  // Fallback path without document.scrollend and cancellation during a correction.
  currentProfile = { name: 'fallback-and-cancel', network: [], errors: [] };
  report.profiles.push(currentProfile);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'delete Document.prototype.onscrollend;',
  });
  await send('Page.navigate', { url: url.href });
  await until('!!document.querySelector("#home")');
  await evaluate('document.fonts.ready');
  await wait(800);
  if (await evaluate('!!document.querySelector(".gift-intro")')) await click('.gift-intro button');
  currentProfile.support = await evaluate('({scrollend:"onscrollend" in document})');
  await go(1330);
  await wheel(20);
  await settled();
  currentProfile.fallback = await evaluate(metrics);
  await go(1330);
  await wheel(20);
  await until('document.documentElement.dataset.scrollState === "alignment"', 4000);
  currentProfile.cancelBefore = await evaluate(
    '({y:scrollY,state:document.documentElement.dataset.scrollState})',
  );
  await evaluate(
    `window.__cancelEvents=[];document.addEventListener('wheel',()=>requestAnimationFrame(()=>window.__cancelEvents.push({y:scrollY,state:document.documentElement.dataset.scrollState})),{once:true,passive:true});`,
  );
  await wheel(-200);
  await until('window.__cancelEvents.length > 0');
  currentProfile.cancelImmediately = await evaluate('window.__cancelEvents');
  await settled();
  currentProfile.cancel = await evaluate(metrics);
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

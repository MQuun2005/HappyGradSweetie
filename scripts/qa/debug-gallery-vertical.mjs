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
  throw new Error('Choose a new output directory inside this project; existing evidence is never overwritten.');
}
const executable = process.env.HAPPYGRAD_QA_BROWSER ??
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(executable)) throw new Error('Set HAPPYGRAD_QA_BROWSER to an installed Chromium browser.');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), 'happygrad-scroll-'));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  capturedAt: new Date().toISOString(), url: url.href,
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  localDiff: execFileSync('git', ['diff', '--', 'src'], { cwd: root, encoding: 'utf8' }),
  renderer: 'Headless Chromium / Edge; viewport and touch emulation, NOT Safari or real iOS/iPadOS.',
  limitations: ['Dev-server build, not a production performance benchmark.',
    'Entrance WebM is a timestamped CDP screencast re-encoded with Chromium MediaRecorder; no audio.',
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
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 180000);
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
 captureFrames=[];
 await send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1440,maxHeight:1180,everyNthFrame:1});
}
async function endRecording(name) {
 await send('Page.stopScreencast');
 const frames=captureFrames;captureFrames=null;
 const start=frames[0].metadata.timestamp;
 const manifest=frames.map((frame,i)=>({file:String(i).padStart(3,'0')+'.jpg',milliseconds:Math.round((frame.metadata.timestamp-start)*1000)}));
 const dir=path.join(output,name+'-frames');await mkdir(dir);
 for(let i=0;i<frames.length;i++) await writeFile(path.join(dir,manifest[i].file),Buffer.from(frames[i].data,'base64'),{flag:'wx'});
 await writeFile(path.join(dir,'frames.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
 return {name,manifest,_frames:frames};
}
async function wheel(delta,width=1440,height=900) {
 await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:Math.round(width*.18),y:Math.round(height*.65),deltaX:0,deltaY:delta});
}
async function go(y) {await evaluate('scrollTo({top:'+y+',behavior:"instant"})');await wait(300);}
async function settled() {
 await wait(400);
 await until('!["navigation","alignment","restoration"].includes(document.documentElement.dataset.scrollState)',6000);
 await wait(500);
}
async function encodeRecording(recording) {
  // A separate blank target encodes actual captured frames, not a reconstruction of the application.
  const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);
  const {sessionId:encoder}=await send('Target.attachToTarget',{targetId,flatten:true},null);
  await send('Target.activateTarget',{targetId},null);
  const data=recording._frames.map((frame,i)=>({data:frame.data,at:recording.manifest[i].milliseconds}));
  const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
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
  })()`},encoder);
  if(result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  await writeFile(path.join(output,recording.name+'.webm'),Buffer.from(result.result.value.split(',')[1],'base64'),{flag:'wx'});
  await send('Target.closeTarget',{targetId},null);
  delete recording._frames;
  return recording.name+'.webm';
}
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

  listeners.set('Page.screencastFrame', event => {
    if(captureFrames) captureFrames.push(event);
    send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  });
  await send('Page.addScriptToEvaluateOnNewDocument',{source:
    "window.__heroCls=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__heroCls+=e.value}).observe({type:'layout-shift',buffered:true});"});



  const component = 'ng.getComponent(document.querySelector("app-interactive-photo-gallery"))';
  const measure = `(() => {
    const c=ng.getComponent(document.querySelector('app-interactive-photo-gallery'));
    const s=document.querySelector('.gallery__scene'), b=s.getBoundingClientRect();
    return {position:c.motionPosition,frameScheduled:c.animationFrameId!==undefined,offscreen:c.isOffscreen,
      hover:c.hoveredLogicalIndex,hoverProgress:[...c.hoverProgress],velocity:c.autoVelocity,
      config:c.layoutConfig(),viewport:c.presentationViewport, width:innerWidth,height:innerHeight,scrollY,
      scrollWidth:document.documentElement.scrollWidth,scene:{x:b.x,y:b.y,width:b.width,height:b.height},
      cards:[...document.querySelectorAll('.photo-card')].map(el=>{
       const r=el.getBoundingClientRect(),im=el.querySelector('img');return {
        logical:Number(el.parentElement.dataset.logicalIndex),front:el.classList.contains('photo-card--front'),
        x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,opacity:getComputedStyle(el).opacity,
        matrix:getComputedStyle(el).transform,railMatrix:getComputedStyle(el.parentElement).transform,
        naturalWidth:im?.naturalWidth,complete:im?.complete,src:im?.currentSrc};
      })};
  })()`;

  async function gesture(touch,start,end,hold=0) {
    if(touch) {
      await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
      for(let step=1;step<=12;step++){await wait(20);await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*step/12,y:start.y+(end.y-start.y)*step/12,id:1}]});}
      if(hold)await wait(hold);
      await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',...start});
      await send('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',buttons:1,clickCount:1});
      for(let step=1;step<=12;step++){await wait(20);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:start.x+(end.x-start.x)*step/12,y:start.y+(end.y-start.y)*step/12,button:'left',buttons:1});}
      if(hold)await wait(hold);
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',clickCount:1});
    }
  }
  const smallState='(()=>{const c='+component+';return {position:c.motionPosition,active:c.activePhotoNumber(),frame:c.animationFrameId!==undefined,scrollY,modal:!!document.querySelector(".lightbox"),focus:document.activeElement?.closest("[data-logical-index]")?.dataset.logicalIndex,captured:c.pointerId,dragging:c.isDragging,hover:c.hoveredLogicalIndex}})()';
  for(const [name,width,height,touch] of [['ipad-p',820,1180,true]]){
    console.log('Interaction '+name);
    currentProfile={name,width,height,touch,network:[],errors:[],screenshots:[],checks:{}};report.profiles.push(currentProfile);
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});
    await send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:5});
    await send('Page.navigate',{url:'about:blank'});await send('Page.navigate',{url:url.href});
    await until('!!document.querySelector(".gift-intro")');await evaluate('document.fonts.ready');await wait(500);
    await click('.gift-intro button');await wait(300);
    if(await evaluate('!!document.querySelector(".gift-intro")'))await click('.gift-intro button');
    await until('!document.querySelector(".gift-intro")');await wait(1000);
    await evaluate('document.getElementById("memories").scrollIntoView({behavior:"instant"})');await wait(600);
    // Freeze autoplay via keyboard focus, not a second animation writer.
    await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');await wait(500);
    const b=await evaluate('(()=>{const r=document.querySelector(".gallery__scene").getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()');
    const start={x:Math.round(width*.6),y:Math.round(Math.min(height-100,b.y+b.h*.55))};
    const finish={x:Math.round(width*.25),y:start.y};
    currentProfile.checks.beforeDrag=await evaluate(smallState);
    await beginRecording();await gesture(touch,start,finish,250);await wait(400);
    currentProfile.checks.afterSlowDrag=await evaluate(smallState);
    currentProfile.screenshots.push(await screenshot(name+'-after-swipe'));
    await gesture(touch,finish,start);await wait(1000);
    currentProfile.checks.afterFastDrag=await evaluate(smallState);
    const record=await endRecording(name+'-drag');currentProfile.recording={name:record.name,frames:record.manifest.length};
    // Real tap/click on the active face, including lifted presentation on mouse.
    await evaluate(component+'.hoveredLogicalIndex=null');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait(600);
    const target=await evaluate('(()=>{const c='+component+';const el=document.querySelector("[data-logical-index=\\""+Math.round(c.motionPosition)+"\\"] .photo-card");const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,logical:Math.round(c.motionPosition)}})()');
    currentProfile.checks.beforeModal=await evaluate(smallState);
    if(touch){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x,y:target.y,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else {await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:target.x,y:target.y});await wait(550);await click('[data-logical-index="'+target.logical+'"] .photo-card');}
    await until('!!document.querySelector(".lightbox")');
    await until('document.querySelector(".lightbox img")?.naturalWidth>0');await wait(300);
    currentProfile.checks.openModal={...await evaluate(smallState),image:await evaluate('document.querySelector(".lightbox img").currentSrc')};
    currentProfile.screenshots.push(await screenshot(name+'-lightbox'));
    await click('[aria-label="Đóng ảnh phóng to"]');await wait(700);
    currentProfile.checks.closedModal=await evaluate(smallState);
    await evaluate('document.activeElement?.blur()');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await wait(700);
    if(touch){
      await evaluate('window.__vertical=[];["scroll","pointerdown","pointermove","pointercancel","pointerup"].forEach(type=>document.addEventListener(type,e=>window.__vertical.push({type:e.type,y:scrollY,x:e.clientX,pointerY:e.clientY,target:e.target?.className,state:document.documentElement.dataset.scrollState}),{passive:true}))');
      currentProfile.checks.beforeVertical=await evaluate(smallState);
      await gesture(true,{x:width*.5,y:start.y},{x:width*.5+5,y:Math.max(30,start.y-Math.min(400,height*.45))});await wait(1000);
      currentProfile.checks.afterVertical={...await evaluate(smallState),events:await evaluate('window.__vertical')};
      await evaluate('document.getElementById("memories").scrollIntoView({behavior:"instant"})');await wait(600);
      const old=await evaluate(smallState);
      const newWidth=height,newHeight=width;
      await send('Emulation.setDeviceMetricsOverride',{width:newWidth,height:newHeight,deviceScaleFactor:1,mobile:true});await wait(700);
      currentProfile.checks.orientation={before:old,after:await evaluate(smallState),geometry:await evaluate(measure)};
      currentProfile.screenshots.push(await screenshot(name+'-rotated'));
    }
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(400);
    const reducedBefore=await evaluate(smallState);await wait(600);
    currentProfile.checks.reduced={before:reducedBefore,after:await evaluate(smallState)};
    await send('Emulation.setEmulatedMedia',{features:[]});await wait(300);
    await evaluate('document.getElementById("home").scrollIntoView({behavior:"instant"})');await wait(600);
    currentProfile.checks.offscreen=await evaluate(smallState);
    await evaluate('sessionStorage.removeItem("happy-grad-sweetie:intro-seen")');
  }

} catch (error) {
  report.errors.push(String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'scroll.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  await writeFile(path.join(output, 'browser.log'), browserLog, { flag: 'wx' });
  try { if (socket?.readyState === WebSocket.OPEN) await send('Browser.close', {}, null); } catch { /* Browser may close before replying. */ }
  socket?.close();
  for (const { timer } of pending.values()) clearTimeout(timer);
  if (browser.exitCode === null) browser.kill();
  console.log(`Evidence: ${output}`);
  console.log(`Profiles: ${report.profiles.length}; collector errors: ${report.errors.length}`);
}

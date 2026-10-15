// Phase 6: local browser evidence. Never overwrites an earlier capture or publishes data.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import WebSocket from 'ws';

const root = fileURLToPath(new URL('../../', import.meta.url));
const url = new URL(process.argv[2] ?? 'http://127.0.0.1:4204/');
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw Error('Local preview only');
const output = path.resolve(root, process.argv[3] ?? `qa/plan1/content-${Date.now()}`);
if (!output.startsWith(root) || existsSync(output)) throw Error('Use a new evidence folder inside project');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), 'happygrad-content-'));
const browser = spawn(process.env.HAPPYGRAD_QA_BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--edge-skip-compat-layer-relaunch',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let log = '', socket, session, active, id = 0;
const pending = new Map(), listeners = new Map();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { capturedAt: new Date().toISOString(), url: url.href,
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  renderer: 'Edge headless / Chromium emulation, NOT physical Safari/iPhone/iPad.',
  limitations: ['Muted output: playback state does not prove audible music.', 'Dev preview, not a performance benchmark.',
    'Text zoom uses 200% root font size; not a physical pinch or Safari toolbar test.'],
  profiles: [], sources: [], errors: [] };
const tracked = execFileSync('git', ['ls-files', 'src'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
for (const file of tracked) report.sources.push({ file, sha256: createHash('sha256').update(await readFile(path.join(root, file))).digest('hex') });
function send(method, params = {}, target = session) {
  const key = ++id;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(key); reject(Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(key, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: key, method, params, ...(target ? { sessionId: target } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression) {
  const end = Date.now() + 20000;
  do { if (await evaluate(expression)) return; await wait(100); } while (Date.now() < end);
  throw Error(`Condition not met: ${expression}`);
}
async function capture(name, selector) {
  const clip = selector ? await evaluate(`(() => {const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.max(0,b.x),y:Math.max(0,scrollY+b.y),width:Math.min(innerWidth,b.width),height:b.height,scale:1}})()`) : undefined;
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!clip, ...(clip ? {clip} : {}) });
  const file = `${name}.png`;
  await writeFile(path.join(output, file), Buffer.from(shot.data, 'base64'), { flag: 'wx' });
  return file;
}
async function click(selector) {
  const point = await evaluate(`(() => {const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
}
const textMetrics = selector => `(() => {
  const section=document.querySelector(${JSON.stringify(selector)});
  const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const elements=[...section.querySelectorAll('h1,h2,p,footer,a,button,time')].filter(el=>!el.closest('[aria-hidden="true"]')&&!el.matches('.sr-only,.photo-card'));
  return {scrollY,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,section:box(section),
    text:elements.map(el=>({tag:el.tagName,class:el.className,text:el.textContent.trim(),...box(el),opacity:getComputedStyle(el).opacity,
      font:getComputedStyle(el).fontSize,lineHeight:getComputedStyle(el).lineHeight,whiteSpace:getComputedStyle(el).whiteSpace,
      clippedInline:el.scrollWidth>el.clientWidth+1})),
    signature:section.querySelector('footer')?.textContent,
    cardCount:section.querySelectorAll('.photo-card').length,
    images:[...section.querySelectorAll('img')].map(img=>({src:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth}))};
})()`;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Browser endpoint timeout')), 15000);
    browser.once('error', reject);
    browser.stderr.on('data', data => { log += data; const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  socket.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); clearTimeout(p.timer); msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result); }
    else listeners.get(msg.method)?.(msg.params);
  });
  report.browser = await send('Browser.getVersion', {}, null);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  session = (await send('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  listeners.set('Runtime.exceptionThrown', p => active?.errors.push({ kind: 'exception', details: p.exceptionDetails }));
  listeners.set('Runtime.consoleAPICalled', p => { if (p.type === 'error') active?.errors.push({kind:'console', args:p.args}); });
  listeners.set('Network.responseReceived', p => active?.network.push({url:p.response.url,status:p.response.status,type:p.type}));
  listeners.set('Network.loadingFailed', p => { if (!p.canceled) active?.errors.push({kind:'network',text:p.errorText}); });
  const profiles = [
    ['desktop-small',1366,768,false],['desktop',1440,900,false],['desktop-large',1920,1080,false],
    ['iphone',393,852,true],['iphone-landscape',852,393,true],['ipad-p',820,1180,true],['ipad-l',1180,820,true],
    ['iphone-text200',393,852,true,2],['iphone-landscape-reduced',852,393,true,1,true],
  ];
  for (const [name,width,height,touch,fontScale=1,reduced=false] of profiles) {
    if (process.argv[4] && name !== process.argv[4]) continue;
    console.log(`Content QA ${name}`);
    active={name,width,height,touch,fontScale,reduced,screenshots:[],sections:[],errors:[],network:[]}; report.profiles.push(active);
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});
    await send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await send('Page.navigate',{url:'about:blank'}); await send('Page.navigate',{url:url.href});
    await until('!!document.querySelector(".gift-intro button")');
    await evaluate('document.fonts.ready.then(()=>true)');
    if(fontScale!==1) await evaluate(`document.documentElement.style.fontSize='${fontScale*100}%'`);
    await wait(650);
    active.introTop=await evaluate(textMetrics('.gift-intro'));
    active.screenshots.push(await capture(`${name}-intro-top`));
    // The dialog itself may scroll at short heights/text zoom; button must remain reachable.
    await evaluate('document.querySelector(".gift-intro button").scrollIntoView({block:"nearest",behavior:"instant"})');
    active.intro=await evaluate(textMetrics('.gift-intro'));
    active.introScroll=await evaluate('(()=>{const el=document.querySelector(".gift-intro");return{height:el.clientHeight,scrollHeight:el.scrollHeight,top:el.scrollTop,overflow:getComputedStyle(el).overflowY}})()');
    active.screenshots.push(await capture(`${name}-intro`));
    await click('.gift-intro button'); await until('!document.querySelector(".gift-intro")'); await wait(1000);
    active.audioBefore=await evaluate('(()=>{const a=document.querySelector("audio");return{count:document.querySelectorAll("audio").length,time:a?.currentTime,paused:a?.paused}})()');
    active.layoutOverflow=await evaluate('(()=>({clientWidth:document.documentElement.clientWidth,innerWidth,visualWidth:visualViewport.width,bodyWidth:document.body.getBoundingClientRect().width,elements:[...document.querySelectorAll("main *")].filter(el=>{const b=el.getBoundingClientRect();return b.right>document.documentElement.clientWidth+1||b.x< -1}).map(el=>({tag:el.tagName,class:typeof el.className==="string"?el.className:"",width:el.getBoundingClientRect().width,x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right,overflow:getComputedStyle(el).overflowX}))}))()');
    for(const section of ['home','invitation','message','memories','letter','closing']) {
      await evaluate(`document.getElementById('${section}').scrollIntoView({behavior:'instant',block:'start'})`); await wait(1000);
      active.sections.push({id:section,...await evaluate(textMetrics(`#${section}`))});
      active.screenshots.push(await capture(`${name}-${section}`));
      if(['letter','closing','invitation','message'].includes(section)) active.screenshots.push(await capture(`${name}-${section}-full`, `#${section}`));
      if(section==='letter') {
        await evaluate('(()=>{const el=document.querySelector("#letter");scrollTo({top:scrollY+el.getBoundingClientRect().top+Math.max(0,(el.offsetHeight-innerHeight)*.5),behavior:"instant"})})()');
        const before=await evaluate('scrollY'); await wait(700);
        active.letterReading={before,after:await evaluate('scrollY')};
      }
    }
    active.audioAfter=await evaluate('(()=>{const a=document.querySelector("audio");return{count:document.querySelectorAll("audio").length,time:a?.currentTime,paused:a?.paused}})()');
    await evaluate('sessionStorage.clear()');
  }
} catch (error) { report.errors.push(String(error.stack??error)); process.exitCode=1; }
finally {
  await writeFile(path.join(output,'content.json'),JSON.stringify(report,null,2),{flag:'wx'});
  await writeFile(path.join(output,'browser.log'),log,{flag:'wx'});
  try { if(socket?.readyState===WebSocket.OPEN) await send('Browser.close',{},null); } catch {}
  socket?.close(); for(const p of pending.values()) clearTimeout(p.timer);
  if(browser.exitCode===null) browser.kill();
  console.log(`Evidence: ${output}; profiles: ${report.profiles.length}; errors: ${report.errors.length}`);
}

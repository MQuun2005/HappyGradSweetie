// Encode actual CDP screenshot frames at their original timestamps. Local only.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.resolve(root, process.argv[2] ?? '');
const output = path.resolve(root, process.argv[3] ?? '');
if (!dir.startsWith(root) || !output.startsWith(root) || existsSync(output))
  throw Error('Use an existing frame folder and NEW output inside this project.');
const frames = JSON.parse(await readFile(path.join(dir, 'frames.json'), 'utf8'));
const allowed = new Set(frames.map((f) => f.file));
const page = `<!doctype html><canvas></canvas><script>
window.encode=async()=>{
 const frames=${JSON.stringify(frames)},canvas=document.querySelector('canvas');
 const load=async f=>{const image=new Image();image.src='/'+f.file;try{await image.decode()}catch(error){throw Error('Cannot decode '+f.file+': '+error.message)}return image};
 const first=await load(frames[0]);canvas.width=first.width;canvas.height=first.height;
 const ctx=canvas.getContext('2d');ctx.drawImage(first,0,0);
 const stream=canvas.captureStream(0),track=stream.getVideoTracks()[0],chunks=[];
 const type=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
 const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:3500000});
 const done=new Promise((resolve,reject)=>{recorder.onerror=e=>reject(Error(e.error?.message));recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}))});
 recorder.start(1000);track.requestFrame();const start=performance.now();let next=load(frames[1]);
 for(let i=1;i<frames.length;i++){
   const image=await next;if(i+1<frames.length)next=load(frames[i+1]);
   await new Promise(r=>setTimeout(r,Math.max(0,frames[i].milliseconds-(performance.now()-start))));
   ctx.drawImage(image,0,0);track.requestFrame();
 }
 await new Promise(r=>setTimeout(r,250));recorder.stop();const blob=await done;track.stop();
 const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob)});
 return{data,width:canvas.width,height:canvas.height,frames:frames.length,sourceDuration:frames.at(-1).milliseconds,encodedWallMs:performance.now()-start,type};
};</script>`;
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname.slice(1));
    if (!name) {
      res.setHeader('Content-Type', 'text/html');
      res.end(page);
      return;
    }
    if (!allowed.has(name)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.end(await readFile(path.join(dir, name)));
  } catch {
    res.writeHead(500);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const profile = await mkdtemp(path.join(tmpdir(), 'happygrad-encode-'));
const browser = spawn(
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  [
    '--headless=new',
    '--no-first-run',
    '--edge-skip-compat-layer-relaunch',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--remote-debugging-port=0',
    '--user-data-dir=' + profile,
    'about:blank',
  ],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
);
let ws,
  id = 0,
  session,
  log = '';
const pending = new Map();
const send = (method, params = {}, sid = session) =>
  new Promise((resolve, reject) => {
    const n = ++id,
      timer = setTimeout(() => {
        pending.delete(n);
        reject(Error('CDP timeout ' + method));
      }, 180000);
    pending.set(n, { resolve, reject, timer });
    ws.send(JSON.stringify({ id: n, method, params, ...(sid ? { sessionId: sid } : {}) }));
  });
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Browser startup timeout')), 20000);
    browser.stderr.on('data', (b) => {
      log += b;
      const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    browser.once('error', reject);
  });
  ws = new WebSocket(endpoint);
  await new Promise((r, j) => {
    ws.once('open', r);
    ws.once('error', j);
  });
  ws.on('message', (b) => {
    const m = JSON.parse(b);
    if (!m.id) return;
    const p = pending.get(m.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(m.id);
    m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  session = (await send('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await send('Page.enable');
  await send('Target.activateTarget', { targetId }, null);
  await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/' });
  await new Promise((r) => setTimeout(r, 1000));
  console.log('Encoding ' + frames.length + ' frames, ' + frames.at(-1).milliseconds + 'ms');
  const result = await send('Runtime.evaluate', {
    expression: 'window.encode()',
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  const { data, ...metadata } = result.result.value;
  await writeFile(output, Buffer.from(data.split(',')[1], 'base64'), { flag: 'wx' });
  await writeFile(
    output + '.json',
    JSON.stringify(
      { ...metadata, source: dir, renderer: 'Edge MediaRecorder, actual frames, no audio' },
      null,
      2,
    ),
    { flag: 'wx' },
  );
  console.log('Saved ' + output);
} finally {
  try {
    if (ws?.readyState === WebSocket.OPEN) await send('Browser.close', {}, null);
  } catch {}
  ws?.close();
  for (const p of pending.values()) clearTimeout(p.timer);
  browser.kill();
  server.close();
}

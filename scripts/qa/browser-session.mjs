// Local-only QA adapter, based on the existing collectors. No application hooks
// or external uploads. Every run owns an isolated profile and a new evidence dir.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir, platform, release, cpus } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import WebSocket from 'ws';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function startQA(urlString, directory) {
  const url = new URL(urlString);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw Error('Local preview only');
  const output = path.resolve(root, directory);
  if (!output.startsWith(path.resolve(root) + path.sep) || existsSync(output)) throw Error('Use a NEW output directory in this project');
  await mkdir(output, {recursive:true});
  const report = {startedAt:new Date().toISOString(),url:url.href,
    revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    renderer:'Isolated Edge headless / Chromium emulation, NOT Safari or physical iPhone/iPad',
    host:{os:platform(),release:release(),cpu:cpus()[0]?.model,logicalCpus:cpus().length},
    limitations:['Muted output does not verify audible music.','Local production preview with no network/CPU throttling; not a field performance score.',
      'No Safari hardware, native toolbar, real trackpad or physical pinch evidence.'],
    sources:[],artifact:[],cases:[],errors:[]};
  const files = execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
  for (const file of new Set(files)) report.sources.push({file,sha256:hash(await readFile(path.join(root,file)))});
  for (const file of await readdir(path.join(root,'dist/happy-grad-sweetie/browser'))) {
    if (/\.(html|js|css)$/.test(file)) {
      const data=await readFile(path.join(root,'dist/happy-grad-sweetie/browser',file));
      report.artifact.push({file,bytes:data.length,sha256:hash(data)});
    }
  }
  const profile=await mkdtemp(path.join(tmpdir(),'happygrad-final-'));
  const browser=spawn(process.env.HAPPYGRAD_QA_BROWSER??'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',[
    '--headless=new','--no-first-run','--no-default-browser-check','--mute-audio',
    '--edge-skip-compat-layer-relaunch','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank',
  ],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let socket,session,targetId,log='',id=0,active,recording;
  const pending=new Map(),listeners=new Map();
  function send(method,params={},target=session) {
    return new Promise((resolve,reject)=>{
      const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout '+method))},30000);
      pending.set(key,{resolve,reject,timer});
      socket.send(JSON.stringify({id:key,method,params,...(target?{sessionId:target}:{})}));
    });
  }
  async function evaluate(expression) {
    const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);
    return r.result.value;
  }
  async function until(expression,timeout=15000) {
    const end=Date.now()+timeout;
    do {if(await evaluate(expression))return;await wait(100)}while(Date.now()<end);
    throw Error('Condition not met: '+expression);
  }
  async function write(name,data) {
    await writeFile(path.join(output,name),data,{flag:'wx'});
  }
  async function close() {
    report.finishedAt=new Date().toISOString();
    await write('final.json',JSON.stringify(report,null,2));
    await write('browser.log',log);
    try{if(socket?.readyState===WebSocket.OPEN)await send('Browser.close',{},null)}catch{}
    socket?.close();for(const p of pending.values())clearTimeout(p.timer);
    if(browser.exitCode===null)browser.kill();
    console.log('Evidence: '+output+'; cases '+report.cases.length+'; collector errors '+report.errors.length);
  }
  try {
    const endpoint=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Browser startup timeout: '+log.slice(-1500))),20000);
      browser.once('error',e=>{clearTimeout(timer);reject(e)});
      browser.stderr.on('data',data=>{log=(log+data).slice(-20000);const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1])}});
    });
    socket=new WebSocket(endpoint);
    await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject)});
    socket.on('message',raw=>{
      const msg=JSON.parse(raw.toString()),p=pending.get(msg.id);
      if(p){pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result)}
      else for(const fn of listeners.get(msg.method)??[])fn(msg.params,msg.sessionId);
    });
    report.browser=await send('Browser.getVersion',{},null);
    ({targetId}=await send('Target.createTarget',{url:'about:blank'},null));
    session=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Log.enable');
  } catch(error) {report.errors.push(String(error.stack??error));await close();throw error}
  const on=(method,fn)=>{const list=listeners.get(method)??[];list.push(fn);listeners.set(method,list)};
  on('Runtime.exceptionThrown',p=>active?.errors.push({kind:'runtime',details:p.exceptionDetails}));
  on('Runtime.consoleAPICalled',p=>{if(p.type==='error')active?.errors.push({kind:'console',args:p.args})});
  on('Network.responseReceived',p=>active?.network.push({url:p.response.url,status:p.response.status,type:p.type,
    disk:p.response.fromDiskCache??false,protocol:p.response.protocol}));
  on('Network.loadingFailed',p=>{if(!p.canceled)active?.errors.push({kind:'network',error:p.errorText,blocked:p.blockedReason})});
  on('Page.screencastFrame',p=>{if(recording)recording.push(p);send('Page.screencastFrameAck',{sessionId:p.sessionId}).catch(()=>{})});
  async function capture(name) {
    const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await write(name+'.png',Buffer.from(r.data,'base64'));active?.screenshots.push(name+'.png');
  }
  async function point(selector) {
    return evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Missing target");const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');
  }
  async function click(selector,touch=false) {
    const outside=await evaluate('(()=>{const b=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return b.y<0||b.bottom>innerHeight})()');
    if(outside){
      await evaluate('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center",behavior:"instant"})');
      await wait(400);
    }
    const p=await point(selector);
    if(touch){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return}
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});
  }
  async function key(key,modifiers=0) {
    const codes={Enter:13,Escape:27,Tab:9,ArrowLeft:37,ArrowRight:39,Home:36,End:35,' ':32};
    await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key===' '?'Space':key,windowsVirtualKeyCode:codes[key]??0,modifiers,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key===' '?'Space':key,windowsVirtualKeyCode:codes[key]??0,modifiers});
  }
  async function wheel(delta,x=30,y=150) {
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',x,y,deltaX:0,deltaY:delta});
  }
  async function drag(x,y,dx,dy,touch,steps=16) {
    const trace=[];
    if(touch)await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    else await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
    for(let i=1;i<=steps;i++){
      const p={x:x+dx*i/steps,y:y+dy*i/steps};
      if(touch)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]});
      else await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
      if(dy)trace.push(await evaluate('scrollY'));
      await wait(25);
    }
    if(touch)await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    else await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+dx,y:y+dy,button:'left',clickCount:1});
    await wait(900);
    return trace;
  }
  return {url,output,report,send,evaluate,until,on,write,close,capture,point,click,key,wheel,drag,
    targetId,session,
    case(name,extra={}){active={name,...extra,errors:[],network:[],screenshots:[]};report.cases.push(active);return active},
    async viewport(width,height,touch=false,reduced=false){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});
      await send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    },
    async recordingStart(){recording=[];await send('Page.startScreencast',{format:'jpeg',quality:78,maxWidth:1440,maxHeight:1180,everyNthFrame:4})},
    async recordingEnd(name){
      await send('Page.stopScreencast');const frames=recording;recording=null;
      if(!frames?.length)throw Error('No screencast frames');
      await mkdir(path.join(output,name+'-frames'));
      const first=frames[0].metadata.timestamp,manifest=[];
      for(let i=0;i<frames.length;i++){const file=String(i).padStart(5,'0')+'.jpg';manifest.push({file,milliseconds:Math.round((frames[i].metadata.timestamp-first)*1000)});
        await write(name+'-frames/'+file,Buffer.from(frames[i].data,'base64'))}
      await write(name+'-frames/frames.json',JSON.stringify(manifest,null,2));
      return {folder:name+'-frames',frames:frames.length,durationMs:manifest.at(-1).milliseconds};
    },
  };
}

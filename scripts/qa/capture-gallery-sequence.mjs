// Real input against a local production preview; no app-state setters or uploads.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
const root=fileURLToPath(new URL('../../',import.meta.url));
const url=new URL(process.argv[2]??'http://127.0.0.1:4203/');
const output=path.resolve(root,process.argv[3]??'qa/plan1/gallery-sequence-2026-10-13');
const width=Number(process.argv[4]??1440),height=Number(process.argv[5]??900);
if(!['localhost','127.0.0.1'].includes(url.hostname)||!output.startsWith(root)||existsSync(output))throw Error('Use local preview and a new evidence directory.');
await mkdir(output,{recursive:true});
const profile=await mkdtemp(path.join(tmpdir(),'happygrad-sequence-'));
const browser=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',[
 '--headless=new','--no-first-run','--mute-audio','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank',
],{windowsHide:true,stdio:['ignore','ignore','pipe']});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let socket,session,id=0,log='',frames=null,started=0,cursor={x:5,y:5};
const pending=new Map();
const report={capturedAt:new Date().toISOString(),url:url.href,renderer:'Edge headless; NOT physical Safari/device.',width,height,events:[],errors:[],network:[]};
const send=(method,params={},sid=session)=>new Promise((resolve,reject)=>{
 const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Timeout '+method))},30000);
 pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sid?{sessionId:sid}:{})}));
});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;}
async function until(expression){for(let i=0;i<150;i++){if(await evaluate(expression))return;await wait(100)}throw Error('Unmet '+expression);}
const state=`(()=>{const active=document.querySelector('.photo-card[aria-current=true]');return {active:Number(active?.getAttribute('aria-posinset')),logical:Number(active?.parentElement.dataset.logicalIndex),scrollY,modal:!!document.querySelector('.lightbox'),original:document.querySelector('.lightbox img')?.getAttribute('src'),overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.photo-card')].map(e=>{const b=e.getBoundingClientRect();return{logical:Number(e.parentElement.dataset.logicalIndex),front:e.classList.contains('photo-card--front'),progress:Number(getComputedStyle(e).getPropertyValue('--hover-progress')),transform:e.style.transform,rail:e.parentElement.style.transform,x:b.x,y:b.y,right:b.right,bottom:b.bottom,loaded:e.querySelector('img')?.naturalWidth>0}})}})()`;
async function sample(name){const s={name,elapsed:Date.now()-started,...await evaluate(state)};report.events.push(s);return s;}
async function move(point){await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});cursor=point;}
async function glide(point){const from=cursor;for(let step=1;step<=12;step++){await move({x:from.x+(point.x-from.x)*step/12,y:from.y+(point.y-from.y)*step/12});await wait(12)}}
async function click(point){await move(point);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}
async function key(key){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});}
async function exposed(logical){return evaluate(`(()=>{const rail=document.querySelector('[data-logical-index="${logical}"]');if(!rail)return null;const face=rail.querySelector('.photo-card'),b=face.getBoundingClientRect();const hit=(x,y)=>x>=16&&x<innerWidth-16&&y>=16&&y<innerHeight-16&&document.elementFromPoint(x,y)?.closest('.photo-card')===face;for(const fy of [.5,.75,.88,.25,.12])for(const fx of [.5,.25,.75,.12,.88]){const x=b.x+b.width*fx,y=b.y+b.height*fy;if(hit(x,y))return{x,y}}for(let y=Math.max(16,b.top+12);y<Math.min(innerHeight-16,b.bottom-12);y+=8)for(let x=Math.max(16,b.left+12);x<Math.min(innerWidth-16,b.right-12);x+=8)if(hit(x,y))return{x,y};return null})()`);}
async function shot(name){const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(output,name+'.png'),Buffer.from(s.data,'base64'),{flag:'wx'});}
try{
 const endpoint=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Browser timeout')),20000);browser.stderr.on('data',b=>{log+=b;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1])}});browser.once('error',reject)});
 socket=new WebSocket(endpoint);await new Promise((r,j)=>{socket.once('open',r);socket.once('error',j)});
 socket.on('message',b=>{const m=JSON.parse(b);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}return;}
  if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params);
  if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')report.errors.push(m.params.entry);
  if(m.method==='Network.loadingFailed'&&!m.params.canceled)report.errors.push(m.params);
  if(m.method==='Network.responseReceived')report.network.push({url:m.params.response.url,status:m.params.response.status});
  if(m.method==='Page.screencastFrame'){if(frames)frames.push(m.params);send('Page.screencastFrameAck',{sessionId:m.params.sessionId}).catch(()=>{})}
 });
 const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);
 session=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 for(const method of ['Page.enable','Runtime.enable','Network.enable','Log.enable'])await send(method);
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:url.href});await until('!!document.querySelector(".gift-intro button")');await evaluate('document.fonts.ready');await wait(500);
 await click(await evaluate('(()=>{const b=document.querySelector(".gift-intro button").getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()'));
 await until('!document.querySelector(".gift-intro")');await wait(1300);
 await evaluate('document.getElementById("memories").scrollIntoView({behavior:"instant"});document.activeElement?.blur()');await move({x:5,y:5});await wait(700);
 // A short viewport reads this naturally taller section by scrolling. Centre the
 // scene once before recording; never scroll-to-fit in response to hover.
 if(height<850){await evaluate('(()=>{const b=document.querySelector(".gallery__scene").getBoundingClientRect();scrollTo({top:scrollY+b.y+b.height/2-innerHeight/2,behavior:"instant"})})()');await wait(600);}
 started=Date.now();frames=[];await send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1440,maxHeight:900,everyNthFrame:1});
 await sample('idle-start');await wait(5000);const idle=await sample('idle-5s');await shot('idle');
 // Handoff across every exposed desktop card, with actual hit-testing, no synthetic hover state.
 const entry=await exposed((await evaluate(state)).logical);if(!entry)throw Error('No active entry photo');
 await move(entry);await wait(500);const centre=(await sample('hover-centre-entry')).logical;
 for(const offset of [-3,-2,-1,0,1,2,3,2,1,0,-1,-2,-3,0,3]){
  const logical=centre+offset,point=await exposed(logical);
  // Regression is strict: no leaving the rail, no invisible hit span, no synthetic
  // pointerover. Every adjacent handoff must reach an actually visible photo.
  if(!point){await sample('occluded-neighbor-'+logical);await shot('occlusion-failure');throw Error('No visible photo target for direct handoff '+logical);}
  await glide(point);await wait(650);const s=await sample('hover-'+logical);
  const card=s.cards.find(c=>c.logical===logical);
  if((card?.progress??0)<.99)throw Error('Hover handoff did not settle '+logical);
  if(card.x<16||card.right>width-16||card.y<16||card.bottom>height-16)throw Error('Hover clipped '+logical);
  if(offset===-3&&report.events.filter(e=>e.name==='hover-'+logical).length===1)await shot('hover-left');
 }
 await shot('hover-right');await move({x:5,y:5});await wait(4000);await sample('hover-release-resume');
 const b=await evaluate('(()=>{const b=document.querySelector(".gallery__scene").getBoundingClientRect();return{x:b.x+b.width*.7,y:Math.min(innerHeight-40,b.bottom-24)}})()');
 await move(b);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...b});
 for(let i=1;i<=16;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x-i*20,y:b.y,buttons:1});await wait(25)}
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:b.x-320,y:b.y});await move({x:5,y:5});await wait(2500);
 if((await sample('drag-release')).modal)throw Error('Drag opened a modal');
 // Keyboard moves at semantic image boundaries; full real-speed autoplay seam is logged separately.
 await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');
 for(let i=0;i<34&&(await evaluate(state)).active!==34;i++){await key('ArrowLeft');await wait(100)}
 await wait(500);await sample('seam-34');
 for(const k of ['ArrowRight','ArrowLeft','ArrowRight']){await key(k);await wait(800);await sample('seam-'+k)}
 await shot('seam');
 const active=(await evaluate(state)).logical,point=await exposed(active);if(!point)throw Error('No active click point');
 await click(point);await until('document.querySelector(".lightbox img")?.naturalWidth>0');await sample('lightbox-open');await shot('lightbox');await wait(1200);
 await key('Escape');await wait(600);await sample('lightbox-close');
 await evaluate('document.activeElement?.blur()');await move({x:5,y:5});await wait(Math.max(5000,45000-(Date.now()-started)));await sample('final-resume');
 await send('Page.stopScreencast');const captured=frames;frames=null;
 const dir=path.join(output,'sequence-frames');await mkdir(dir);const start=captured[0].metadata.timestamp;
 const manifest=captured.map((f,i)=>({file:String(i).padStart(4,'0')+'.jpg',milliseconds:Math.round((f.metadata.timestamp-start)*1000)}));
 for(let i=0;i<captured.length;i++)await writeFile(path.join(dir,manifest[i].file),Buffer.from(captured[i].data,'base64'),{flag:'wx'});
 await writeFile(path.join(dir,'frames.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
 report.recording={frames:captured.length,duration:manifest.at(-1).milliseconds};
 if(report.network.some(r=>r.status>=400)||report.errors.length)throw Error('Browser errors in report');
 if(report.events.some(e=>e.overflow||e.cards.some(c=>c.front&&!c.loaded)))throw Error('Main image/overflow regression');
 console.log(JSON.stringify({events:report.events.length,recording:report.recording,errors:report.errors.length}));
}catch(error){report.errors.push(String(error.stack??error));process.exitCode=1;}
finally{
 await writeFile(path.join(output,'sequence.json'),JSON.stringify(report,null,2),{flag:'wx'});
 try{if(socket?.readyState===WebSocket.OPEN)await send('Browser.close',{},null)}catch{}
 socket?.close();for(const p of pending.values())clearTimeout(p.timer);browser.kill();console.log(output);
}

// Real production-speed loop. No component setters, time acceleration, or private hooks.
import {startQA, wait} from './browser-session.mjs';
const qa = await startQA(process.argv[2], process.argv[3]);
const {send, evaluate, until, capture} = qa;
const checks = [];
const check = (passed, label, actual) => checks.push({label, passed: !!passed, actual});
const snapshot = `(()=>{const cards=[...document.querySelectorAll('.photo-card')];return{time:performance.now(),y:scrollY,hidden:document.hidden,active:Number(cards.find(e=>e.getAttribute('aria-current')==='true')?.getAttribute('aria-posinset')),anchor:Math.min(...cards.map(e=>Number(e.parentElement.dataset.logicalIndex))),cards:cards.map(e=>{const b=e.getBoundingClientRect();return{id:Number(e.getAttribute('aria-posinset')),logical:Number(e.parentElement.dataset.logicalIndex),x:b.x,y:b.y,width:b.width,loaded:e.querySelector('img')?.naturalWidth>0,front:e.classList.contains('photo-card--front')}})}})()`;
try {
  const p = qa.case('real-speed-full-loop', {samples: []});
  await qa.viewport(1440, 900);
  await send('Page.navigate', {url: qa.url.href});
  await until('!!document.querySelector(".gift-intro")');
  await qa.click('.gift-intro button');
  await until('!document.querySelector(".gift-intro")');
  await wait(1500);
  await evaluate(`(()=>{const b=document.querySelector('.gallery__scene').getBoundingClientRect();scrollTo({top:scrollY+b.y+b.height/2-innerHeight/2,behavior:'instant'});document.activeElement?.blur()})()`);
  await send('Input.dispatchMouseEvent', {type:'mouseMoved',x:2,y:2});
  await wait(1500);
  // Unrecorded frame probe first. Never change the application's RAF or clock.
  await evaluate(`(()=>{window.__loopProbe={frames:[],longTasks:[],last:0,running:true};const p=window.__loopProbe;p.observer=new PerformanceObserver(l=>p.longTasks.push(...l.getEntries().map(e=>({time:e.startTime,duration:e.duration}))));p.observer.observe({type:'longtask'});const frame=t=>{if(!p.running)return;if(p.last)p.frames.push(t-p.last);p.last=t;requestAnimationFrame(frame)};requestAnimationFrame(frame)})()`);
  const started = Date.now(), initial = await evaluate(snapshot);
  let recorded = false, recordingDone = false, measured = false, lastLog = -1;
  const shots = new Set();
  while (Date.now() - started < 490000) {
    const elapsed = (Date.now() - started) / 1000;
    const sample = await evaluate(snapshot);p.samples.push(sample);
    if (!measured && elapsed >= 60) {
      p.performance = await evaluate(`(()=>{const p=window.__loopProbe;p.running=false;p.observer.disconnect();const sorted=[...p.frames].sort((a,b)=>a-b);return{durationSeconds:60,frames:p.frames.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],p99:sorted[Math.floor(sorted.length*.99)],under18ms:p.frames.filter(n=>n<18).length/p.frames.length,longTasks:p.longTasks,method:'60s unrecorded RAF probe; 1s DOM sampling; headless local production, not physical display FPS'}})()`);
      measured = true;console.log('Unrecorded measurement complete: '+JSON.stringify(p.performance));
      await qa.recordingStart();recorded = true;
    }
    if (recorded && !recordingDone) {
      for (const second of [5,15,30,45]) if(elapsed>=60+second&&!shots.has(second)) {await capture('gallery-'+second+'s');shots.add(second)}
      if (elapsed >= 105) {p.recording=await qa.recordingEnd('gallery-45s');recordingDone=true}
    }
    const log = Math.floor(elapsed / 30);
    if(log!==lastLog){console.log('Real loop '+Math.round(elapsed)+'s, image '+sample.active+', anchor '+sample.anchor);lastLog=log}
    if(sample.anchor>=initial.anchor+34)break;
    await wait(1000);
  }
  if(recorded&&!recordingDone)p.recording=await qa.recordingEnd('gallery-45s');
  await capture('full-loop-completed');
  p.durationSeconds=(Date.now()-started)/1000;
  p.ids=[...new Set(p.samples.map(s=>s.active))].sort((a,b)=>a-b);
  p.seams=p.samples.flatMap((s,i)=>i&&s.active===1&&p.samples[i-1].active===34?[{before:p.samples[i-1],after:s}]:[]);
  check(p.ids.length===34,'Autoplay visits all 34 active photos at real speed',p.ids);
  check(p.samples.at(-1).anchor>=initial.anchor+34,'One full 34-photo logical window cycle',p.durationSeconds);
  check(p.seams.length>0,'Observed actual autoplay 34 to 1',p.seams.length);
  check(p.samples.every(s=>s.cards.length<=11),'At most 11 cards throughout loop');
  check(p.samples.every(s=>s.cards.filter(c=>c.front).every(c=>c.loaded)),'Every sampled main card has decoded thumbnail');
  check(p.samples.every(s=>!s.hidden&&Math.abs(s.y-initial.y)<=1),'Loop remains visible at fixed reading position');
  check(!p.network.some(n=>/Image\/original\//.test(n.url)),'No original requests before Lightbox');
  check(!p.errors.length,'No runtime/network errors',p.errors);
  console.log('Full loop finished in '+p.durationSeconds+'s');
} catch(error) {qa.report.errors.push(String(error.stack??error));process.exitCode=1}
finally {qa.report.checks=checks;qa.report.failed=checks.filter(c=>!c.passed);if(qa.report.failed.length)process.exitCode=1;await qa.close()}

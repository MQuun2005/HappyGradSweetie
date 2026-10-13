// Verify evidence, not merely whether a collector exited successfully.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const sha=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const visual=await read('qa/plan1/gallery-2026-10-13-review/scroll.json');
const interactions=await read('qa/plan1/gallery-interactions-2026-10-13-review/scroll.json');
const lifecycle=await read('qa/plan1/gallery-lifecycle-2026-10-13-final/scroll.json');
const production=await read('qa/plan1/gallery-production-2026-10-13-review/scroll.json');
const visibility=await read('qa/plan1/gallery-visibility-2026-10-13/scroll.json');
const baseline=await read('qa/plan1/hero-2026-10-11-final/hero.json');
const phase4=await read('qa/plan1/PHASE4-VERIFICATION.json');
const failures=[],warnings=[],checks=[];
function check(ok,label){checks.push({label,passed:!!ok});if(!ok)failures.push(label);}
for(const r of [visual,interactions,lifecycle,production,visibility]){
 check(!r.errors.length,`Collector: ${r.capturedAt}`);
 for(const p of r.profiles){check(!p.errors.length,`Console/network: ${p.name}`);check(p.network.every(n=>n.status<400),`HTTP: ${p.name}`);}
}
// Column-major 4x4, matching CSS DOMMatrix. Translation/origin do not affect normals.
function mul(a,b){return Array.from({length:16},(_,i)=>{let v=0;for(let k=0;k<4;k++)v+=a[i%4+k*4]*b[k+Math.floor(i/4)*4];return v;});}
function matrix(text){const n=text.slice(text.indexOf('(')+1,-1).split(',').map(Number);return n.length===16?n:[n[0],n[1],0,0,n[2],n[3],0,0,0,0,1,0,n[4],n[5],0,1];}
function camera(c){const x=c.cameraPitch*Math.PI/180,y=c.cameraYaw*Math.PI/180;
 return mul([1,0,0,0,0,Math.cos(x),Math.sin(x),0,0,-Math.sin(x),Math.cos(x),0,0,0,0,1],
 [Math.cos(y),0,-Math.sin(y),0,0,1,0,0,Math.sin(y),0,Math.cos(y),0,0,0,0,1]);}
const hoverChecks=[];
for(const p of visual.profiles){
 const idle=p.idle,main=idle.cards.filter(c=>c.front);
 check(idle.cards.length<=11,`Virtual DOM <=11: ${p.name}`);
 check(main.length===idle.config.visibleRadius*2+1,`Main profile count: ${p.name}`);
 check(main.every(c=>c.complete&&c.naturalWidth>0),`Main thumbnails decoded: ${p.name}`);
 check(idle.scrollWidth<=idle.width,`No horizontal overflow: ${p.name}`);
 for(const h of p.hovers){
   check(!h.error,`Actual pointer hover ${p.name}/${h.logical}`);if(h.error)continue;
   const last=h.samples.at(-1),card=last.cards.find(c=>c.logical===h.logical);
   const m=mul(mul(camera(last.config),matrix(card.railMatrix)),matrix(card.matrix));
   const yaw=Math.atan2(m[8],m[10])*180/Math.PI,pitch=Math.atan2(m[9],m[10])*180/Math.PI;
   const x=last.scene.x+last.scene.width/2,y=last.scene.y+last.scene.height/2,safe=last.viewport.safe;
   const fits=card.x>=x+safe.left-1&&card.right<=x+safe.right+1&&card.y>=y+safe.top-1&&card.bottom<=y+safe.bottom+1;
   hoverChecks.push({profile:p.name,logical:h.logical,yaw,pitch,fits});
   check(Math.abs(yaw)<=5&&Math.abs(pitch)<=5,`Camera-facing ${p.name}/${h.logical}`);
   check(fits,`Projected viewport bounds ${p.name}/${h.logical}`);
   check(!last.frameScheduled,`No idle RAF during held hover ${p.name}/${h.logical}`);
   check(h.samples.every(s=>s.scrollY===last.scrollY),`Hover does not scroll page ${p.name}/${h.logical}`);
 }
}
for(const p of interactions.profiles){const c=p.checks;
 check(Math.abs(c.afterSlowDrag.position-c.beforeDrag.position)>.3,`Full horizontal drag ${p.name}`);
 check(!c.afterSlowDrag.modal&&!c.afterFastDrag.modal,`Drag suppresses click ${p.name}`);
 check(c.afterSlowDrag.scrollY===c.beforeDrag.scrollY,`Horizontal swipe keeps page ${p.name}`);
 check(c.closedModal.position===c.beforeModal.position,`Modal restores position ${p.name}`);
 check(c.closedModal.scrollY===c.beforeModal.scrollY,`Modal restores scroll ${p.name}`);
 check(c.closedModal.focus!==undefined,`Modal restores card focus ${p.name}`);
 check(c.openModal.image.includes('/Image/original/'),`Lightbox original ${p.name}`);
 check(!c.reduced.after.frame&&c.reduced.before.position===c.reduced.after.position,`Runtime reduced motion ${p.name}`);
 check(!c.offscreen.frame,`Offscreen RAF stopped ${p.name}`);
 if(p.touch){check(c.afterVertical.scrollY-c.beforeVertical.scrollY>100,`Vertical swipe exits gallery ${p.name}`);
 check(c.orientation.before.active===c.orientation.after.active,`Orientation preserves photo ${p.name}`);}
}
const cycles=lifecycle.profiles[0].cycles.slice(1);
check(cycles.length===10,'Ten modal/focus lifecycle cycles');
for(const c of cycles){check(c.trap.every(Boolean),`Focus trap cycle ${c.cycle}`);
 check(c.after.position===c.before.position&&c.after.scrollY===c.before.scrollY,`Restoration cycle ${c.cycle}`);
 check(c.after.nodes===cycles[0].after.nodes&&c.after.jsEventListeners===cycles[0].after.jsEventListeners,`DOM/listener counts stable cycle ${c.cycle}`);}
check(lifecycle.profiles[0].hiddenTab.hidden&&!lifecycle.profiles[0].hiddenTab.frame,'Hidden tab stops RAF');
const vis=visibility.profiles[0];
check(vis.hidden.visible==='hidden'&&vis.stillHidden.visible==='hidden','Production tab actually becomes hidden');
check(JSON.stringify(vis.hidden.transforms)===JSON.stringify(vis.stillHidden.transforms),'Hidden production tab keeps exact rail transforms');
check(vis.resumedFirst.visible==='visible'&&vis.resumedLater.visible==='visible','Production tab becomes visible again');
check(JSON.stringify(vis.resumedFirst.transforms)!==JSON.stringify(vis.resumedLater.transforms),'Production motion resumes');
check(vis.resumedFirst.active===vis.stillHidden.active,'Tab resume preserves active image');
check(!vis.landscape.overflow&&vis.landscape.cards.every(c=>c.y>=16&&c.bottom<=vis.landscape.height-16),'Low landscape rail fits after natural scrolling');
warnings.push('Physical Safari/iOS/iPadOS, safe-area hardware and real trackpad still need device evidence. Forced freeze on the dev server was discarded for resume verification; production tab activation is the authoritative test.');
const p=production.profiles[0];
check(p.loop.complete&&p.loop.seen.length===34,'Real-speed all 34 photos loop');
check(p.samples.at(-1).windowStart>=29,'Autoplay actually crosses logical boundary 34');
check(p.samples.every(s=>s.dom<=11&&!s.overflow),'Production DOM bound/overflow');
check(!p.performance.longTasks.length,'No long task in the measured 45-second production sample');
if(p.samples.some(s=>!s.loaded))warnings.push('At least one 1-second sample included a newly inserted lazy buffer image still decoding; screenshot/main-card decode checks are separate.');
const originals=baseline.assets.filter(a=>/\/\d+\.jpg$/.test(a.path));
check(originals.length===68,'34 originals + 34 thumbnails in baseline');
for(const a of originals)check(await sha(a.path)===a.sha256,`Asset unchanged: ${a.path}`);
check(await sha('public/Image/hero/mai-khue-cutout.png')==='c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011','Approved portrait unchanged');
check(await sha('note4.txt')==='883ebbb06d693cb75a47101ca30b2b4c5fa39556c56af62a9498782b64bbd7a1','note4 unchanged');
const changed=[];
for(const source of phase4.sources)if(await sha(source.file)!==source.sha256){changed.push(source.file);check(/interactive-photo-gallery|gallery-layout/.test(source.file),`Change scoped to gallery: ${source.file}`);}
const sources=[];async function fingerprint(dir){for(const e of await readdir(path.join(root,dir),{withFileTypes:true})){const f=path.posix.join(dir,e.name);if(e.isDirectory())await fingerprint(f);else sources.push({file:f,sha256:await sha(f)});}}
await fingerprint('src');
const result={verifiedAt:new Date().toISOString(),checks:checks.length,failures,warnings,hoverChecks,changedSincePhase4:changed,
 unchangedPhotos:originals.length,realSpeedLoop:p.loop,performance:p.performance,sources};
await writeFile(path.join(root,'qa/plan1/PHASE5-VERIFICATION-FINAL.json'),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({...result,sources:undefined},null,2));
if(failures.length)process.exitCode=1;

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const hash=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const checks=[],failures=[];
const check=(ok,label)=>{checks.push({label,passed:!!ok});if(!ok)failures.push(label)};
const sequences=[];
for(const folder of ['gallery-handoff-continuous-2026-10-13-attempt2','gallery-handoff-small-2026-10-13-final','gallery-handoff-large-2026-10-13-final']){
 const file=`qa/plan1/${folder}/sequence.json`,r=await read(file);
 check(!r.errors.length&&r.network.every(n=>n.status<400),`Runtime/network: ${r.width}`);
 check(!r.events.some(e=>e.name.startsWith('occluded-neighbor')),`No exit/re-entry workaround: ${r.width}`);
 const hovers=r.events.filter(e=>/^hover--?\d+$/.test(e.name));
 check(hovers.length===15,`15 actual mouse hover destinations: ${r.width}`);
 let pairs=0;
 for(let i=0;i<hovers.length;i++){
  const e=hovers[i],logical=Number(e.name.slice(6)),card=e.cards.find(c=>c.logical===logical);
  check(card?.progress>=.99,`Hover settled ${r.width}/${i}`);
  check(card?.x>=16&&card.right<=r.width-16&&card.y>=16&&card.bottom<=r.height-16,`Viewport bounds ${r.width}/${i}`);
  check(e.scrollY===hovers[0].scrollY,`No hover-induced scroll ${r.width}/${i}`);
  if(i&&Math.abs(logical-Number(hovers[i-1].name.slice(6)))===1)pairs++;
 }
 check(pairs===12,`12 direct adjacent handoffs both directions: ${r.width}`);
 check(r.events.every(e=>!e.overflow&&e.cards.length<=11&&e.cards.filter(c=>c.front).every(c=>c.loaded)),`Images/DOM/overflow: ${r.width}`);
 const event=name=>r.events.find(e=>e.name===name);
 check(!event('drag-release').modal,`No drag-click: ${r.width}`);
 check(r.events.filter(e=>e.name.startsWith('seam-')).map(e=>e.active).join(',')==='34,1,34,1',`Bidirectional keyboard seam: ${r.width}`);
 check(event('lightbox-open').original.includes('Image/original/')&&event('lightbox-close').scrollY===event('seam-34').scrollY,`Original/scroll restoration: ${r.width}`);
 check(r.events.at(-1).active!==event('lightbox-close').active,`Autoplay resumes: ${r.width}`);
 check(r.recording.duration>=44000,`45-second sequence: ${r.width}`);
 sequences.push({file,width:r.width,height:r.height,adjacentPairs:pairs,frames:r.recording.frames,duration:r.recording.duration});
}
const visual=await read('qa/plan1/gallery-handoff-visual-2026-10-13-final/scroll.json');
const interactions=await read('qa/plan1/gallery-handoff-interactions-2026-10-13-final/scroll.json');
for(const r of [visual,interactions]){
 check(!r.errors.length,`Collector: ${r.capturedAt}`);
 for(const p of r.profiles)check(!p.errors.length&&p.network.every(n=>n.status<400),`Profile runtime/network: ${p.name}`);
}
check(visual.profiles.length===7,'Seven responsive profiles');
for(const p of visual.profiles){
 check(p.idle.cards.length<=11&&p.idle.scrollWidth<=p.width,`Responsive DOM/overflow: ${p.name}`);
 check(p.idle.cards.filter(c=>c.front).every(c=>c.complete&&c.naturalWidth>0),`Responsive main images: ${p.name}`);
 for(const h of p.hovers){
  check(!h.error,`Static actual hover ${p.name}/${h.logical}`);
  if(h.error)continue;
  const s=h.samples.at(-1),c=s.cards.find(c=>c.logical===h.logical);
  check(c.x>=16&&c.right<=p.width-16&&c.y>=16&&c.bottom<=p.height-16,`Static hover bounds ${p.name}/${h.logical}`);
  check(!s.frameScheduled,`Held hover stops RAF ${p.name}/${h.logical}`);
 }
}
for(const p of interactions.profiles){const c=p.checks;
 check(Math.abs(c.afterSlowDrag.position-c.beforeDrag.position)>.3&&!c.afterSlowDrag.modal&&!c.afterFastDrag.modal,`Drag/tap arbitration ${p.name}`);
 check(c.closedModal.position===c.beforeModal.position&&c.closedModal.scrollY===c.beforeModal.scrollY&&c.closedModal.focus!==undefined,`Modal restoration ${p.name}`);
 check(!c.reduced.after.frame&&c.reduced.before.position===c.reduced.after.position&&!c.offscreen.frame,`Reduced/offscreen ${p.name}`);
 if(p.touch)check(c.afterVertical.scrollY-c.beforeVertical.scrollY>100&&c.orientation.before.active===c.orientation.after.active,`Touch vertical/orientation ${p.name}`);
}
const before=await read('qa/plan1/PHASE5-VERIFICATION-FINAL.json'),sources=[],changed=[];
for(const s of before.sources){const sha256=await hash(s.file);sources.push({file:s.file,sha256});if(sha256!==s.sha256){changed.push(s.file);check(/interactive-photo-gallery|gallery-presentation/.test(s.file),`Only hover files changed: ${s.file}`)}}
const baseline=await read('qa/plan1/hero-2026-10-11-final/hero.json');
const assets=baseline.assets.filter(a=>/\/\d+\.jpg$/.test(a.path));
check(assets.length===68,'68 photo baselines');
for(const a of assets)check(await hash(a.path)===a.sha256,`Asset unchanged ${a.path}`);
check(await hash('public/Image/hero/mai-khue-cutout.png')==='c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011','Approved portrait unchanged');
check(await hash('note4.txt')==='883ebbb06d693cb75a47101ca30b2b4c5fa39556c56af62a9498782b64bbd7a1','note4 unchanged');
const result={verifiedAt:new Date().toISOString(),checks:checks.length,failures,sequences,changed,sources,
 limitations:['Chromium emulation only; physical Safari/iOS/iPadOS remain unverified.',
 'Full real-speed 34-photo loop is earlier Phase 5 evidence, not rerun for this hover-only change. Idle rail, speed, assets and loop algorithm unchanged.']};
await writeFile(path.join(root,'qa/plan1/PHASE5-HOVER-VERIFICATION.json'),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({...result,sources:undefined},null,2));if(failures.length)process.exitCode=1;

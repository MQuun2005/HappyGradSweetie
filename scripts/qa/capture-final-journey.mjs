// Phase 7 production journey: trusted CDP input, DOM observations and screenshots.
// No Angular component setters; simulation is limited to device/reduced-motion.
import {startQA,wait} from './browser-session.mjs';
const qa=await startQA(process.argv[2]??'http://127.0.0.1:4205/HappyGradSweetie/',process.argv[3]??'qa/plan1/final-journey-'+Date.now());
const {send,evaluate,until,click,key,wheel,drag,capture}=qa;
const checks=[];
const check=(passed,label,actual)=>checks.push({label,passed:!!passed,...(actual===undefined?{}:{actual})});
const metrics='(()=>{const active=document.querySelector(".photo-card[aria-current=true]"),a=document.querySelector("audio"),story=document.querySelector(".opening-story");return{y:scrollY,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,hash:location.hash,history:history.length,root:{...document.documentElement.dataset},story:{...story?.dataset},body:{position:document.body.style.position,top:document.body.style.top},active:Number(active?.getAttribute("aria-posinset")),logical:Number(active?.parentElement.dataset.logicalIndex),rail:active?.parentElement.style.transform,modal:!!document.querySelector(".lightbox"),count:document.querySelectorAll(".photo-card").length,front:[...document.querySelectorAll(".photo-card--front")].map(e=>({id:e.getAttribute("aria-posinset"),loaded:e.querySelector("img")?.naturalWidth>0})),dot:document.querySelector(".section-nav__dot--active")?.getAttribute("aria-label"),navVisible:!!document.querySelector(".section-nav")&&getComputedStyle(document.querySelector(".section-nav")).display!=="none",audio:{count:document.querySelectorAll("audio").length,time:a?.currentTime,paused:a?.paused,volume:a?.volume},focus:document.activeElement?.className}})()';
const modalMetrics='(()=>{const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};const im=document.querySelector(".lightbox img"),media=document.querySelector(".lightbox__media");return{image:im?{...box(im),src:im.getAttribute("src"),naturalWidth:im.naturalWidth,fit:getComputedStyle(im).objectFit}:null,media:box(media),buttons:[...document.querySelectorAll(".lightbox button")].map(e=>({...box(e),label:e.getAttribute("aria-label")})),title:document.querySelector(".lightbox h2")?.textContent}})()';
async function settle(){await wait(450);await until('!["navigation","alignment","restoration"].includes(document.documentElement.dataset.scrollState)',8000);await wait(250)}
async function goto(id){await evaluate('document.getElementById('+JSON.stringify(id)+').scrollIntoView({behavior:"instant",block:"start"})');await settle()}
async function showRail(){await goto('memories');await evaluate('(()=>{const r=document.querySelector(".gallery__scene").getBoundingClientRect();scrollTo({top:scrollY+r.y+r.height/2-innerHeight/2,behavior:"instant"});document.activeElement?.blur()})()');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:3,y:3});await settle()}
async function open(){await evaluate('document.querySelector(".gift-intro button").scrollIntoView({block:"nearest",behavior:"instant"})');await click('.gift-intro button');await until('!document.querySelector(".gift-intro")');await wait(1400)}
async function hoverPoint(offset){
  return evaluate('(()=>{const a=document.querySelector(".photo-card[aria-current=true]");const index=Number(a.parentElement.dataset.logicalIndex)+'+offset+';const e=document.querySelector("[data-logical-index=\\""+index+"\\"] .photo-card");if(!e)return null;const b=e.getBoundingClientRect();for(let y=Math.max(16,b.y+8);y<Math.min(innerHeight-16,b.bottom-8);y+=10)for(let x=Math.max(16,b.x+8);x<Math.min(innerWidth-16,b.right-8);x+=10)if(document.elementFromPoint(x,y)?.closest(".photo-card")===e)return{x,y,index};return null})()');
}
try {
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__qa={cls:0,lcp:[],longTasks:[],play:[]};new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__qa.cls+=e.value}).observe({type:"layout-shift",buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__qa.lcp.push({time:e.startTime,size:e.size,tag:e.element?.tagName})}).observe({type:"largest-contentful-paint",buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__qa.longTasks.push({time:e.startTime,duration:e.duration})}).observe({type:"longtask",buffered:true});const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__qa.play.push({time:performance.now(),activation:navigator.userActivation.isActive,currentTime:this.currentTime});return originalPlay.call(this)};'});
  const profiles=[['desktop-small',1366,768,false],['desktop',1440,900,false],['desktop-large',1920,1080,false],
    ['iphone',393,852,true],['iphone-landscape',852,393,true],['ipad-p',820,1180,true],['ipad-l',1180,820,true],
    ['iphone-text200',393,852,true,2],['iphone-reduced',393,852,true,1,true]];
  for(const [name,width,height,touch,font=1,reduced=false]of profiles){
    if(process.argv[4]&&process.argv[4]!==name)continue;
    console.log('Final journey '+name);
    const p=qa.case(name,{width,height,touch,font,reduced,events:[]});
    const record=['desktop','iphone','ipad-p'].includes(name);
    try {
      await qa.viewport(width,height,touch,reduced);
      await send('Page.navigate',{url:qa.url.href});
      await until('!!document.querySelector("#home")');
      if(!await evaluate('!!document.querySelector(".gift-intro")')){
        await evaluate('sessionStorage.clear()');await send('Page.reload');await until('!!document.querySelector(".gift-intro")');
      }
      await evaluate('document.fonts.ready.then(()=>true)');
      if(font!==1)await evaluate('document.documentElement.style.fontSize="'+font*100+'%"');
      await wait(500);
      p.intro=await evaluate(metrics);
      check(p.intro.body.position==='fixed',name+' Intro background locked');
      check(await evaluate('document.querySelector("main").inert'),name+' main inert during Intro');
      await capture(name+'-intro');
      if(record)await qa.recordingStart();
      await open();
      p.home=await evaluate(metrics);p.audioActivation=await evaluate('window.__qa.play');
      check(p.audioActivation[0]?.activation===true,name+' audio.play in trusted gesture',p.audioActivation);
      check(p.home.audio.count===1,name+' one audio');
      await capture(name+'-hero');
      p.originalsBefore=p.network.filter(n=>/Image\/original\/\d+\.jpg/.test(n.url));
      check(p.originalsBefore.length===0,name+' no original images on normal Hero startup',p.originalsBefore);
      check(p.home.navVisible===(!touch&&width>=1024),name+' navigator capability profile');
      if(font===1) {
        await click('#home a');
        await settle();
        p.cta=await evaluate(metrics);
        check(p.cta.hash==='#invitation',name+' Hero CTA navigates invitation',p.cta.hash);
        check(Math.abs(await evaluate('document.getElementById("invitation").getBoundingClientRect().top'))<=4,name+' invitation anchor aligned');
      } else await goto('invitation');
      await capture(name+'-invitation');
      p.ribbon=await evaluate('(()=>{const ribbon=document.querySelector(".invitation__ribbon"),tail=parseFloat(getComputedStyle(ribbon,"::after").borderTopWidth),text=document.querySelector(".invitation__eyebrow");return{tailBottom:ribbon.getBoundingClientRect().bottom+tail,textTop:text.getBoundingClientRect().top}})()');
      check(p.ribbon.textTop-p.ribbon.tailBottom>=4,name+' invitation ribbon clears readable text',p.ribbon);
      for(const id of ['message','memories']){
        const delta=await evaluate('document.getElementById("'+id+'").getBoundingClientRect().top');
        await wheel(delta,30,Math.min(height-20,180));await settle();
        const m=await evaluate(metrics);p.events.push({section:id,...m});
        check(m.scrollWidth<=width+1&&m.width<=width+1,name+' '+id+' no horizontal overflow');
        await capture(name+'-'+id);
      }
      await showRail();await wait(1300);
      p.rail=await evaluate(metrics);
      check(p.rail.front.length>0&&p.rail.front.every(i=>i.loaded),name+' real front images loaded',p.rail.front);
      check(p.rail.count<=11,name+' virtual window bounded');
      const startRail=p.rail.rail;await wait(reduced?700:1200);
      p.idle=await evaluate(metrics);
      check(reduced?p.idle.rail===startRail:p.idle.rail!==startRail,name+' autoplay/reduced motion');
      if(!touch){
        p.hover=[];
        for(const offset of [-2,0,2]){
          const point=await hoverPoint(offset);check(!!point,name+' exposed hover '+offset);
          if(!point)continue;
          await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});await wait(900);
          const h=await evaluate('(()=>{const e=document.querySelector("[data-logical-index=\\"'+point.index+'\\"] .photo-card"),r=e.getBoundingClientRect();return{progress:Number(e.style.getPropertyValue("--hover-progress")),x:r.x,y:r.y,right:r.right,bottom:r.bottom}})()');
          p.hover.push(h);check(h.progress>.99&&h.x>=15&&h.y>=15&&h.right<=width-15&&h.bottom<=height-15,name+' hover fits '+offset,h);
        }
        await capture(name+'-hover');
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:3,y:3});await wait(1000);
      }
      const center=await qa.point('.gallery__scene'),beforeDrag=await evaluate(metrics);
      await drag(width*.68,Math.min(height-45,Math.max(45,center.y)), -Math.min(width*.42,300),0,touch);
      p.drag={before:beforeDrag,after:await evaluate(metrics)};
      check(!p.drag.after.modal&&Math.abs(p.drag.after.y-beforeDrag.y)<=2,name+' drag does not click/scroll page');
      check(p.drag.after.rail!==beforeDrag.rail,name+' drag changes rail');
      if(touch){
        const before=await evaluate('scrollY');const trace=await drag(width*.12,height*.88,0,-height*.72,true);
        p.vertical={before,trace,after:await evaluate('scrollY')};
        check(p.vertical.after>before+20,name+' vertical swipe escapes Gallery',p.vertical);
        await showRail();
      }
      await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');await key('ArrowRight');await wait(500);
      p.beforeModal=await evaluate(metrics);
      await key('Enter');await until('!!document.querySelector(".lightbox")');await until('document.querySelector(".lightbox img")?.naturalWidth>0');await wait(400);
      p.modal=await evaluate(modalMetrics);p.modalState=await evaluate(metrics);
      check(p.modal.image?.src==='Image/original/'+p.beforeModal.active+'.jpg',name+' correct original opened',p.modal.image?.src);
      check(p.modal.image?.fit==='contain',name+' modal contain');
      check(p.modal.image.y>=p.modal.media.y-1&&p.modal.image.bottom<=p.modal.media.bottom+1,name+' entire image inside media',p.modal);
      check(p.modal.buttons.every(b=>b.width>=44&&b.height>=44&&b.x>=0&&b.right<=width&&b.y>=0&&b.bottom<=height),name+' modal buttons reachable 44px',p.modal.buttons);
      check(await evaluate('[...document.querySelectorAll(".lightbox button")].every(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest("button")===e})'),name+' modal button centres not clipped');
      check(p.modalState.body.position==='fixed',name+' modal background lock');
      p.trap=[];
      for(let i=0;i<6;i++){await key('Tab');p.trap.push(await evaluate('!!document.activeElement?.closest(".lightbox")'))}
      check(p.trap.every(Boolean),name+' focus trap');
      await capture(name+'-lightbox');
      await key('ArrowRight');await until('document.querySelector(".lightbox img")?.getAttribute("src")==="Image/original/'+(p.beforeModal.active%34+1)+'.jpg" && document.querySelector(".lightbox img")?.naturalWidth>0');await wait(250);
      p.modalNext=await evaluate(modalMetrics);
      check(p.modalNext.image.src==='Image/original/'+(p.beforeModal.active%34+1)+'.jpg',name+' next original');
      if(touch&&font===1){const m=p.modalNext.media;await drag(width*.65,m.y+m.height*.5,-width*.3,0,true);p.modalSwipe=await evaluate(modalMetrics);check(p.modalSwipe.image?.src!==p.modalNext.image.src,name+' Lightbox swipe')}
      await wheel(200);await wait(200);
      p.modalLockAfter=await evaluate(metrics);
      check(p.modalLockAfter.body.top===p.modalState.body.top&&p.modalLockAfter.y===p.modalState.y,name+' wheel cannot move modal background');
      await key('Escape');await until('!document.querySelector(".lightbox")');await settle();
      p.afterModal=await evaluate(metrics);
      check(Math.abs(p.afterModal.y-p.beforeModal.y)<=1,name+' scroll restored',p.afterModal.y-p.beforeModal.y);
      check(p.afterModal.logical===p.beforeModal.logical,name+' Gallery position preserved');
      check(String(p.afterModal.focus).includes('photo-card'),name+' card focus restored');
      await goto('letter');await capture(name+'-letter');
      const letter=await evaluate('(()=>{const r=document.getElementById("letter").getBoundingClientRect();return{top:scrollY+r.y,height:r.height}})()');
      const reading=letter.top+Math.max(0,(letter.height-height)*.5);
      await evaluate('scrollTo({top:'+reading+',behavior:"instant"})');await wait(1000);
      p.letter={...letter,target:reading,after:await evaluate('scrollY')};
      check(letter.height<=height||Math.abs(p.letter.after-reading)<=1,name+' long letter not snapped away');
      await goto('closing');await capture(name+'-closing');
      p.beforeReplay=await evaluate(metrics);await click('#closing button');
      await until('!!document.querySelector(".gift-intro")');await open();
      p.replay=await evaluate(metrics);
      check(p.replay.hash==='#home'&&Math.abs(p.replay.y)<=1,name+' replay home');
      check(p.replay.audio.count===1&&p.replay.audio.time>=p.beforeReplay.audio.time,name+' replay does not reset audio');
      if(record)p.recording=await qa.recordingEnd(name+'-journey');
      for(const hash of ['#invitation','#memories']){
        await send('Page.navigate',{url:qa.url.href+hash});await until('!!document.querySelector("#home")');await wait(1400);
        const target=await evaluate('document.getElementById('+JSON.stringify(hash.slice(1))+').getBoundingClientRect().top');
        check(Math.abs(target)<=4,name+' refresh '+hash,target);
      }
      p.finish=await evaluate(metrics);p.performance=await evaluate('window.__qa');
      check(!p.errors.length,name+' no unexpected runtime/network errors',p.errors);
      check(p.network.every(n=>n.status<400),name+' successful HTTP responses');
    } catch(error){p.failure=String(error.stack??error);check(false,name+' journey completed',p.failure)}
  }
}catch(error){qa.report.errors.push(String(error.stack??error));process.exitCode=1}
finally{qa.report.checks=checks;qa.report.failed=checks.filter(c=>!c.passed);if(qa.report.failed.length)process.exitCode=1;await qa.close()}

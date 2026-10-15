import {startQA,wait} from './browser-session.mjs';
const qa=await startQA(process.argv[2],process.argv[3]),checks=[];
const {send,evaluate,until,wheel}=qa;
const check=(passed,label,actual)=>checks.push({label,passed:!!passed,actual});
const metrics=`(()=>({y:scrollY,height:visualViewport.height,hash:location.hash,history:history.length,state:{...document.documentElement.dataset},profile:document.querySelector('.opening-story').dataset.storyProfile,sections:['home','invitation','message','memories','letter','closing'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return{id,top:r.y+scrollY,height:r.height}})}))()`;
async function settle(){await wait(500);await until('!["alignment","navigation","restoration"].includes(document.documentElement.dataset.scrollState)',7000);await wait(150)}
async function go(y){await evaluate(`scrollTo({top:${y},behavior:'instant'})`);await wait(450)}
try{
 const profiles=[['desktop-small',1366,768,false],['desktop',1440,900,false],['desktop-large',1920,1080,false],['iphone',393,852,true],['iphone-landscape',852,393,true],['ipad-p',820,1180,true],['ipad-l',1180,820,true]];
 for(const [name,width,height,touch]of profiles){
  console.log('Scroll matrix '+name);const p=qa.case(name,{alignment:[],reading:[],story:[]});
  await qa.viewport(width,height,touch);await send('Page.navigate',{url:qa.url.href});await until('!!document.querySelector("#home")');
  await evaluate('document.fonts.ready.then(()=>true)');if(await evaluate('!!document.querySelector(".gift-intro")'))await qa.click('.gift-intro button',touch);await wait(1400);
  const m=await evaluate(metrics);p.baseline=m;
  check(await evaluate('getComputedStyle(document.documentElement).scrollSnapType==="none"'),'One scroll owner '+name);
  check(await evaluate('document.querySelectorAll(".pin-spacer").length===0'),'No pin spacers '+name);
  for(let i=0;i<m.sections.length-1;i++){
   const a=m.sections[i],b=m.sections[i+1];
   if(i===0&&m.profile==='sticky')continue;
   if(a.height>m.height+8||b.height>m.height+8||b.top-a.top>m.height*1.12)continue;
   for(const direction of [1,-1])for(const progress of [.25,.5,.75]){
    const target=a.top+(b.top-a.top)*progress;await go(target-direction*20);await wheel(direction*20,12,Math.min(height-20,180));await settle();
    const actual=await evaluate(metrics),expected=touch?(progress===.5?(direction<0?a:b):(progress<.5?a:b)):(direction>0?(progress>=.35?b:a):(progress<=.65?a:b));
    const result={pair:a.id+'-'+b.id,direction,progress,expected:expected.top,actual:actual.y,error:Math.abs(actual.y-expected.top)};p.alignment.push(result);
    check(result.error<=4,name+' '+result.pair+' '+direction+'/'+progress,result);
    check(actual.hash===m.hash&&actual.history===m.history,name+' passive scroll no new hash/history');
   }
  }
  const letter=m.sections.find(s=>s.id==='letter');
  if(letter.height>m.height+8)for(const progress of [.25,.5,.75]){
   const target=letter.top+(letter.height-m.height)*progress;await go(target-10);await wheel(10);await settle();const actual=await evaluate(metrics);p.reading.push({progress,target,actual:actual.y});check(Math.abs(target-actual.y)<=2,name+' Letter reads at '+progress);
  }
  if(m.profile==='sticky')for(const progress of [.25,.5,.75,1,.75,.5,.25,0]){
   const target=m.sections[1].top*progress;await go(Math.max(0,target-10));await wheel(target?10:-10);await settle();const result=await evaluate(metrics);p.story.push({progress,...result});check(Math.abs(target-result.y)<=2,name+' sticky does not snap at '+progress);
  }
  check(!p.errors.length,name+' no unexpected errors',p.errors);
 }
 const p=qa.case('scrollend-fallback-and-cancel');
 await qa.viewport(1440,900);await send('Page.addScriptToEvaluateOnNewDocument',{source:'delete Document.prototype.onscrollend;'});
 await send('Page.navigate',{url:qa.url.href});await until('!!document.querySelector("#home")');await evaluate('document.fonts.ready.then(()=>true)');await wait(1000);
 check(await evaluate('!("onscrollend" in document)'),'Fallback really has no scrollend');
 const m=await evaluate(metrics);const i=m.sections.findIndex((a,i)=>i>0&&i<m.sections.length-1&&a.height<=m.height+8&&m.sections[i+1].height<=m.height+8);
 if(i<0)throw Error('No eligible pair for fallback test');
 const a=m.sections[i],b=m.sections[i+1],target=a.top+(b.top-a.top)*.5;
 await go(target-20);await wheel(20);await settle();p.fallback=await evaluate(metrics);check(Math.abs(p.fallback.y-b.top)<=4,'Debounced fallback aligns to correct anchor');
 await go(target-20);await wheel(20);await until('document.documentElement.dataset.scrollState==="alignment"');p.beforeCancel=await evaluate(metrics);
 // Holding a new pointer is an actual input cancellation, not a private controller call.
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:12,y:120,button:'left',buttons:1,clickCount:1});await wait(500);p.held=await evaluate(metrics);
 check(p.held.state.scrollState!=='alignment'&&Math.abs(p.held.y-p.beforeCancel.y)<80,'New input cancels in-flight correction',p.held);
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:12,y:120,button:'left',clickCount:1});await settle();
 check(!p.errors.length,'Fallback/cancel no runtime errors',p.errors);
}catch(error){qa.report.errors.push(String(error.stack??error));process.exitCode=1}
finally{qa.report.checks=checks;qa.report.failed=checks.filter(c=>!c.passed);if(qa.report.failed.length)process.exitCode=1;await qa.close()}

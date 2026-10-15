// Fault injection is explicit and isolated in each local browser navigation.
// Expected blocked requests are kept in evidence, never removed from the log.
import {startQA,wait} from './browser-session.mjs';
const qa=await startQA(process.argv[2]??'http://127.0.0.1:4205/HappyGradSweetie/',process.argv[3]??'qa/plan1/final-resilience-'+Date.now());
const {send,evaluate,until,key,capture,click}=qa,checks=[];
const check=(passed,label,actual)=>checks.push({label,passed:!!passed,...(actual===undefined?{}:{actual})});
async function fresh(source,blocked=[]) {
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Network.setBlockedURLs',{urls:blocked});
  const script=await send('Page.addScriptToEvaluateOnNewDocument',{source:'try{sessionStorage.clear()}catch{};'+(source??'')});
  await send('Page.navigate',{url:qa.url.href});await until('!!document.querySelector("#home")');await wait(800);
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
}
async function open(){await evaluate('document.querySelector(".gift-intro button").scrollIntoView({block:"nearest",behavior:"instant"})');await click('.gift-intro button');await until('!document.querySelector(".gift-intro")');await wait(1000)}
async function gallery(){await evaluate('document.getElementById("memories").scrollIntoView({behavior:"instant"})');await wait(700);await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');await key('Enter');await until('!!document.querySelector(".lightbox")')}
try{
  await qa.viewport(1440,900);
  let p=qa.case('autoplay-rejection',{injection:'session Intro skipped, every play rejects NotAllowedError'});
  await fresh('sessionStorage.setItem("happy-grad-sweetie:intro-seen","true");window.__playAttempts=[];HTMLMediaElement.prototype.play=function(){window.__playAttempts.push({time:performance.now(),activation:navigator.userActivation.isActive});return Promise.reject(new DOMException("QA policy block","NotAllowedError"))}');
  await wait(600);p.initial=await evaluate('window.__playAttempts');
  check(p.initial.length===1,'Skipped Intro attempts autoplay once',p.initial);
  await key('Control',2);p.afterModifier=await evaluate('window.__playAttempts');
  check(p.afterModifier.length===1,'Modifier does not retry audio');
  await key('Enter');await wait(300);p.afterGesture=await evaluate('window.__playAttempts');
  check(p.afterGesture.length===2&&p.afterGesture[1].activation,'Eligible keyboard retries once',p.afterGesture);
  await key('Enter');await click('#home a');await wait(1000);p.final=await evaluate('window.__playAttempts');
  check(p.final.length===2,'Rejected audio is not retried indefinitely');
  check(!p.errors.length,'Audio rejection has no unhandled error',p.errors);
  await capture('audio-rejection-safe');

  p=qa.case('audio-network-error',{injection:'Block audio URL only'});
  await fresh('', ['*Audio/*']);await open();
  p.state=await evaluate('({audio:document.querySelector("audio")?.error?.code,intro:!!document.querySelector(".gift-intro"),heading:document.querySelector("#home h1")?.textContent,buttons:document.querySelector("app-music-control")?.querySelectorAll("button").length})');
  check(p.state.audio>0&&!p.state.intro&&p.state.buttons===0,'Audio network failure does not block gift',p.state);
  check(p.errors.every(e=>e.kind==='network'),'Audio fault only expected network errors',p.errors);

  p=qa.case('portrait-source-fallback',{injection:'Block cutout WebP and PNG, preserve original 1.jpg'});
  await fresh('', ['*Image/hero/*']);await open();
  await until('document.querySelector("app-graduation-portrait img")?.naturalWidth>0');
  p.state=await evaluate('({src:document.querySelector("app-graduation-portrait img")?.getAttribute("src"),profile:document.querySelector(".opening-story").dataset.storyProfile,editorial:document.querySelector("app-graduation-portrait").classList.contains("portrait--editorial")})');
  check(p.state.src==='Image/original/1.jpg'&&p.state.editorial,'Original editorial portrait fallback',p.state);
  check(p.state.profile!=='sticky','Portrait fallback disables sticky profile',p.state);
  await capture('portrait-original-fallback');

  p=qa.case('portrait-all-images-failed',{injection:'Block portrait and original source'});
  await fresh('', ['*Image/hero/*','*Image/original/1.jpg']);await open();
  await until('!!document.querySelector(".portrait__unavailable")');
  p.state=await evaluate('({text:document.querySelector(".portrait__unavailable").textContent,heading:document.querySelector("#home h1").textContent,cta:!!document.querySelector("#home a")})');
  check(!!p.state.text&&p.state.cta,'Portrait terminal failure keeps message and CTA',p.state);
  await capture('portrait-readable-error');

  p=qa.case('lightbox-original-failure',{injection:'Block originals only; thumbnails still load'});
  await fresh('', ['*Image/original/*']);await open();await gallery();
  await until('!!document.querySelector(".lightbox__error")');
  p.before=await evaluate('document.querySelector(".lightbox h2").textContent');await key('ArrowRight');await wait(400);
  p.after=await evaluate('document.querySelector(".lightbox h2").textContent');
  check(p.after!==p.before,'Failed original still permits circular navigation');
  await capture('lightbox-readable-error');await key('Escape');await wait(400);
  check(!await evaluate('!!document.querySelector(".lightbox")'),'Failed original still permits closing');

  p=qa.case('storage-unavailable',{injection:'sessionStorage getter throws SecurityError'});
  await fresh('Object.defineProperty(window,"sessionStorage",{get(){throw new DOMException("QA disabled","SecurityError")}})');
  await open();await evaluate('document.getElementById("closing").scrollIntoView({behavior:"instant"})');await wait(400);await click('#closing button');
  await until('!!document.querySelector(".gift-intro")');await open();
  check(!p.errors.length,'Blocked session storage retains open/replay',p.errors);
  await capture('storage-replay-safe');
}catch(error){qa.report.errors.push(String(error.stack??error));process.exitCode=1}
finally{qa.report.checks=checks;qa.report.failed=checks.filter(c=>!c.passed);if(qa.report.failed.length)process.exitCode=1;await qa.close()}

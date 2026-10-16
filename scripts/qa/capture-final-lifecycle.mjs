import { startQA, wait } from './browser-session.mjs';
const qa = await startQA(
  process.argv[2] ?? 'http://127.0.0.1:4205/HappyGradSweetie/',
  process.argv[3] ?? 'qa/plan1/final-lifecycle-' + Date.now(),
);
const { send, evaluate, until, key, click, capture } = qa,
  checks = [];
const cycles = Number(process.argv[4] ?? 11);
if (!Number.isInteger(cycles) || cycles < 11 || cycles > 61) throw Error('Use 11–61 cycles');
const withHeapSnapshots = process.argv[5] === '--heap-snapshots';
let heapChunks;
qa.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }) => heapChunks?.push(chunk));
async function heapSnapshot(cycle) {
  heapChunks = [];
  await send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  const name = 'heap-cycle-' + cycle + '.heapsnapshot';
  await qa.write(name, heapChunks.join(''));
  heapChunks = undefined;
  console.log('Saved ' + name);
  return name;
}
const check = (passed, label, actual) =>
  checks.push({ label, passed: !!passed, ...(actual === undefined ? {} : { actual }) });
const state =
  '(()=>{const c=document.querySelector(".photo-card[aria-current=true]");return{y:scrollY,hidden:document.hidden,active:Number(c?.getAttribute("aria-posinset")),logical:Number(c?.parentElement.dataset.logicalIndex),rails:[...document.querySelectorAll(".photo-card__rail")].map(e=>e.style.transform),willChange:[...document.querySelectorAll(".photo-card__rail")].map(e=>e.style.willChange),root:{...document.documentElement.dataset},story:{...document.querySelector(".opening-story").dataset},audio:document.querySelector("audio")?.currentTime,pendingRAF:[...window.__pendingRAF.values()],rafCalls:window.__rafCalls}})()';
async function goto(id) {
  await evaluate('document.getElementById("' + id + '").scrollIntoView({behavior:"instant"})');
  await wait(650);
}
async function showRail() {
  await goto('memories');
  await evaluate(
    '(()=>{const b=document.querySelector(".gallery__scene").getBoundingClientRect();scrollTo({top:scrollY+b.y+b.height/2-innerHeight/2,behavior:"instant"})})()',
  );
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
  await wait(700);
}
async function open() {
  await click('.gift-intro button');
  await until('!document.querySelector(".gift-intro")');
  await wait(1400);
}
async function counts() {
  const listeners = {};
  for (const [name, expression] of [
    ['window', 'window'],
    ['document', 'document'],
    ['scene', 'document.querySelector(".gallery__scene")'],
  ]) {
    const obj = await send('Runtime.evaluate', { expression });
    const list = await send('DOMDebugger.getEventListeners', { objectId: obj.result.objectId });
    listeners[name] = list.listeners.length;
    await send('Runtime.releaseObject', { objectId: obj.result.objectId });
  }
  await send('HeapProfiler.collectGarbage');
  return {
    listeners,
    dom: await send('Memory.getDOMCounters'),
    heap: (await send('Runtime.getHeapUsage')).usedSize,
    ...(await evaluate(state)),
  };
}
try {
  await qa.viewport(1440, 900);
  // Observe scheduling, not app internals. Callbacks execute unchanged; instrumentation
  // adds overhead, so these counts are NOT a frame-performance measurement.
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      'window.__pendingRAF=new Map();window.__rafCalls={};const req=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{const label=callback.name||callback.toString().slice(0,100);let id=req(t=>{window.__pendingRAF.delete(id);window.__rafCalls[label]=(window.__rafCalls[label]||0)+1;callback(t)});window.__pendingRAF.set(id,label);return id};window.cancelAnimationFrame=id=>{window.__pendingRAF.delete(id);cancel(id)};',
  });
  let p = qa.case('lifecycle-and-visibility', { cycles: [] });
  await send('Page.navigate', { url: qa.url.href });
  await until('!!document.querySelector(".gift-intro")');
  await open();
  await showRail();
  await evaluate('document.activeElement?.blur()');
  await wait(1000);
  p.running = await evaluate(state);
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await wait(1000);
  p.reduced1 = await evaluate(state);
  await wait(1000);
  p.reduced2 = await evaluate(state);
  check(
    JSON.stringify(p.reduced1.rails) === JSON.stringify(p.reduced2.rails),
    'Runtime reduced motion stops rail',
  );
  check(
    p.reduced2.willChange.every((v) => v === 'auto'),
    'Reduced motion releases compositing hints',
  );
  await key('Tab');
  await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');
  await key('ArrowRight');
  const reducedAfterKey = await evaluate(state);
  check(reducedAfterKey.active !== p.reduced2.active, 'Reduced motion retains keyboard controls');
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  await evaluate('document.activeElement.blur()');
  await wait(1000);
  await goto('home');
  await wait(1000);
  p.offscreen1 = await evaluate(state);
  await wait(1000);
  p.offscreen2 = await evaluate(state);
  check(
    JSON.stringify(p.offscreen1.rails) === JSON.stringify(p.offscreen2.rails),
    'Offscreen rail stops writing transforms',
  );
  check(
    p.offscreen2.willChange.every((v) => v === 'auto'),
    'Offscreen releases compositing hints',
  );
  await showRail();
  const { targetId: other } = await send('Target.createTarget', { url: 'about:blank' }, null);
  await send('Target.activateTarget', { targetId: other }, null);
  await wait(500);
  p.hidden1 = await evaluate(state);
  await wait(1000);
  p.hidden2 = await evaluate(state);
  check(p.hidden1.hidden && p.hidden2.hidden, 'Ordinary tab switch hides page');
  check(
    JSON.stringify(p.hidden1.rails) === JSON.stringify(p.hidden2.rails),
    'Hidden page stops rail',
  );
  await send('Target.activateTarget', { targetId: qa.targetId }, null);
  await wait(1000);
  p.resumed = await evaluate(state);
  check(
    !p.resumed.hidden && p.resumed.active === p.hidden2.active,
    'Resume without accumulated position jump',
  );
  await send('Target.closeTarget', { targetId: other }, null);
  for (let i = 0; i < cycles; i++) {
    await showRail();
    await evaluate(
      'document.querySelector(".photo-card[aria-current=true]").focus({preventScroll:true})',
    );
    await wait(500);
    const before = await evaluate(state);
    await key('Enter');
    await until('document.querySelector(".lightbox img")?.naturalWidth>0');
    await key('Escape');
    await until('!document.querySelector(".lightbox")');
    await wait(700);
    const after = await evaluate(state);
    check(
      Math.abs(after.y - before.y) <= 1 && after.logical === before.logical,
      'Modal cycle ' + i + ' restores scroll/rail',
    );
    await qa.viewport(1366, 768);
    await wait(350);
    await qa.viewport(1440, 900);
    await wait(350);
    await goto('closing');
    await click('#closing button');
    await until('!!document.querySelector(".gift-intro")');
    await open();
    await showRail();
    await evaluate(
      'document.querySelector(".photo-card[aria-current=true]").focus({preventScroll:true})',
    );
    await wait(700);
    p.cycles.push({ cycle: i, ...(await counts()) });
    console.log('Final lifecycle cycle ' + i);
    if (withHeapSnapshots && (i === 10 || i === cycles - 1)) {
      p.heapSnapshots ??= [];
      p.heapSnapshots.push({ cycle: i, file: await heapSnapshot(i) });
    }
  }
  const steady = p.cycles.slice(1);
  check(
    steady.every((c) => JSON.stringify(c.listeners) === JSON.stringify(steady[0].listeners)),
    'Listener counts stable through ' + steady.length + ' replay/modal/resize cycles',
    steady.map((c) => c.listeners),
  );
  check(
    Math.max(...steady.map((c) => c.dom.jsEventListeners)) -
      Math.min(...steady.map((c) => c.dom.jsEventListeners)) <=
      5,
    'DOM event-listener count bounded',
    steady.map((c) => c.dom),
  );
  check(
    steady.at(-1).heap < steady[0].heap * 1.25,
    'Post-GC heap bounded (not proof against every leak)',
    steady.map((c) => c.heap),
  );
  check(
    Math.max(...steady.map((c) => c.pendingRAF.length)) <= steady[0].pendingRAF.length + 1,
    'Pending RAF count does not accumulate',
    steady.map((c) => c.pendingRAF),
  );
  p.seam = [];
  const originalsBefore = p.network.filter((n) => /Image\/original\//.test(n.url)).length;
  await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');
  for (let i = 0; i < 35; i++) {
    await key('ArrowRight');
    await wait(75);
    p.seam.push(await evaluate(state));
  }
  check(new Set(p.seam.map((s) => s.active)).size === 34, 'Keyboard visits all 34 images and seam');
  check(
    p.network.filter((n) => /Image\/original\//.test(n.url)).length === originalsBefore,
    'Keyboard traversal does not preload originals',
  );
  await capture('keyboard-seam');
  p.accessibility = await send('Accessibility.getFullAXTree');
  await qa.write('accessibility-tree.json', JSON.stringify(p.accessibility, null, 2));
  delete p.accessibility;
  p.buttons = await evaluate(
    '[...document.querySelectorAll("button,a")].filter(e=>e.getClientRects().length&&!e.closest("[aria-hidden=true]")).map(e=>({label:e.getAttribute("aria-label")||e.textContent.trim(),tab:e.tabIndex,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))',
  );
  check(
    p.buttons.every((b) => b.label.length > 0),
    'Visible controls have accessible labels',
  );
  check(!p.errors.length, 'Lifecycle has no runtime/network errors', p.errors);

  p = qa.case('history-and-orientation');
  await goto('home');
  await click('#home a');
  await wait(1000);
  const invitation = await evaluate('({hash:location.hash,y:scrollY,len:history.length})');
  await click('.section-nav__item:nth-child(4) button');
  await wait(1200);
  p.memories = await evaluate('({hash:location.hash,y:scrollY,len:history.length})');
  check(p.memories.len === invitation.len + 1, 'Explicit chapter creates one history entry');
  await evaluate('history.back()');
  await wait(1000);
  p.back = await evaluate('({hash:location.hash,y:scrollY})');
  check(
    p.back.hash === '#invitation' && Math.abs(p.back.y - invitation.y) <= 4,
    'Back restores saved reading position',
    p.back,
  );
  await evaluate('history.forward()');
  await wait(1000);
  p.forward = await evaluate('({hash:location.hash,y:scrollY})');
  check(
    p.forward.hash === '#memories' && Math.abs(p.forward.y - p.memories.y) <= 4,
    'Forward restores chapter',
  );
  await qa.viewport(820, 1180, true);
  await showRail();
  await evaluate('document.querySelector(".gallery__scene").focus({preventScroll:true})');
  p.portrait = await evaluate(state);
  await qa.viewport(1180, 820, true);
  await wait(1000);
  p.landscape = await evaluate(state);
  check(p.landscape.active === p.portrait.active, 'Orientation retains active photo');
  await capture('ipad-orientation');
} catch (error) {
  qa.report.errors.push(String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  qa.report.checks = checks;
  qa.report.failed = checks.filter((c) => !c.passed);
  if (qa.report.failed.length) process.exitCode = 1;
  await qa.close();
}

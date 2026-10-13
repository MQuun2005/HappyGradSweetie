// Review the user-supplied cutout without modifying it or application code.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const portraitPath = 'public/Image/hero/mai-khue-cutout.png';
const sourcePath = 'public/Image/original/1.jpg';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const portrait = await readFile(resolve(root, portraitPath));
const source = await readFile(resolve(root, sourcePath));
const hash = sha(portrait);
const output = resolve(root, `qa/plan1/portrait-user-2026-10-11-${hash.slice(0,8)}`);
const metadata = await sharp(portrait).metadata();
if (!metadata.hasAlpha) throw new Error('No alpha channel in supplied PNG');
await mkdir(output, { recursive: true });
async function save(name, bytes) {
  const path = resolve(output, name);
  try { await writeFile(path, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || !Buffer.from(bytes).equals(await readFile(path))) throw error;
  }
}
const { data, info } = await sharp(portrait).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alpha = { zero: 0, partial: 0, opaque: 0, min: 255, max: 0 };
for (let i=3; i<data.length; i+=info.channels) {
  const a = data[i]; alpha.min = Math.min(alpha.min, a); alpha.max = Math.max(alpha.max, a);
  if (!a) alpha.zero++; else if (a===255) alpha.opaque++; else alpha.partial++;
}
const colors = { ivory: '#FFF9F3', blush: '#EAB8BE', lavender: '#E7E0F1', navy: '#27324B' };
const panels = [];
for (const [i,[name,background]] of Object.entries(colors).entries()) {
  const png = await sharp(portrait).flatten({ background }).png().toBuffer();
  await save(`${name}.png`, png);
  panels.push({ input: await sharp(png).resize({ width: 256 }).png().toBuffer(), left: i*256, top: 0 });
}
const height = Math.round(metadata.height * 256 / metadata.width);
await save('four-backgrounds.png', await sharp({create:{width:1024,height,channels:3,background:colors.ivory}}).composite(panels).png().toBuffer());
// Encoding variants are review-only until the user approves this supplied master.
// No synthesis, alpha redrawing, cropping or source-RGB replacement is performed.
const variants = [];
let fullWebp;
for (const width of [...new Set([480,768,metadata.width].filter(w=>w<=metadata.width))]) {
  const name = width===metadata.width ? 'mai-khue-cutout.webp' : `mai-khue-cutout-${width}.webp`;
  const bytes = await sharp(portrait).resize({width,withoutEnlargement:true}).webp({quality:92,alphaQuality:100,effort:6}).toBuffer();
  await save(name,bytes);
  const m = await sharp(bytes).metadata();
  variants.push({name,width:m.width,height:m.height,bytes:bytes.length,sha256:sha(bytes)});
  if (width===metadata.width) fullWebp = bytes;
}
const decodedWebp = await sharp(fullWebp).ensureAlpha().raw().toBuffer();
let alphaDifferentPixels=0;
for (let i=3;i<data.length;i+=4) if(data[i]!==decodedWebp[i]) alphaDifferentPixels++;
const webpPanels=[];
for (const [i,[name,background]] of Object.entries(colors).entries()) {
  const bytes=await sharp(fullWebp).flatten({background}).png().toBuffer();
  await save(`webp-${name}.png`,bytes);
  webpPanels.push({input:await sharp(bytes).resize({width:256}).png().toBuffer(),left:i*256,top:0});
}
await save('webp-four-backgrounds.png',await sharp({create:{width:1024,height,channels:3,background:colors.ivory}}).composite(webpPanels).png().toBuffer());
// Plain asset framing, not application/browser visual QA. Always contain, no crop.
for (const [name,box] of Object.entries({
  desktop:{width:760,height:780,portraitWidth:480,portraitHeight:720},
  iphone:{width:393,height:600,portraitWidth:329,portraitHeight:520},
  'ipad-portrait':{width:580,height:820,portraitWidth:500,portraitHeight:750},
  'ipad-landscape':{width:620,height:620,portraitWidth:372,portraitHeight:558},
})) {
  const bytes=await sharp(fullWebp).resize({width:box.portraitWidth,height:box.portraitHeight,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const m=await sharp(bytes).metadata();
  await save(`framing-${name}.png`,await sharp({create:{width:box.width,height:box.height,channels:3,background:colors.ivory}}).composite([{input:bytes,left:Math.floor((box.width-m.width)/2),top:Math.floor((box.height-m.height)/2)}]).png().toBuffer());
}
await save('webp-review.json',JSON.stringify({variants,fullSizeAlphaDifferentPixels:alphaDifferentPixels,noUpscaling:true,noPixelSynthesis:true,outputScope:'QA_ONLY_PENDING_PORTRAIT_APPROVAL',framingEvidence:'Sharp asset compositions, not browser or device screenshots'},null,2)+'\n');
const sourcePanel = await sharp(source).resize(400,600,{fit:'contain',background:colors.ivory}).png().toBuffer();
const portraitPanel = await sharp(portrait).flatten({background:colors.ivory}).resize(400,600,{fit:'contain',background:colors.ivory}).png().toBuffer();
await save('source-and-supplied.png', await sharp({create:{width:800,height:600,channels:3,background:colors.ivory}}).composite([{input:sourcePanel,left:0,top:0},{input:portraitPanel,left:400,top:0}]).png().toBuffer());
// These detail regions refer to the actual 1024x1536 PNG, not guessed source alignment.
if (metadata.width===1024 && metadata.height===1536) {
  for (const [name,region] of Object.entries({
    'tassel-edge':{left:95,top:380,width:240,height:470},
    'hand-lower-edge':{left:525,top:1230,width:490,height:305},
  })) {
    const detail = await sharp(portrait).flatten({background:colors.ivory}).extract(region).resize(region.width*2,region.height*2,{kernel:'nearest'}).png().toBuffer();
    await save(`${name}-200-percent.png`,detail);
  }
}
const baseline = JSON.parse(await readFile(resolve(root,'qa/plan1/baseline-2026-10-11/baseline.json'),'utf8'));
const changed = [];
for (const asset of baseline.assets) {
  if (sha(await readFile(resolve(root,asset.path)))!==asset.sha256) changed.push(asset.path);
}
const report = {
  status:'PENDING_VISUAL_VERDICT_AND_USER_DECISION',
  supplied:{path:portraitPath,width:metadata.width,height:metadata.height,bytes:portrait.length,sha256:hash},
  source:{path:sourcePath,sha256:sha(source)},alpha,
  baselineAssetsChecked:baseline.assets.length,changedBaselineAssets:changed,
  inputPreserved:sha(await readFile(resolve(root,portraitPath)))===hash,
  appSourceModified:false,
  note:'Previews only: no upscale of a production master, no RGB reconstruction, no new generation or upload.',
};
await save('inspection.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,...report},null,2));

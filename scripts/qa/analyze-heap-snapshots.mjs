// Compare actual V8 snapshots. Shallow bytes are NOT retained/dominator sizes.
// This diagnoses a local QA session, never uploads a heap or rewrites a capture.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=process.cwd(),[beforeFile,afterFile,outputFile]=process.argv.slice(2);
if(!beforeFile||!afterFile||!outputFile)throw Error('Pass before.heapsnapshot after.heapsnapshot NEW-report.json');
for(const f of [beforeFile,afterFile,outputFile])if(!path.resolve(root,f).startsWith(path.resolve(root,'qa')+path.sep))throw Error('Only project qa paths');
const read=async file=>{const bytes=await readFile(file);return{file,sha256:createHash('sha256').update(bytes).digest('hex'),data:JSON.parse(bytes)}};
const [before,after]=await Promise.all([read(beforeFile),read(afterFile)]);
function index(snapshot){
 const {nodes,edges,strings,snapshot:{meta}}=snapshot;
 const stride=meta.node_fields.length,field=n=>meta.node_fields.indexOf(n),types=meta.node_types[field('type')];
 const es=meta.edge_fields.length,ef=n=>meta.edge_fields.indexOf(n),edgeTypes=meta.edge_types[ef('type')];
 const list=[],ids=new Map(),groups=new Map(),byType=new Map();let edge=0;
 for(let offset=0;offset<nodes.length;offset+=stride){
  const type=types[nodes[offset+field('type')]],name=strings[nodes[offset+field('name')]],id=nodes[offset+field('id')],size=nodes[offset+field('self_size')],count=nodes[offset+field('edge_count')];
  const record={index:list.length,offset,id,type,name,size,edge,count,detached:field('detachedness')<0?0:nodes[offset+field('detachedness')]};
  list.push(record);ids.set(id,record);edge+=count*es;
  for(const [map,key]of [[groups,type+' / '+name],[byType,type]]){const entry=map.get(key)??{count:0,shallowBytes:0};entry.count++;entry.shallowBytes+=size;map.set(key,entry)}
 }
 return{list,ids,groups,byType,nodes,edges,strings,stride,es,ef,edgeTypes};
}
const a=index(before.data),b=index(after.data);
function diffMaps(left,right){return[...new Set([...left.keys(),...right.keys()])].map(key=>{
 const before=left.get(key)??{count:0,shallowBytes:0},after=right.get(key)??{count:0,shallowBytes:0};
 return{key:key.slice(0,220),before,after,countDelta:after.count-before.count,shallowBytesDelta:after.shallowBytes-before.shallowBytes};
}).sort((x,y)=>y.shallowBytesDelta-x.shallowBytesDelta)}
const added=b.list.filter(n=>!a.ids.has(n.id)),removed=a.list.filter(n=>!b.ids.has(n.id));
// Strong incoming edges for a few concrete paths; no claim of full retained-size analysis.
const incoming=Array.from({length:b.list.length},()=>[]);
for(const source of b.list)for(let i=source.edge;i<source.edge+source.count*b.es;i+=b.es){
 const type=b.edgeTypes[b.edges[i+b.ef('type')]];if(type==='weak')continue;
 const target=b.edges[i+b.ef('to_node')]/b.stride,labelIndex=b.edges[i+b.ef('name_or_index')];
 incoming[target].push({source:source.index,type,label:type==='element'||type==='hidden'?String(labelIndex):b.strings[labelIndex]});
}
const brief=n=>({id:n.id,type:n.type,name:n.name.slice(0,160),shallowBytes:n.size});
function retainingPath(node){
 const queue=[node.index],seen=new Set(queue),next=new Map();let rootIndex;
 for(let cursor=0;cursor<queue.length&&cursor<100000;cursor++){
  const current=queue[cursor];if(current===0){rootIndex=current;break}
  for(const edge of incoming[current])if(!seen.has(edge.source)){seen.add(edge.source);next.set(edge.source,{target:current,...edge});queue.push(edge.source)}
 }
 if(rootIndex===undefined)return{found:false,visited:seen.size};
 const result=[];for(let current=rootIndex;current!==node.index;){const edge=next.get(current);result.push({node:brief(b.list[current]),edge:edge.label,edgeType:edge.type});current=edge.target}result.push({node:brief(node)});return{found:true,path:result};
}
const topGroups=diffMaps(a.groups,b.groups).filter(g=>g.shallowBytesDelta>0).slice(0,35);
const pathTargets=added.filter(n=>['object','closure','array','code'].includes(n.type)).sort((x,y)=>y.size-x.size).slice(0,8);
// Sample browser-native growth separately from compiled code. One root path is
// evidence of a retainer, not proof that it is the object's only retaining path.
for(const name of ['DOMRectReadOnly','LayoutShift','LayoutShiftAttribution','PerformanceResourceTiming','LargestContentfulPaint','blink::NetworkResourcesData::ResourceData']){
 const node=added.find(n=>n.type==='native'&&n.name===name);if(node)pathTargets.push(node);
}
const report={before:{file:before.file,sha256:before.sha256},after:{file:after.file,sha256:after.sha256},
 method:'V8 node type/name shallow-size comparison, stable object IDs and selected strong paths to root. Not total retained-size/dominator analysis; snapshots/DevTools can influence memory.',
 totals:{beforeNodes:a.list.length,afterNodes:b.list.length,beforeShallow:a.list.reduce((s,n)=>s+n.size,0),afterShallow:b.list.reduce((s,n)=>s+n.size,0),added:added.length,removed:removed.length},
 byType:diffMaps(a.byType,b.byType),topGrowingGroups:topGroups,
 newObjects:added.filter(n=>n.type==='object').map(brief),
 detached:{before:a.list.filter(n=>n.detached===2).map(brief),after:b.list.filter(n=>n.detached===2).map(brief)},
 selectedPaths:pathTargets.map(n=>({node:brief(n),...retainingPath(n)}))};
await writeFile(outputFile,JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({totals:report.totals,byType:report.byType,topGrowingGroups:report.topGrowingGroups.slice(0,15),detached:{before:report.detached.before.length,after:report.detached.after.length}},null,2));

import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

const viewport=document.querySelector('#graph-viewport');
const message=document.querySelector('#graph-message');
const section=document.querySelector('#ability-graph');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const COLORS={research:0x8bc8d7,engineering:0xf2bc51,algorithms:0xc0afe8,person:0xffd77e};
const NODES=[
 {id:'sciencedb',name:'ScienceDB 数据',type:'科研数据成果',group:'research',p:[-33,25,24],description:'以第一作者在 Science Data Bank 发布滑坡监测数据与方法复现材料（V1，2026.10.14）。成果介绍附公开 DOI。',anchor:'research-data'},
 {id:'threejs',name:'Three.js',type:'技术',group:'engineering',p:[34,9,24],description:'开发星图个人经历三维技术图谱，关联简历经历、技术节点与原文证据，支持选择、筛选、旋转与缩放。',anchor:'project-xingtu'},
 {id:'person',name:'王佳豪',type:'个人',group:'person',p:[0,0,0],description:'河南工业大学计算机科学与技术本科生，开展跨被试脑电研究，参与算法与软件工程项目。',anchor:'summary'},
 {id:'eeg',name:'脑电研究',type:'研究项目',group:'research',p:[-22,14,6],description:'围绕跨被试脑电情感识别开展研究，使用 PyTorch、Mamba／状态空间模型与图结构时空建模技术。',anchor:'project-eeg'},
 {id:'aic',name:'多模态检测',type:'竞赛项目',group:'research',p:[-19,-13,-13],description:'城市场景视觉多模态目标检测，涉及 PyTorch、YOLO 与多模态融合，获 AIC 省赛三等奖。',anchor:'project-aic'},
 {id:'xingtu',name:'星图',type:'团队项目',group:'engineering',p:[22,13,-5],description:'负责个人中心、简历与企业信息模块和个人经历三维技术图谱开发，参与实验复核及部署迁移；比赛已结束。',anchor:'project-xingtu'},
 {id:'secops',name:'Sentinel',type:'个人项目',group:'engineering',p:[-28,-20,13],description:'本地安全研判与防御工具原型，包含公开情报、证据报告、主机基线与告警管理；仍在持续完善。',anchor:'project-secops'},
 {id:'quantum',name:'量子编译',type:'算法项目',group:'algorithms',p:[13,-18,14],description:'使用 Python、Cirq 与 SABRE 进行噪声自适应量子线路布局与路由优化。',anchor:'project-quantum'},
 {id:'modeling',name:'数学建模',type:'竞赛项目',group:'algorithms',p:[2,26,-15],description:'作为队长开展水质预测评估和导电介质仿真优化，获 APMCM 二等奖、华数杯三等奖。',anchor:'project-modeling'},
 {id:'pytorch',name:'PyTorch',type:'技术',group:'research',p:[-34,3,14],description:'用于模型训练、推理与实验评估；关联脑电研究与多模态检测经历。',anchor:'skills'},
 {id:'mamba',name:'Mamba / SSM',type:'技术',group:'research',p:[-18,27,-13],description:'状态空间模型相关研究实践，应用于脑电时空特征建模。',anchor:'project-eeg'},
 {id:'yolo',name:'YOLO',type:'技术',group:'research',p:[-5,-31,-15],description:'城市场景视觉多模态目标检测项目中的目标检测技术。',anchor:'project-aic'},
 {id:'react',name:'React / TS',type:'技术',group:'engineering',p:[34,-2,8],description:'用于星图业务界面、个人中心与简历相关前端开发。',anchor:'project-xingtu'},
 {id:'fastapi',name:'FastAPI',type:'技术',group:'engineering',p:[20,25,15],description:'星图后端接口与数据访问相关开发实践。',anchor:'project-xingtu'},
 {id:'databases',name:'MySQL / Neo4j',type:'技术',group:'engineering',p:[25,-17,-20],description:'具有 MySQL、MongoDB 与 Neo4j 使用、容器化部署和数据迁移核验经验。',anchor:'project-xingtu'},
 {id:'docker',name:'Docker / SSH',type:'技术',group:'engineering',p:[8,-7,-34],description:'完成六容器部署、备份配置与团队自动 SSH 连接工具。',anchor:'project-xingtu'},
 {id:'python',name:'Python',type:'技术',group:'algorithms',p:[-5,7,34],description:'用于数据处理、科研实验、数学建模和算法评测。',anchor:'skills'},
 {id:'sabre',name:'Cirq / SABRE',type:'技术',group:'algorithms',p:[6,-30,6],description:'用于量子线路映射、路由优化与公开题评测。',anchor:'project-quantum'},
 {id:'analysis',name:'时序与仿真',type:'技术',group:'algorithms',p:[1,33,5],description:'用于水质预测评估和导电介质仿真优化等数学建模工作。',anchor:'project-modeling'},
];
const EDGES=[['person','sciencedb'],['xingtu','threejs'],['person','secops'],['secops','python'],['secops','fastapi'],['person','eeg'],['person','aic'],['person','xingtu'],['person','quantum'],['person','modeling'],['eeg','pytorch'],['eeg','mamba'],['eeg','python'],['aic','pytorch'],['aic','yolo'],['xingtu','react'],['xingtu','fastapi'],['xingtu','databases'],['xingtu','docker'],['quantum','python'],['quantum','sabre'],['modeling','python'],['modeling','analysis']];
const byId=new Map(NODES.map(n=>[n.id,n]));
let selected=null,filter='all',paused=reduced.matches,inView=false,raf=0,last=0,draws=0;
const pauseButton=document.querySelector('#graph-pause');
const setPauseLabel=()=>{pauseButton.textContent=paused?'播放旋转':'暂停旋转';pauseButton.setAttribute('aria-pressed',String(paused));};
setPauseLabel();
function select(id){
 selected=id==='person'?null:id;const n=byId.get(id)||NODES[0];
 document.querySelector('#node-name').textContent=n.name;
 document.querySelector('#node-type').textContent=n.type;
 document.querySelector('#node-description').textContent=n.description;
 const a=document.querySelector('#node-link');a.href='#'+n.anchor;a.textContent=n.type==='技术'?'查看相关技术与经历':'查看对应经历';
 viewport.dataset.selected=n.id;
 updateVisibility();render();
}
let renderer,scene,camera,controls;
const objects=new Map(),edges=[],labels=new Map(),leaders=new Map();
const labelLayer=document.createElement('div');labelLayer.className='graph-labels';viewport.appendChild(labelLayer);
const leaderLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');leaderLayer.classList.add('graph-leaders');viewport.insertBefore(leaderLayer,labelLayer);
function placeLabels(){
 const w=viewport.clientWidth,h=viewport.clientHeight,rects=[];
 const ordered=[...NODES].sort((a,b)=>(a.type==='技术'?2:a.id==='person'?0:1)-(b.type==='技术'?2:b.id==='person'?0:1));
 for(const n of ordered){
  const o=objects.get(n.id),button=labels.get(n.id);if(!o||!button)continue;
  button.hidden=!o.visible;const leader=leaders.get(n.id);leader.style.display=o.visible?'':'none';if(!o.visible)continue;
  const p=o.position.clone().project(camera),bw=button.offsetWidth,bh=button.offsetHeight;
  const px=(p.x*.5+.5)*w,py=(-p.y*.5+.5)*h;
  let best=null;
  for(const dy of [18,-32,42,-56,66,-80,90,-104,114,-128,138,-152])for(const dx of [0,-40,40,-80,80,-120,120]){
   const x=Math.max(7,Math.min(w-bw-7,px-bw/2+dx)),y=Math.max(7,Math.min(h-bh-7,py+dy));
   const overlaps=rects.reduce((sum,r)=>sum+Math.max(0,Math.min(x+bw+4,r.x+r.w)-Math.max(x-4,r.x))*Math.max(0,Math.min(y+bh+3,r.y+r.h)-Math.max(y-3,r.y)),0);
   const score=overlaps*100+Math.abs(dy-18)+Math.abs(dx)*.2;
   if(!best||score<best.score)best={x,y,w:bw,h:bh,score};
  }
  button.style.transform=`translate(${best.x}px,${best.y}px)`;button.classList.toggle('selected',selected===n.id);rects.push(best);
  leader.setAttribute('x1',String(px));leader.setAttribute('y1',String(py));leader.setAttribute('x2',String(best.x+bw/2));leader.setAttribute('y2',String(best.y+bh/2));
 }
 viewport.dataset.visibleLabels=String(rects.length);
}
function render(){if(renderer){renderer.render(scene,camera);placeLabels();draws++;viewport.dataset.frames=String(draws)}}
function updateVisibility(){
 const connected=new Set([selected]);
 if(selected)EDGES.forEach(([a,b])=>{if(a===selected)connected.add(b);if(b===selected)connected.add(a)});
 objects.forEach((o,id)=>{const n=byId.get(id);o.visible=filter==='all'||n.group===filter||id==='person';const lit=!selected||connected.has(id);o.children.forEach(c=>{if(c.material&&c.material.opacity!==undefined)c.material.opacity=lit?1:.55});});
 edges.forEach(e=>{e.line.visible=objects.get(e.a).visible&&objects.get(e.b).visible;e.line.material.opacity=selected?((e.a===selected||e.b===selected)? .85:.12):.42;});
}
function label(text,color){
 const cv=document.createElement('canvas');cv.width=768;cv.height=128;
 const ctx=cv.getContext('2d');ctx.font='500 44px Microsoft YaHei, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e6edf3';ctx.fillText(text,384,64);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
 const sprite=new THREE.Sprite(mat);sprite.scale.set(22,3.7,1);return sprite;
}
function start(){
 if(raf||paused||!inView||document.hidden)return;
 const tick=t=>{raf=0;if(paused||!inView||document.hidden)return;if(t-last>33){controls.update((t-last)/1000);last=t;render();}raf=requestAnimationFrame(tick)};
 last=performance.now();raf=requestAnimationFrame(tick);
}
function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','项目与技术三维图谱，可拖动旋转，使用上方按钮缩放和暂停');
 viewport.appendChild(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(46,1,1,500);camera.position.set(7,16,96);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.autoRotate=!paused;controls.autoRotateSpeed=.45;controls.minDistance=72;controls.maxDistance=190;controls.enablePan=false;
 scene.add(new THREE.AmbientLight(0xffffff,1.4));const light=new THREE.DirectionalLight(0xffedc0,2);light.position.set(20,30,70);scene.add(light);
 NODES.forEach(n=>{
  const group=new THREE.Group();group.position.set(...n.p);group.userData.id=n.id;
  const project=n.type!=='技术';const geometry=n.id==='person'?new THREE.BoxGeometry(6,6,6):project?new THREE.OctahedronGeometry(2.8):new THREE.SphereGeometry(1.8,22,16);
  const material=new THREE.MeshStandardMaterial({color:COLORS[n.group],roughness:.27,metalness:.25,transparent:true});
  const mesh=new THREE.Mesh(geometry,material);mesh.userData.id=n.id;group.add(mesh);
  if(project){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0xfff0c7,transparent:true,opacity:.7}));edge.scale.setScalar(1.1);group.add(edge);}
  const caption=document.createElement('button');caption.type='button';caption.className='graph-label';caption.textContent=n.name;caption.dataset.node=n.id;caption.style.setProperty('--node-color','#'+COLORS[n.group].toString(16).padStart(6,'0'));caption.onclick=()=>select(n.id);labelLayer.appendChild(caption);labels.set(n.id,caption);
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');leader.setAttribute('stroke','#'+COLORS[n.group].toString(16).padStart(6,'0'));leader.setAttribute('stroke-opacity','.4');leader.setAttribute('stroke-width','1');leaderLayer.appendChild(leader);leaders.set(n.id,leader);
  scene.add(group);objects.set(n.id,group);
 });
 EDGES.forEach(([a,b])=>{
  const pa=new THREE.Vector3(...byId.get(a).p),pb=new THREE.Vector3(...byId.get(b).p);const mid=pa.clone().lerp(pb,.5).multiplyScalar(1.08);
  const curve=new THREE.QuadraticBezierCurve3(pa,mid,pb);const geom=new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
  const color=COLORS[byId.get(b).group];const line=new THREE.Line(geom,new THREE.LineBasicMaterial({color,transparent:true,opacity:.22}));scene.add(line);edges.push({a,b,line});
 });
 // A restrained orbital guide reinforces spatial depth without random links.
 const guidePoints=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;guidePoints.push(new THREE.Vector3(Math.cos(a)*38,0,Math.sin(a)*38))}
 scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(guidePoints),new THREE.LineBasicMaterial({color:0x435c6c,transparent:true,opacity:.2})));
 const resize=()=>{const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<420?60:46;camera.updateProjectionMatrix();render()};
 const ro=new ResizeObserver(resize);ro.observe(viewport);resize();
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)start();else stop()},{threshold:.1});observer.observe(viewport);
 controls.addEventListener('change',()=>{if(paused)render()});
 let pointerStart=null;
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY]});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>6)return;const rect=renderer.domElement.getBoundingClientRect();const v=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(v,camera);const hits=ray.intersectObjects([...objects.values()].filter(o=>o.visible).flatMap(o=>o.children.filter(x=>x.isMesh)));if(hits[0])select(hits[0].object.userData.id);});
 pauseButton.onclick=()=>{paused=!paused;controls.autoRotate=!paused;setPauseLabel();paused?stop():start();render()};
 document.querySelector('#graph-reset').onclick=()=>{camera.position.set(7,16,96);controls.target.set(0,0,0);controls.update();select('person');render()};
 const zoom=f=>{const d=camera.position.clone().sub(controls.target);d.multiplyScalar(f);d.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,d.length())));camera.position.copy(controls.target).add(d);controls.update();render()};
 document.querySelector('#graph-zoom-in').onclick=()=>zoom(.85);document.querySelector('#graph-zoom-out').onclick=()=>zoom(1.18);
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 reduced.addEventListener('change',e=>{if(e.matches){paused=true;controls.autoRotate=false;stop();setPauseLabel();render()}});
 document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>select(b.dataset.select));
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;selected=null;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));viewport.dataset.filter=filter;updateVisibility();render()});
 window.addEventListener('pagehide',()=>{stop();observer.disconnect();ro.disconnect();controls.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}});renderer.dispose()},{once:true});
 message.hidden=true;viewport.dataset.ready='true';select('person');start();
}catch(error){
 message.textContent='当前设备暂无法显示三维图谱。请继续查看下方完整文字介绍。';viewport.dataset.ready='failed';
 document.querySelectorAll('.graph-controls button,.graph-filter button').forEach(b=>b.disabled=true);
 document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{const n=byId.get(b.dataset.select);document.querySelector('#node-name').textContent=n.name;document.querySelector('#node-description').textContent=n.description;document.querySelector('#node-link').href='#'+n.anchor;});
 console.warn('3D graph unavailable: '+error.name);
}

const root=document.querySelector('#growth-timeline');
if(root){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const names={learning:'起步与成长',research:'科研',engineering:'工程',competition:'竞赛',achievement:'成果'};
 let events=[],visible=[],selected='',timer=null,filter='all';
 const ui=Object.fromEntries(['toolbar','filters','play','scroller','track','detail','date','title','subtitle','description','link','count','fallback','help','previous','next'].map(k=>[k,root.querySelector(`[data-gt="${k}"]`)]));
 function stop(){clearInterval(timer);timer=null;ui.play.textContent='播放历程';ui.play.setAttribute('aria-pressed','false');}
 function select(id,{scroll=true,focus=false}={}){
  const e=visible.find(e=>e.id===id);if(!e)return;
  selected=id;
  ui.track.querySelectorAll('.gt-node').forEach(b=>{const active=b.dataset.id===id;b.setAttribute('aria-pressed',String(active));b.tabIndex=active?0:-1;});
  ui.date.textContent=`${e.date} · ${names[e.category]}`;ui.title.textContent=e.title;ui.subtitle.textContent=e.subtitle;ui.description.textContent=e.description;
  ui.link.textContent=e.linkLabel;ui.link.href=e.link;
  const button=[...ui.track.querySelectorAll('.gt-node')].find(b=>b.dataset.id===id);
  if(scroll)ui.scroller.scrollTo({left:button.offsetLeft-ui.scroller.clientWidth/2,behavior:reduced.matches?'instant':'smooth'});
  if(focus)button.focus({preventScroll:true});
 }
 function step(delta,focus=false){const index=visible.findIndex(e=>e.id===selected);select(visible[(index+delta+visible.length)%visible.length].id,{focus});}
 function render(){
  visible=events.filter(e=>filter==='all'||e.category===filter);ui.track.replaceChildren();
  const width=Math.max(visible.length*172+40,ui.scroller.clientWidth);ui.track.style.width=width+'px';
  const points=visible.map((e,i)=>({x:96+i*172,y:136+Math.sin(i*.82)*24}));
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${width} 250`);svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',points.map((p,i)=>i?`C ${points[i-1].x+75} ${points[i-1].y} ${p.x-75} ${p.y} ${p.x} ${p.y}`:`M ${p.x} ${p.y}`).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke','var(--gt-gold)');path.setAttribute('stroke-opacity','.4');path.setAttribute('stroke-width','2');svg.append(path);ui.track.append(svg);
  visible.forEach((e,i)=>{
   const b=document.createElement('button');b.type='button';b.className='gt-node';b.dataset.id=e.id;b.dataset.category=e.category;b.style.left=points[i].x+'px';b.style.top=points[i].y+'px';b.setAttribute('aria-label',`${e.date}，${e.title}，${e.subtitle}`);b.setAttribute('aria-controls','growth-detail');
   for(const [className,text] of [['gt-dot',''],['gt-node-title',e.title],['gt-node-date',e.date]]){const span=document.createElement('span');span.className=className;span.textContent=text;b.append(span);}
   b.onclick=()=>{stop();select(e.id);};
   b.onkeydown=event=>{let target=null;const index=visible.findIndex(x=>x.id===selected);if(event.key==='ArrowRight')target=(index+1)%visible.length;if(event.key==='ArrowLeft')target=(index-1+visible.length)%visible.length;if(event.key==='Home')target=0;if(event.key==='End')target=visible.length-1;if(target!==null){event.preventDefault();stop();select(visible[target].id,{focus:true});}};
   ui.track.append(b);
  });
  ui.count.textContent=filter==='all'?`${events.length} 条成长记录`:`${names[filter]} · ${visible.length} 条记录`;
  select(visible.some(e=>e.id===selected)?selected:visible.at(-1).id,{scroll:false});
  const b=ui.track.querySelector('[aria-pressed=true]');ui.scroller.scrollLeft=b.offsetLeft-ui.scroller.clientWidth/2;
 }
 async function init(){
  try{
   const response=await fetch(new URL('./timeline-data.json',import.meta.url));if(!response.ok)throw Error('Timeline data unavailable');
   const data=await response.json();events=data.events;
   if(!Array.isArray(events)||!events.length||new Set(events.map(e=>e.id)).size!==events.length)throw Error('Invalid timeline data');
   for(const e of events){if(!names[e.category]||!e.date||!e.title||!e.subtitle||!e.description||!e.linkLabel||!e.id||!e.link?.match(/^(#[a-z\d-]+|https:\/\/)/i))throw Error('Invalid timeline entry');}
   root.querySelector('.gt-header p').textContent=`${events[0].date.slice(0,7)} — ${events.at(-1).date.slice(0,7)} · 科研、工程与每一步成长`;
   for(const [value,label] of [['all','全部'],...Object.entries(names)]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.gtFilter=value;b.setAttribute('aria-pressed',String(value===filter));b.onclick=()=>{stop();filter=value;ui.filters.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();};ui.filters.append(b);}
   ui.toolbar.hidden=ui.scroller.hidden=ui.detail.hidden=ui.help.hidden=false;
   render();ui.fallback.hidden=true;root.dataset.ready='true';
   ui.play.disabled=reduced.matches;ui.play.title=reduced.matches?'已尊重系统减少动态效果设置':'';
   ui.play.onclick=()=>{if(timer){stop();return;}if(reduced.matches)return;ui.play.textContent='暂停播放';ui.play.setAttribute('aria-pressed','true');step(1);timer=setInterval(()=>step(1),5000);};
   ui.previous.onclick=()=>{stop();step(-1);};ui.next.onclick=()=>{stop();step(1);};
   let drag=null;
   ui.scroller.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;drag={x:e.clientX,scroll:ui.scroller.scrollLeft};ui.scroller.dataset.dragging='true';ui.scroller.setPointerCapture(e.pointerId);stop();});
   ui.scroller.addEventListener('pointermove',e=>{if(drag)ui.scroller.scrollLeft=drag.scroll-(e.clientX-drag.x);});
   const endDrag=()=>{drag=null;delete ui.scroller.dataset.dragging;};ui.scroller.addEventListener('pointerup',endDrag);ui.scroller.addEventListener('pointercancel',endDrag);ui.scroller.addEventListener('lostpointercapture',endDrag);
   reduced.addEventListener('change',e=>{if(e.matches)stop();ui.play.disabled=e.matches;});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop,{once:true});
  }catch(error){root.dataset.ready='failed';ui.toolbar.hidden=ui.scroller.hidden=ui.detail.hidden=ui.help.hidden=true;ui.fallback.hidden=false;console.warn('Growth timeline: '+error.message);}
 }
 init();
}

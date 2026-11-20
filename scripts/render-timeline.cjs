// Render the actual widget; run with Playwright available in Node's module path.
const {createServer}=require('node:http');
const {readFile,mkdir,writeFile}=require('node:fs/promises');
const {resolve,extname,sep}=require('node:path');
const {chromium}=require('playwright');
const root=resolve(__dirname,'..');
const output=resolve(process.env.GT_PREVIEW_DIR||resolve(root,'.timeline-preview'));
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!path.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.statusCode=404;res.end('Not found');}});
(async()=>{
 await mkdir(output,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1220,height:1100},deviceScaleFactor:1});
  const data=JSON.parse(await readFile(resolve(root,'assets/timeline-data.json'),'utf8'));
  const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list=data.events.map(e=>`<li><time>${escape(e.date)}</time>　<a href="${escape(e.link)}">${escape(e.title)}</a>：${escape(e.subtitle)}</li>`).join('');
  const indexPath=resolve(root,'index.html');
  let index=await readFile(indexPath,'utf8');
  const fallbackPattern=/<ol class="gt-fallback" data-gt="fallback">[\s\S]*?<\/ol>/g;
  if([...index.matchAll(fallbackPattern)].length!==1)throw Error('Expected one fallback list');
  index=index.replace(fallbackPattern,()=>`<ol class="gt-fallback" data-gt="fallback">${list}</ol>`);
  index=index.replace(/(<span class="gt-count" data-gt="count">)[^<]+/,(_,start)=>start+`${data.events.length} 条成长记录`);
  index=index.replace(/(<h2 id="growth-heading">成长记录<\/h2><p>)[^<]+/,(_,start)=>start+`${data.events[0].date.slice(0,7)} — ${data.events.at(-1).date.slice(0,7)} · 科研、工程与每一步成长`);
  await writeFile(indexPath,index);
  const keys=['eeg-start','lanqiao-national','huashu','sciencedb','copyright','xingtu-release','cumcm'];
  for(const theme of ['light','dark']){
   await page.emulateMedia({colorScheme:theme,reducedMotion:'no-preference'});
   await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
   await page.locator('#growth-timeline[data-ready=true]').waitFor();await page.evaluate(()=>document.fonts.ready);
   // Keep the preview height constant so GIF frames do not move the page around.
   await page.addStyleTag({content:'.gt-detail{min-height:230px!important}'});
   for(const [index,id] of keys.entries()){
    await page.locator('.gt-node[data-id="'+id+'"]').click({force:true});
    await page.waitForTimeout(450);
    await page.locator('#growth-timeline').screenshot({path:resolve(output,`${theme}-${index}.png`)});
   }
   await page.locator('#growth-timeline').screenshot({path:resolve(root,'assets',`timeline-preview-${theme}.png`)});
  }
  await writeFile(resolve(output,'manifest.json'),JSON.stringify({frames:keys.length,ids:keys,eventCount:data.events.length},null,2));
  console.log(output);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

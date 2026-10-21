const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.FT_PLAYWRIGHT || 'playwright');
const names = ['IDD', ...Array.from({length:29}, (_,i)=>`OS_TEST_${i+1}_LONG_PARAMETER_NAME`)];
const header = ['Test Name,,,,'+names.join(','),'Test Number,,,,'+names.map((_,i)=>i+2).join(','),'Lower Limit,,,,'+names.map(()=>20).join(','),'Upper Limit,,,,'+names.map(()=>60).join(','),'Units,,,,'+names.map(()=>'uA').join(','),'Site #,Serial #,SBin,HBin,'+names.join(',')].join('\n');
const csv = offset => header+'\n'+Array.from({length:6000},(_,i)=>{
  const fail=i%10===0, k=Math.floor(i/10)%names.length;
  return `1,${i+1+offset},${fail?(k+2)+',3':'1,1'},`+names.map((_,j)=>fail&&j===k?'75':(40+Math.sin(i+j)*2).toFixed(4)).join(',');
}).join('\n');
const targets = process.env.FT_RESOLUTION_MATRIX ? [
  {width:1920,height:1080,dpr:1}, {width:1536,height:864,dpr:1.25},
  {width:2560,height:1440,dpr:1}, {width:2048,height:1152,dpr:1.25},
  {width:3840,height:2160,dpr:1}, {width:2560,height:1440,dpr:1.5},
  {width:1920,height:1080,dpr:2},
] : [
  {width:1920,height:1080,dpr:1}, {width:1536,height:864,dpr:1.25},
  {width:1536,height:760,dpr:1.25}, {width:1366,height:768,dpr:1},
];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const measurements=[];fs.mkdirSync(path.resolve(__dirname,'../outputs'),{recursive:true});
 try {
  for (const target of targets) {
   const {width,height,dpr}=target;const label=`${width}x${height}-dpr${dpr}`;
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
   await page.locator('#fileInput').setInputFiles([0,6000].map((offset,i)=>({name:`acceptance_${i+1}_FT.csv`,mimeType:'text/csv',buffer:Buffer.from(csv(offset))})));
   await page.locator('#workspace').waitFor({state:'visible'});await page.locator('[data-mode="professional"]').click();await page.locator('[data-tab="distribution"]').click();
   const settle=()=>page.evaluate(()=>document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
   await settle();
   const chrome=async()=>{
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow '+label);
    const selectors=['#compactImportZone','#addFilesButton','#exportButton','#clearButton','#themeToggle','#fileFilter','#analysisMode'];
    const boxes=[];
    for(const sel of selectors){const b=await page.locator(sel).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height,'accessible control '+sel+' '+label);boxes.push({sel,...b});}
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)<1||Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)<1,'overlapping controls '+a.sel+' '+b.sel+' '+label);}
   };
   await chrome();assert.equal(await page.locator('#distributionCharts').getAttribute('data-chart-mode'),'trend');await page.locator('button[data-chart-mode="both"]').click();await settle();
   const before=await page.locator('#distributionStats').innerText();
   const canvasRects=[];
   for(const id of ['failSequenceChart','failHistogramChart']){
    const b=await page.locator('#'+id).boundingBox();assert.ok(b.height>=240&&b.width>=450);assert.ok(b.height>=240,'chart remains usable with inline statistics '+label+' '+id);
    assert.equal(await page.locator('#'+id).evaluate(e=>Math.abs(e.width-Math.round(e.getBoundingClientRect().width*Math.min(devicePixelRatio,2)))<=1),true);
    canvasRects.push({id,...b});
   }
   const kpis=await page.locator('#distributionStats .mini-metric').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,clipped:e.scrollWidth>e.clientWidth})));
   assert.equal(kpis.length,2);assert.equal(new Set(kpis.map(k=>Math.round(k.top))).size,1);assert.ok(kpis.every(k=>k.bottom<=height&&!k.clipped));
   await page.evaluate(()=>{window.acceptanceKpi=document.querySelector('#distributionStats .mini-metric');window.acceptanceCalls=0;const fn=FTCore.analyze;FTCore.analyze=(...args)=>{window.acceptanceCalls++;return fn(...args)}});
   // A populated sidebar must scroll independently of the charts and the document.
   const rightTop=await page.locator('.distribution-chart-column').evaluate(e=>e.scrollTop);
   await page.locator('#distributionSidebar').hover();await page.mouse.wheel(0,600);await settle();
   assert.ok(await page.locator('#distributionSidebar').evaluate(e=>e.scrollHeight<=e.clientHeight || e.scrollTop>0));assert.equal(await page.locator('.distribution-chart-column').evaluate(e=>e.scrollTop),rightTop);
   await page.locator('#distributionSidebar').evaluate(e=>e.scrollTop=0);
   await page.locator('#sidebarToggle').click();await settle();assert.equal(Math.round((await page.locator('#distributionSidebar').boundingBox()).width),44);assert.equal(await page.locator('#distributionStats').innerText(),before);await page.locator('#sidebarToggle').click();await settle();
   await settle();
   await page.locator('.distribution-chart-column').hover();await page.mouse.wheel(0,700);await settle();
   assert.equal(await page.locator('#distributionSidebar').evaluate(e=>e.scrollTop),0);await page.locator('.distribution-chart-column').evaluate(e=>e.scrollTop=0);await settle();
   await page.screenshot({path:path.resolve(__dirname,`../outputs/acceptance-${label}.png`)});
   assert.equal(await page.locator('#limitSimulationPanel').isVisible(),true);
   assert.equal(await page.locator('#simulationDrawer').count(),0);
   await page.locator('#simulatedUpperInput').fill('80');assert.equal(await page.locator('#simulatedUpperInput').inputValue(),'80');await page.locator('#resetLimitsButton').click();
   assert.equal(await page.evaluate(()=>window.acceptanceKpi===document.querySelector('#distributionStats .mini-metric')),true);
   for(const tab of ['overview','distribution','stability','details','files','audit','release']){
    await page.locator(`[data-tab="${tab}"]`).click();await settle();await page.evaluate(()=>scrollTo(0,0));await chrome();
    assert.equal(await page.locator('#'+tab+'Panel').isVisible(),true);
    if(tab==='overview'){
     assert.equal(await page.locator('#summaryCards .summary-card').count(),8);
     assert.match(await page.locator('#summaryCards').innerText(),/12,000/);
    }
    if(tab==='stability'){
     assert.equal(await page.locator('#stabilityTableBody tr').count(),30);
     await page.locator('#stabilitySearch').fill('IDD');assert.equal(await page.locator('#stabilityTableBody tr').count(),1);await page.locator('#stabilitySearch').fill('');
     await page.locator('#testItemSelect').selectOption({label:'IDD'});await settle();assert.ok(await page.locator('#parameterChart').evaluate(e=>e.width>0));
    }
    if(tab==='details'){
     await page.locator('#failReasonFilter').selectOption('IDD');await settle();
     assert.ok(await page.locator('#detailTableBody tr').count()>0);assert.match(await page.locator('#detailTableBody').innerText(),/IDD/);
     await page.locator('#failReasonFilter').selectOption('all');
    }
    if(tab==='audit')assert.ok((await page.locator('#dataAuditMetrics').innerText()).length>0);
    if(tab==='release')assert.equal(await page.locator('#releaseLog .is-current .release-version').innerText(),'v1.88');
    if(process.env.FT_RESOLUTION_MATRIX){
     await page.screenshot({path:path.resolve(__dirname,`../outputs/matrix-${label}-${tab}.png`)});
     await page.locator('#themeToggle').click();await settle();await chrome();
     await page.screenshot({path:path.resolve(__dirname,`../outputs/matrix-${label}-${tab}-dark.png`)});
     await page.locator('#themeToggle').click();await settle();
    }
   }
   assert.equal(await page.evaluate(()=>window.acceptanceCalls),0);
   // File comparison keeps both imported files; clicking a file still selects its analysis scope.
   await page.locator('[data-tab="files"]').click();assert.equal(await page.locator('#fileTableBody tr').count(),2);
   assert.ok(await page.locator('#fileYieldChart').evaluate(e=>e.width>0&&e.height>0));
   const fileId=await page.locator('#fileTableBody tr').first().getAttribute('data-analysis-file-id');
   await page.locator('#fileTableBody tr').first().click();await settle();assert.equal(await page.locator('#fileFilter').inputValue(),fileId);assert.match(await page.locator('#distributionStats').innerText(),/6,000/);
   await page.locator('#fileFilter').selectOption('all');await settle();assert.equal(await page.locator('#distributionStats').innerText(),before);
   const professionalDownload=page.waitForEvent('download');await page.locator('#exportButton').click();
   const professionalReport=fs.readFileSync(await(await professionalDownload).path(),'utf8');
   assert.match(professionalReport,/Fail 项汇总/);assert.match(professionalReport,/参数稳定性/);
   assert.match(professionalReport,/12,?000/);assert.doesNotMatch(professionalReport,/(?:^|\r?\n)Fail 明细(?:\r?\n|$)/);
   assert.doesNotMatch(professionalReport,/空封特征 OS 项数|文件名时间,Serial/);
   await page.locator('[data-mode="simple"]').click();await settle();await page.evaluate(()=>scrollTo(0,0));await chrome();assert.equal(await page.locator('#overviewPanel').isVisible(),true);
   const download=page.waitForEvent('download');await page.locator('#exportButton').click();const report=fs.readFileSync(await(await download).path(),'utf8');assert.match(report,/12,?000/);
   await page.locator('[data-mode="professional"]').click();await page.locator('[data-tab="distribution"]').click();await settle();
   // Sweep the CSS breakpoints as well as the requested laptop widths.
   if(width===1366)for(const w of [1280,1024,980,800,780,761,760,600,390]){await page.setViewportSize({width:w,height:768});await settle();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'breakpoint overflow '+w);}
   assert.deepEqual(errors,[],'console/network errors '+label);measurements.push({viewport:target,canvasRects,kpiRows:1,consoleErrors:errors.length,result:'PASS'});
   await context.close();
  }
  fs.writeFileSync(path.resolve(__dirname,process.env.FT_RESOLUTION_MATRIX?'../outputs/resolution-matrix.json':'../outputs/ui-acceptance.json'),JSON.stringify(measurements,null,2));
  console.log('PASS: 1080P/DPR1.25 laptop inline statistics and dual charts, non-overlapping complete controls, seven tabs/two modes, scrolling/sidebar state, inline simulation, file comparison/scope, export and CSS breakpoints; no console/network errors. Measurements: outputs/ui-acceptance.json');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

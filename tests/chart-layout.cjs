const assert=require('node:assert/strict');
const {chromium}=require(process.env.FT_PLAYWRIGHT||'playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1536,height:864}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
const header=['Test Name,,,,Voltage','Test Number,,,,2','Lower Limit,,,,0','Upper Limit,,,,10','Units,,,,V','Site #,Serial #,SBin,HBin,Voltage'].join('\n');
const csv=header+'\n'+Array.from({length:3000},(_,i)=>`1,${i+1},${i%100?'1,1,'+(5+Math.sin(i)*.1):'2,3,15'}`).join('\n');
await page.locator('#fileInput').setInputFiles({name:'chart_FT.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await page.locator('#workspace').waitFor({state:'visible'});await page.locator('[data-mode="professional"]').click();await page.locator('[data-tab="distribution"]').click();
const mode=async(expected)=>{await page.waitForFunction(value=>document.querySelector('#distributionCharts').dataset.chartMode===value,expected,{timeout:5000}).catch(async()=>{throw Error('Expected '+expected+' '+JSON.stringify(await page.evaluate(()=>({mode:document.querySelector('#distributionCharts').dataset.chartMode,width:document.querySelector('#distributionCharts').clientWidth,sidebar:document.querySelector('#distributionSidebar').getBoundingClientRect().width,viewport:innerWidth}))))});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
await mode('trend');
assert.equal(await page.locator('#failHistogramChart').isVisible(),false);
assert.equal(await page.locator('button[data-chart-mode="trend"]').getAttribute('aria-pressed'),'true');
// Scrolling must neither resize nor repaint the chart, including a resize while scrolled.
await page.setViewportSize({width:1536,height:650});
await page.waitForTimeout(300);
await page.evaluate(()=>{
 window.scrollChartPaints=0;
 const clear=CanvasRenderingContext2D.prototype.clearRect;
 CanvasRenderingContext2D.prototype.clearRect=function(...args){
  if(this.canvas.id==='failSequenceChart')window.scrollChartPaints++;
  return clear.apply(this,args);
 };
});
const chartSize=()=>page.locator('#failSequenceChart').evaluate(e=>({
 width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,pixels:e.height,
 pane:document.querySelector('.distribution-chart-column').clientHeight
}));
const stableSize=await chartSize();
assert.ok(stableSize.height>=250);
await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
await page.waitForTimeout(150);
assert.ok(await page.evaluate(()=>scrollY)>0,'exercise real document scrolling');
assert.deepEqual(await chartSize(),stableSize);
await page.locator('.distribution-chart-column').evaluate(e=>e.scrollTop=e.scrollHeight);
await page.waitForTimeout(150);
assert.equal(await page.locator('.distribution-chart-column').evaluate(e=>getComputedStyle(e).overflowY),'auto');
assert.deepEqual(await chartSize(),stableSize);
assert.equal(await page.evaluate(()=>window.scrollChartPaints),0,'scrolling must not redraw Canvas');
await page.setViewportSize({width:1536,height:900});
await page.waitForTimeout(300);
const scrolledResize=await chartSize();
await page.evaluate(()=>{scrollTo(0,0);document.querySelector('.distribution-chart-column').scrollTop=0;});
await page.setViewportSize({width:1536,height:864});await page.waitForTimeout(300);
await page.setViewportSize({width:1536,height:900});await page.waitForTimeout(300);
assert.deepEqual(await chartSize(),scrolledResize,'resize independent of page scroll position');
await page.setViewportSize({width:1536,height:864});await page.waitForTimeout(300);
await page.locator('button[data-chart-mode="both"]').click();await mode('both');
const originalStats=await page.locator('#distributionStats').innerText();const originalTitle=await page.locator('#distributionTitle').innerText();
await page.evaluate(()=>{window.originalCanvas=document.querySelector('#failSequenceChart');window.originalHistogram=document.querySelector('#failHistogramChart');window.originalKpi=document.querySelector('#distributionStats .mini-metric');window.chartAnalysisCalls=0;for(const key of ['analyze','parameterDistribution']){const fn=FTCore[key];FTCore[key]=(...args)=>{window.chartAnalysisCalls++;return fn(...args);};}});
for(const [width,height] of [[1920,1080],[1536,864],[1366,768]]){
 await page.setViewportSize({width,height});await mode('both');
 const a=await page.locator('#sequenceChartPanel').boundingBox(),b=await page.locator('#histogramChartPanel').boundingBox();
 assert.ok(Math.abs(a.y-b.y)<1);assert.ok(b.x>=a.x+a.width);assert.ok(a.width>=490&&b.width>=490);assert.ok(Math.abs(a.width-b.width)<2);
 for(const id of ['failSequenceChart','failHistogramChart']){const canvas=await page.locator('#'+id).boundingBox();assert.ok(canvas.height>=240);assert.ok(canvas.height>=250);if(width>=1536)assert.ok(canvas.y+canvas.height<=height,'complete chart in first viewport at '+width);assert.ok(canvas.y+canvas.height<=(await page.locator(id==='failSequenceChart'?'#sequenceChartPanel':'#histogramChartPanel').boundingBox()).y+(await page.locator(id==='failSequenceChart'?'#sequenceChartPanel':'#histogramChartPanel').boundingBox()).height);const backing=await page.locator('#'+id).evaluate(e=>({pixels:e.width,width:e.getBoundingClientRect().width,dpr:Math.min(devicePixelRatio,2)}));assert.ok(Math.abs(backing.pixels-Math.round(backing.width*backing.dpr))<=1);}
}
await page.setViewportSize({width:1536,height:864});
await page.locator('button[data-chart-mode="trend"]').click();await mode('trend');assert.equal(await page.locator('#failHistogramChart').isVisible(),false);
await page.locator('button[data-chart-mode="histogram"]').click();await mode('histogram');assert.equal(await page.locator('#failSequenceChart').isVisible(),false);assert.equal(await page.locator('#rangeModeButton').isVisible(),true);
const rangeLabel=await page.locator('#rangeModeButton').innerText();await page.locator('#rangeModeButton').click();assert.notEqual(await page.locator('#rangeModeButton').innerText(),rangeLabel);await page.locator('#rangeModeButton').click();
await page.locator('button[data-chart-mode="both"]').click();await mode('both');
// Automatic fallback tracks available analysis width and preserves the preference.
await page.setViewportSize({width:1280,height:864});await mode('histogram');assert.equal(await page.locator('button[data-chart-mode="both"]').getAttribute('aria-pressed'),'true');
await page.locator('#sidebarToggle').click();await mode('both');await page.locator('#sidebarToggle').click();await mode('histogram');
await page.locator('button[data-chart-mode="histogram"]').click();await mode('histogram');await page.setViewportSize({width:1536,height:864});await mode('histogram');await page.locator('button[data-chart-mode="both"]').click();await mode('both');
assert.equal(await page.locator('[data-maximize-chart]').count(),0);
assert.equal(await page.locator('#distributionStats').innerText(),originalStats);assert.equal(await page.locator('#distributionTitle').innerText(),originalTitle);
assert.equal(await page.evaluate(()=>window.originalCanvas===document.querySelector('#failSequenceChart')&&window.originalHistogram===document.querySelector('#failHistogramChart')&&window.originalKpi===document.querySelector('#distributionStats .mini-metric')),true);assert.equal(await page.evaluate(()=>window.chartAnalysisCalls),0);
for(const width of [1024,760,390]){await page.setViewportSize({width,height:844});await mode('histogram');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('button[data-chart-mode="histogram"]').click();await mode('histogram');assert.equal(await page.locator('#failHistogramChart').isVisible(),true);await page.locator('button[data-chart-mode="both"]').click();await mode('histogram');}
await page.setViewportSize({width:1536,height:864});await mode('both');await page.evaluate(()=>document.getElementById('clearButton').click());await page.waitForFunction(()=>!document.querySelector('#chartMaxDialog').open);assert.equal(await page.locator('#dropZone').isVisible(),true);assert.equal(await page.locator('#distributionCharts').evaluate(e=>e.parentElement.classList.contains('distribution-chart-column')),true);
assert.deepEqual(errors,[]);console.log('PASS: dual charts at target viewports, three modes, width-based fallback/sidebar restoration, removed maximize controls, range switch, Canvas backing resize, same canvas/KPI nodes, no reanalysis, narrow screens and clear cleanup');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

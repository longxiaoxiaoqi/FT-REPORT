const assert=require('node:assert/strict');
const {chromium}=require(process.env.FT_PLAYWRIGHT||'playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
const csv=['Test Name,,,,Voltage','Test Number,,,,2','Lower Limit,,,,0','Upper Limit,,,,10','Units,,,,V','Site #,Serial #,SBin,HBin,Voltage','1,1,1,1,5','1,2,1,1,5','1,3,1,1,6','1,4,2,3,15'].join('\n');
const upload=async(name,content)=>{await page.locator('#fileInput').setInputFiles({name,mimeType:'text/csv',buffer:Buffer.from(content)});await page.locator('#workspace').waitFor({state:'visible'});};
await upload('inline_FT.csv',csv);await page.locator('[data-mode="professional"]').click();await page.locator('[data-tab="distribution"]').click();
assert.equal(await page.locator('#simulationDrawer, #openSimulationButton').count(),0);
assert.equal(await page.locator('.simulation-assumption, .distribution-sequence-header').count(),0);
assert.equal(await page.locator('[data-maximize-chart]').count(),0);

assert.equal(await page.locator('#limitSimulationPanel').isVisible(),true);
assert.equal(await page.locator('.original-statistics h3').innerText(),'数据统计');
assert.equal(await page.locator('.limit-simulator-header strong').innerText(),'良率模拟');

assert.equal(await page.locator('#distributionStats .mini-metric').count(),2);
assert.equal(await page.locator('#distributionExtraStats > div').count(),4);
assert.equal(await page.locator('#simulationExtraStats .simulation-metric').count(),4);
const stats=await page.locator('.original-statistics').innerText();assert.match(stats,/归因 Fail\s*1[\s\S]*有效数值\s*4/);
assert.match(stats,/原规格低于下限\s*0[\s\S]*原规格高于上限\s*1[\s\S]*原规格超限率\s*25.0%/);
const original=await page.locator('#yieldSimulation').innerText();assert.match(original,/当前总良率\s*75.000%[\s\S]*模拟总良率\s*75.000%/);
await page.locator('#simulatedUpperInput').fill('20');assert.match(await page.locator('#yieldSimulation').innerText(),/100.000%/);assert.match(await page.locator('#simulationExtraStats').innerText(),/25.00 pp[\s\S]*预计 Pass\s*4[\s\S]*恢复 \/ 新增 Fail\s*\+1 条/);
assert.equal(await page.locator('.original-statistics').innerText(),stats);
assert.equal(await page.locator('#simulationExtraStats .recovered-count').innerText(),'+1 条');
await page.locator('#simulatedLowerInput').fill('6');
assert.equal(await page.locator('#simulationExtraStats .recovered-count').innerText(),'+1 条');
assert.equal(await page.locator('#simulationExtraStats .new-fail-count').innerText(),'−2 条');
const assertAligned=async()=>{
const rects=await page.evaluate(()=>['.original-statistics h3','.limit-simulator-header','#distributionStats','#yieldSimulation','#distributionExtraStats','#simulationExtraStats'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {top:r.top,bottom:r.bottom}}));
for(let i=0;i<rects.length;i+=2){assert.ok(Math.abs(rects[i].top-rects[i+1].top)<1.1);assert.ok(Math.abs(rects[i].bottom-rects[i+1].bottom)<1.1);}
};
await assertAligned();
const quantityLines=await page.locator('#simulationExtraStats .quantity-change .value > span').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert.ok(quantityLines[1]>quantityLines[0]);
const colors=await page.locator('#simulationExtraStats').evaluate(e=>[getComputedStyle(e.querySelector('.recovered-count')).color,getComputedStyle(e.querySelector('.new-fail-count')).color]);assert.notEqual(colors[0],colors[1]);
await page.locator('#simulatedUpperInput').fill('10');
assert.equal(await page.locator('#simulationExtraStats .recovered-count').count(),0);
assert.equal(await page.locator('#simulationExtraStats .new-fail-count').innerText(),'−2 条');

await page.locator('#simulatedLowerInput').fill('30');assert.match(await page.locator('#yieldSimulation').innerText(),/LSL 不能高于 USL/);await page.locator('#resetLimitsButton').click();assert.equal(await page.locator('#yieldSimulation').innerText(),original);
for(const [width,height] of [[1920,1080],[1536,864],[1366,768],[1024,768],[390,844],[320,600]]){
await page.setViewportSize({width,height});await page.waitForTimeout(100);
const g=await page.evaluate(()=>{const a=document.querySelector('.original-statistics').getBoundingClientRect(),b=document.querySelector('#limitSimulationPanel').getBoundingClientRect();return {ay:a.y,by:b.y,ar:a.right,bx:b.x,ab:a.bottom,overflow:document.documentElement.scrollWidth>innerWidth,panels:[...document.querySelectorAll('.distribution-insights input,.distribution-insights button')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}})}});
const labels=await page.locator('.limit-inputs label').evaluateAll(es=>es.map(e=>{const label=e.querySelector('span').getBoundingClientRect(),input=e.querySelector('input').getBoundingClientRect();return {right:label.right,left:input.left,centerLabel:label.y+label.height/2,centerInput:input.y+input.height/2};}));
assert.ok(labels.every(r=>r.right<=r.left&&Math.abs(r.centerLabel-r.centerInput)<2));
const fill=await page.locator('#yieldSimulation').evaluate(e=>{const box=e.getBoundingClientRect(),cell=e.querySelector('.highlight').getBoundingClientRect(),style=getComputedStyle(e);return {top:cell.top-box.top,bottom:box.bottom-cell.bottom,right:box.right-cell.right,padding:style.paddingTop}});
assert.equal(fill.padding,'0px');assert.ok(fill.top<=1.1&&fill.bottom<=1.1&&fill.right<=1.1,'highlight fills container to border');
assert.equal(g.overflow,false);assert.ok(g.panels.every(r=>r.left>=0&&r.right<=width+1&&r.width>0));if(width>1200){
await assertAligned();assert.ok(Math.abs(g.ay-g.by)<1&&g.bx>=g.ar);}else{assert.ok(g.by>=g.ab);}
if(width>1200){
for(const id of ['distributionExtraStats','simulationExtraStats']){
const cells=await page.locator('#'+id+' > div').evaluateAll(es=>es.map(e=>Math.round(e.getBoundingClientRect().top)));assert.equal(cells.length,4);assert.equal(new Set(cells).size,1);
}}
if(width===1536)await page.screenshot({path:path.resolve(__dirname,'../outputs/inline-simulation-v1.88.png')});
}
await page.setViewportSize({width:1536,height:864});await upload('other_FT.csv',csv.replace('Upper Limit,,,,10','Upper Limit,,,,12'));await page.waitForFunction(()=>document.querySelector('#yieldSimulation').textContent.includes('多规格'));
for(const id of ['simulatedLowerInput','simulatedUpperInput','resetLimitsButton'])assert.equal(await page.locator('#'+id).isDisabled(),true);
await page.locator('#clearButton').click();await upload('missing_FT.csv',csv.replace('Lower Limit,,,,0','Lower Limit,,,,'));await page.locator('[data-tab="distribution"]').click();assert.equal(await page.locator('#simulatedLowerInput').isDisabled(),true);assert.equal(await page.locator('#simulatedUpperInput').isDisabled(),false);
await page.locator('#themeToggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
await page.locator('[data-tab="release"]').click();assert.equal(await page.locator('#releaseLog .is-current .release-version').innerText(),'v1.88');assert.match(await page.locator('#releaseLog .is-current').innerText(),/首页导入区标题/);
assert.deepEqual(errors,[]);console.log('PASS: inline two-panel layout, full statistics/results, input/reset/invalid limits, unchanged original statistics, six viewports, no overflow, multi-spec/missing bounds, clear, theme, visible release log');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

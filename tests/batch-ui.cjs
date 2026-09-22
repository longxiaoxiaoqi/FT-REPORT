const { chromium } = require(process.env.FT_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    const fixture=(lot,stage,n,p)=>({name:`${lot}_${stage}.csv`,mimeType:'text/csv',buffer:Buffer.from([
      'Sub Lot Number,'+lot,'PRODUCT_MODEL,P','CUSTOMER_LOTID,C',
      'Test Name,,,,Voltage','Test Number,,,,2','Lower Limit,,,,0','Upper Limit,,,,10','Units,,,,V','Site #,Serial #,SBin,HBin,Voltage',
      ...Array.from({length:n},(_,i)=>`1,${i+1},${i<p?'1,1,5':'2,3,15'}`)
    ].join('\n'))});
    await page.locator('#fileInput').setInputFiles([fixture('A','FT',100,80),fixture('A','RT',18,10),fixture('B','FT',10,9),fixture('B','RT',1,0)]);
    await page.locator('#batchYieldPanel').waitFor({state:'visible'});
    assert.match(await page.locator('.batch-total').innerText(),/90\.000%/);
    const options=await page.locator('#fileFilter optgroup[label="按子批次分析"] option').evaluateAll(es=>es.map(e=>({value:e.value,text:e.textContent})));
    assert.equal(options.length,2);
    await page.locator('#fileFilter').selectOption(options.find(o=>o.text.startsWith('A ')).value);
    assert.equal(await page.locator('#batchYieldContent > .table-wrap > table > tbody > tr').count(),1);
    assert.match(await page.locator('#summaryCards').innerText(),/118/);
    assert.equal(await page.locator('#fileTableBody tr').count(),2);
    await page.locator('#fileFilter').selectOption('all');
    const download=page.waitForEvent('download'); await page.locator('#exportButton').click();
    const report=fs.readFileSync(await (await download).path(),'utf8');
    assert.match(report,/总批次试算/); assert.match(report,/子批次轮次核对/);
    await page.locator('#analysisMode').selectOption('professional');
    await page.locator('#analysisMode').selectOption('simple');
    assert.equal(await page.locator('#batchYieldPanel').isVisible(),true);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(process.env.FT_ARCHIVE){
      await page.setViewportSize({width:1440,height:1000});
      await page.locator('#clearButton').click();
      await page.locator('#fileInput').setInputFiles(process.env.FT_ARCHIVE);
      await page.locator('#batchYieldPanel').waitFor({state:'visible'});
      const text=await page.locator('#batchYieldContent').innerText();
      assert.match(text,/95\.820%/); assert.match(text,/92\.018%/); assert.match(text,/99\.378%/);
      assert.match(text,/BIN/);
      assert.equal(await page.locator('#fileFilter optgroup[label="按子批次分析"] option').count(),2);
      if(process.env.FT_SCREENSHOT) await page.screenshot({path:process.env.FT_SCREENSHOT,fullPage:true});
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: lot filter, weighted total, export, modes, mobile layout'+(process.env.FT_ARCHIVE?', real LX3418C archive':''));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

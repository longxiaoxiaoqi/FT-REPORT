const {chromium}=require(process.env.FT_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const header=['PRODUCT_MODEL,LX3418C','CUSTOMER_LOTID,C','Sub Lot Number,A',
  'Test Name,,,,OS_VDD,OS_V1,OS_V2,OS_V3','Test Number,,,,1,2,3,4',
  'Lower Limit,,,,-1.2,-1.2,-1.2,-1.2','Upper Limit,,,,-0.3,-0.3,-0.3,-0.3','Units,,,,V,V,V,V',
  'Site #,Serial #,SBin,HBin'].join('\n');
const upload=(name,rows)=>({name,mimeType:'text/csv',buffer:Buffer.from(header+'\n'+rows.join('\n'))});
const good='1,1,1,1,-0.8,-0.8,-0.8,-0.8';
const empty='1,2,10,5,-2.9,-2.9,-2.9,-2.9';
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.locator('#fileInput').setInputFiles([upload('A_FT.csv',[good,empty]),upload('copy_FT.csv',[good,empty]),upload('A_RT.csv',[good])]);
    await page.locator('#batchYieldPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#fileTableBody tr').count(),2);
    assert.match(await page.locator('#batchYieldContent').innerText(),/当前截止 RT/);
    assert.match(await page.locator('.batch-total').innerText(),/末轮空封 0/);
    assert.match(await page.locator('.batch-total').innerText(),/100\.000%/);
    await page.locator('#fileInput').setInputFiles(upload('renamed_FT.csv',[good,empty]));
    await page.waitForFunction(()=>document.body.innerText.includes('跳过 1 个内容重复文件'));
    assert.equal(await page.locator('#fileTableBody tr').count(),2);
    const download=page.waitForEvent('download');await page.locator('#exportButton').click();
    const report=fs.readFileSync(await(await download).path(),'utf8');
    assert.match(report,/当前截止轮次/);assert.match(report,/末轮空封/);assert.match(report,/本轮空封,文件数/);
    assert.doesNotMatch(report,/仅扣初测空封/);
    assert.deepEqual(errors,[]);
    console.log('PASS: renamed/repeated CSV deduplication, final RT empty seals, export');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

// Requires Playwright + Edge. FT_PLAYWRIGHT may point to an external Playwright package.
// FT_TEST_ROWS controls synthetic sample size (default: 744561).
const { chromium } = require(process.env.FT_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const rows = Number(process.env.FT_TEST_ROWS || 744561);
    const header = ['Test Name,,,,Voltage', 'Test Number,,,,2', 'Lower Limit,,,,0', 'Upper Limit,,,,10', 'Units,,,,V', 'Site #,Serial #,SBin,HBin,Voltage'].join('\n');
    const csv = header + '\n' + Array.from({ length: rows }, (_, i) => `1,${i + 1},${i % 100 ? '1,1,5' : '2,3,15'}`).join('\n');
    await page.locator('#fileInput').setInputFiles({ name: 'large_FT.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.locator('#workspace').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#summaryCards .summary-card').count(), 8);
    const before = await page.locator('#summaryCards').innerText();
    for (const label of ['产品名称', '首要 Fail 项', '单颗测试时间', 'UPH', '日产出']) assert.ok(before.includes(label));
    await page.evaluate(() => {
      window.analysisCalls = 0;
      for (const name of ['analyze', 'analyzeFactory', 'analyzeProductionFlow']) {
        const original = FTCore[name];
        FTCore[name] = (...args) => { window.analysisCalls++; return original(...args); };
      }
      window.originalCard = document.querySelector('#summaryCards .summary-card');
      window.originalDetail = document.querySelector('#detailTableBody tr');
    });
    const timings = await page.evaluate(async () => {
      const durations = [];
      for (const mode of ['professional', 'simple', 'professional', 'simple']) {
        const start = performance.now();
        const select = document.getElementById('analysisMode');
        select.value = mode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        durations.push({ mode, ms: Math.round(performance.now() - start) });
      }
      return durations;
    });
    assert.equal(await page.evaluate(() => window.analysisCalls), 0);
    assert.equal(await page.evaluate(() => window.originalCard === document.querySelector('#summaryCards .summary-card')), true);
    assert.equal(await page.evaluate(() => window.originalDetail === document.querySelector('#detailTableBody tr')), true);
    assert.equal(await page.locator('#summaryCards').innerText(), before);
    await page.locator('#expandAnalysisButton').click();
    assert.equal(await page.evaluate(() => window.analysisCalls), 0);
    await page.locator('[data-tab="details"]').click();
    await page.locator('#analysisMode').selectOption('simple');
    assert.equal(await page.locator('#overviewPanel').isVisible(), true);
    assert.equal(await page.locator('#detailsPanel').isVisible(), false);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButton').click();
    const report = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
    assert.match(report, /产品名称/);
    assert.match(report, /UPH/);
    assert.doesNotMatch(report, /参数稳定性/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    // Data changes in professional mode must also refresh the cached simple view.
    await page.locator('#analysisMode').selectOption('professional');
    await page.locator('#clearButton').click();
    await page.locator('#fileInput').setInputFiles({ name: 'pass.csv', mimeType: 'text/csv', buffer: Buffer.from(header + '\n1,1,1,1,5') });
    await page.locator('#analysisMode').selectOption('simple');
    assert.match(await page.locator('#simpleImpactContent').innerText(), /全部通过/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ rows, timings, result: 'PASS: no reanalysis or DOM rebuild on mode switches; export, mobile layout, refreshed data and tab reset verified' }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

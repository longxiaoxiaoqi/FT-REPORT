const assert = require('node:assert/strict');
const { chromium } = require(process.env.FT_PLAYWRIGHT || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    assert.equal(await page.locator('#compactImportZone').isVisible(), false);
    const names = ['LOSS_RF5', 'OS_VDD_EXTREMELY_LONG_TEST_PARAMETER_NAME', 'PASS_ONLY_LONG_PARAMETER_NAME'];
    const header = ['Test Name,,,,' + names.join(','), 'Test Number,,,,2,3,4', 'Lower Limit,,,,0,0,0', 'Upper Limit,,,,10,10,10', 'Units,,,,V,V,V', 'Site #,Serial #,SBin,HBin,' + names.join(',')].join('\n');
    const csv = header + '\n' + ['1,1,1,1,5,5,5', '1,2,2,3,15,5,5', '1,3,3,3,5,-2,5', '1,4,1,1,6,6,6'].join('\n');
    const upload = (name, content) => ({ name, mimeType: 'text/csv', buffer: Buffer.from(content) });
    await page.locator('#fileInput').setInputFiles(upload('layout_FT.csv', csv));
    await page.locator('#workspace').waitFor({ state: 'visible' });
    await page.locator('[data-mode="professional"]').click();
    await page.locator('[data-tab="distribution"]').click();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('distribution-view')), true);
    assert.equal(await page.locator('#dropZone').isVisible(), false);
    assert.equal(await page.locator('#addFilesButton').isVisible(), true);
    assert.equal(await page.locator('#compactImportZone').isVisible(), true);
    assert.equal(await page.locator('#clearButton').innerText(), '清空数据');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.locator('#compactImportZone').click();
    await (await chooserPromise).setFiles([]);
    assert.equal(await page.locator('.distribution-table-wrap thead th').count(), 3);
    assert.equal(await page.locator('#distributionFailTableBody tr[data-reason]').count(), 2);
    assert.equal(await page.locator('#distributionStats .mini-metric').count(), 2);
    assert.equal(await page.locator('#yieldSimulation .simulation-metric').count(), 2);
    assert.match(await page.locator('#distributionStats').innerText(), /归因 Fail[\s\S]*1[\s\S]*有效数值[\s\S]*4/);
    // Observe the actual Canvas stroke: in full range all four sampled records form one polyline.
    await page.evaluate(() => {
      window.sequenceStrokeSegments = 0;
      const proto = CanvasRenderingContext2D.prototype;
      const begin = proto.beginPath, line = proto.lineTo, stroke = proto.stroke;
      proto.beginPath = function(...args) { this.sequenceSegments = 0; return begin.apply(this, args); };
      proto.lineTo = function(...args) { this.sequenceSegments++; return line.apply(this, args); };
      proto.stroke = function(...args) {
        if (this.canvas.id === 'failSequenceChart' && this.strokeStyle.includes('0.42')) window.sequenceStrokeSegments = Math.max(window.sequenceStrokeSegments, this.sequenceSegments);
        return stroke.apply(this, args);
      };
    });
    await page.locator('#rangeModeButton').click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => window.sequenceStrokeSegments), 3);
    await page.locator('#rangeModeButton').click();
    assert.match(await page.locator('#importFileCount').innerText(), /已导入 1 个文件/);
    const sidebarBefore = await page.locator('#distributionSidebar').boundingBox();
    assert.equal(Math.round(sidebarBefore.width), 252);
    const chartBefore = await page.locator('#failSequenceChart').boundingBox();
    const displayedStats = await page.evaluate(() => {
      const pairs = [...document.querySelectorAll('#distributionStats .mini-metric')].map(e => [e.querySelector('.label').textContent, e.querySelector('.value').textContent]);
      pairs.push(...[...document.querySelectorAll('#distributionExtraStats >div')].map(e => [e.querySelector('span').textContent, e.querySelector('strong').textContent]));
      return Object.fromEntries(pairs);
    });
    assert.deepEqual(displayedStats, {
      '归因 Fail':'1', '有效数值':'4', '原规格低于下限':'0', '原规格高于上限':'1', '原规格超限率':'25.0%',
      '均值':'7.7500 V',
    });
    const statsBeforeCollapse = await page.locator('#distributionStats').innerText();
    await page.evaluate(() => { window.phaseOneStats = document.querySelector('#distributionStats .mini-metric'); });
    await page.locator('#sidebarToggle').click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#sidebarToggle').getAttribute('aria-expanded'), 'false');
    assert.equal(Math.round((await page.locator('#distributionSidebar').boundingBox()).width), 44);
    assert.ok((await page.locator('#failSequenceChart').boundingBox()).width > chartBefore.width + 75);
    assert.equal(await page.locator('#distributionSearch').isVisible(), false);
    assert.equal(await page.locator('#distributionStats').innerText(), statsBeforeCollapse);
    assert.equal(await page.evaluate(() => window.phaseOneStats === document.querySelector('#distributionStats .mini-metric')), true);
    await page.locator('[data-tab="stability"]').click();
    await page.locator('[data-tab="distribution"]').click();
    assert.equal(await page.locator('#sidebarToggle').getAttribute('aria-expanded'), 'false');
    await page.locator('#sidebarToggle').click();
    assert.equal(await page.locator('#distributionSearch').isVisible(), true);
    assert.equal(await page.locator('[data-reason="OS_VDD_EXTREMELY_LONG_TEST_PARAMETER_NAME"] .distribution-reason').getAttribute('title'), 'OS_VDD_EXTREMELY_LONG_TEST_PARAMETER_NAME');
    assert.equal(await page.locator('[data-reason="OS_VDD_EXTREMELY_LONG_TEST_PARAMETER_NAME"] .distribution-reason').evaluate(e => e.scrollWidth > e.clientWidth), true);
    const rowValues = await page.locator('#distributionFailTableBody').innerText();
    assert.equal(await page.locator('#distributionSort').count(), 0);
    assert.equal(await page.locator('#distributionFailTableBody').innerText(), rowValues);

    const selected = await page.locator('#distributionTitle').innerText();
    await page.locator('#distributionSearch').fill('os_vdd');
    assert.equal(await page.locator('#distributionFailTableBody tr[data-reason]').count(), 1);
    assert.equal(await page.locator('#distributionTitle').innerText(), selected);
    await page.locator('#distributionSearch').fill('no_match');
    assert.match(await page.locator('#distributionFailTableBody').innerText(), /没有匹配/);
    await page.locator('#distributionSearch').fill('');
    await page.locator('[data-reason="LOSS_RF5"]').click();
    await page.waitForTimeout(80);
    assert.match(await page.locator('#distributionExtraStats').innerText(), /原规格高于上限[\s\S]*1/);
    assert.equal(await page.locator('#simulationExtraStats .simulation-metric').count(), 4);
    const original = await page.locator('#yieldSimulation').innerText();
    await page.locator('#simulatedUpperInput').fill('20');
    assert.notEqual(await page.locator('#yieldSimulation').innerText(), original);
    assert.match(await page.locator('#simulationExtraStats').innerText(), /25.00 pp/);
    assert.equal(await page.locator('#distributionStats').innerText(), statsBeforeCollapse);
    await page.locator('#resetLimitsButton').click();
    assert.equal(await page.locator('#yieldSimulation').innerText(), original);
    await page.locator('#simulatedLowerInput').fill('30');
    assert.match(await page.locator('#yieldSimulation').innerText(), /LSL 不能高于 USL/);
    await page.locator('#resetLimitsButton').click();
    const box = await page.locator('#failSequenceChart').boundingBox();
    const y = box.y + 22 + (box.height - 60) / 6;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, y + 24, { steps: 5 }); await page.mouse.up();
    assert.notEqual(Number(await page.locator('#simulatedUpperInput').inputValue()), 10);
    await page.locator('#resetLimitsButton').click();
    await page.locator('button[data-chart-mode="both"]').click();
    await page.locator('#failHistogramChart').scrollIntoViewIfNeeded();
    const hist = await page.locator('#failHistogramChart').boundingBox();
    const upperX = hist.x + 66 + (hist.width - 90) * 5 / 6;
    await page.mouse.move(upperX, hist.y + hist.height / 2);
    await page.mouse.down(); await page.mouse.move(upperX - 25, hist.y + hist.height / 2, { steps: 5 }); await page.mouse.up();
    assert.notEqual(Number(await page.locator('#simulatedUpperInput').inputValue()), 10);
    await page.locator('#resetLimitsButton').click();
    const leftScroll = await page.locator('.distribution-list-panel').evaluate(e => e.scrollTop);
    await page.locator('.distribution-chart-column').hover(); await page.mouse.wheel(0, 500); await page.waitForTimeout(100);
    assert.equal(await page.locator('.distribution-list-panel').evaluate(e => e.scrollTop), leftScroll);
    await page.locator('#distributionTestButton').click();
    const pickerGeometry = await page.locator('#distributionTestMenu').evaluate(menu => {
      const box = menu.getBoundingClientRect();
      const sidebar = document.querySelector('#distributionSidebar').getBoundingClientRect();
      return { left: box.left, right: box.right, sidebarLeft: sidebar.left, sidebarRight: sidebar.right,
        wrapping: getComputedStyle(menu.querySelector('.distribution-test-name')).whiteSpace };
    });
    assert.ok(pickerGeometry.left >= 0 && pickerGeometry.right <= 1536);
    assert.equal(pickerGeometry.wrapping, 'normal');
    assert.deepEqual(await page.locator('[data-distribution-test]').evaluateAll(options => options.map(e => e.dataset.distributionTest)), names);
    assert.equal(await page.locator('[data-distribution-test="PASS_ONLY_LONG_PARAMETER_NAME"] .distribution-test-count').innerText(), '0');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#distributionTestMenu').isVisible(), false);
    if (!await page.locator('#distributionTestMenu').isVisible()) await page.locator('#distributionTestButton').click();
    await page.locator('[data-distribution-test="PASS_ONLY_LONG_PARAMETER_NAME"]').click();
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#distributionDetailButton').isDisabled(), true);
    await page.locator('[data-reason="LOSS_RF5"]').click();
    await page.waitForTimeout(80);
    for (const [width, height] of [[1920,1080], [1536,864], [1366,768], [1280,900], [1024,768], [980,844], [390,844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(150);
      await page.locator('#distributionTestButton').click();
      const popup = await page.locator('#distributionTestMenu').boundingBox();
      assert.ok(popup.x >= 0 && popup.x + popup.width <= width && popup.y + popup.height <= height);
      await page.keyboard.press('Escape');
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        upper: document.querySelector('#simulatedUpperInput').getBoundingClientRect().width,
        chart: document.querySelector('.distribution-sequence-chart').getBoundingClientRect().height,
        sidebarScroll: getComputedStyle(document.querySelector('.distribution-list-panel')).overflowY,
        graphScroll: getComputedStyle(document.querySelector('.distribution-chart-column')).overflowY,
      }));
      assert.equal(geometry.overflow, false, 'page overflow at ' + width);

      assert.ok(geometry.chart >= 260, 'sequence plot at ' + width);
      if (width > 980) {
        assert.equal(geometry.sidebarScroll, 'auto'); assert.equal(geometry.graphScroll, 'auto');
        assert.equal(Math.round((await page.locator('.app-header').boundingBox()).height), 52);
        assert.equal(Math.round((await page.locator('.workspace-navigation').boundingBox()).height), 40);
        assert.equal(Math.round((await page.locator('#distributionSidebar').boundingBox()).width), 252);
        if (width >= 1280) {
          const kpis = await page.locator('#distributionStats .mini-metric').evaluateAll(elements => elements.map(e => ({ top:e.getBoundingClientRect().top, height:e.getBoundingClientRect().height, clipped:e.scrollWidth>e.clientWidth })));
          assert.equal(new Set(kpis.map(k=>Math.round(k.top))).size, 1, 'single KPI row '+width);
          assert.ok(kpis.every(k=>k.height>=50&&k.height<=70&&!k.clipped), 'KPI size '+width);
        }
      }
    }
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.locator('#themeToggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.locator('#themeToggle').click();
    // Tab switching must retain the same header geometry and existing analysis nodes.
    await page.evaluate(() => {
      window.shellCard = document.querySelector('#summaryCards .summary-card');
      window.shellAnalysisCalls = 0;
      const originalAnalyze = FTCore.analyze;
      FTCore.analyze = (...args) => { window.shellAnalysisCalls++; return originalAnalyze(...args); };
    });
    for (const width of [1536, 1280, 1024, 390]) {
      await page.setViewportSize({ width, height: 1024 });
      await page.evaluate(() => scrollTo(0, 0));
      let baseline;
      for (const tab of ['overview', 'distribution', 'stability', 'details', 'files', 'audit', 'release']) {
        await page.locator('[data-tab="' + tab + '"]').click();
        const geometry = await page.evaluate(() => {
          const selectors = ['.app-header', '.toolbar', '.tabs', '#fileFilter', '#analysisMode', '#exportButton', '#compactImportZone', '#clearButton'];
          return selectors.map(selector => {
            const box = document.querySelector(selector).getBoundingClientRect();
            return [Math.round(box.x), Math.round(box.y + scrollY), Math.round(box.width), Math.round(box.height)];
          });
        });
        if (!baseline) baseline = geometry;
        assert.deepEqual(geometry, baseline, 'common header for ' + tab + ' at ' + width);
        assert.equal(await page.locator('#' + tab + 'Panel').isVisible(), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await page.locator('#dropZone').isVisible(), false);
        assert.equal(await page.locator('#compactImportZone').isVisible(), true);
        assert.equal(await page.locator('#clearButton').isVisible(), true);
        if (width > 980) {
          const unclipped = await page.evaluate(() => {
            const importer = document.querySelector('#compactImportZone').getBoundingClientRect();
            const clear = document.querySelector('#clearButton').getBoundingClientRect();
            const actions = document.querySelector('.toolbar-actions').getBoundingClientRect();
            const title = document.querySelector('.app-header h1').getBoundingClientRect();
            return clear.x >= 0 && clear.right <= innerWidth && clear.y < 65
              && (importer.top >= title.bottom || importer.x >= title.right)
              && (importer.top >= actions.bottom || importer.right <= actions.left);
          });
          assert.equal(unclipped, true, 'import/clear overlap at ' + width);
        }
      }
    }
    assert.equal(await page.evaluate(() => window.shellAnalysisCalls), 0);
    assert.equal(await page.evaluate(() => window.shellCard === document.querySelector('#summaryCards .summary-card')), true);
    await page.setViewportSize({ width: 1536, height: 1024 });
    await page.locator('[data-tab="release"]').click();
    assert.equal(await page.locator('#releaseLog .is-current .release-version').innerText(), 'v1.87');
    assert.match(await page.locator('#releaseLog .is-current').innerText(), /删除哪些 Fail 影响了良率标题下/);
    assert.match(await page.locator('#releaseLog').innerText(), /清空数据/);
    assert.match(await page.locator('#releaseLog').innerText(), /v1.57/);
    assert.equal(await page.locator('#versionText').innerText(), 'v1.87');
    // All loaded tabs share the analysis shell; clearing restores the import screen.
    await page.locator('[data-tab="overview"]').click();
    assert.equal(await page.locator('#dropZone').isVisible(), false);
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('analysis-workspace')), true);
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('distribution-view')), false);
    await page.locator('[data-tab="distribution"]').click();
    await page.evaluate(content => {
      const data = new DataTransfer(); data.items.add(new File([content], 'other_FT.csv', { type: 'text/csv' }));
      document.getElementById('compactImportZone').dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
    }, csv.replace('Upper Limit,,,,10', 'Upper Limit,,,,12'));
    await page.waitForFunction(() => document.querySelector('#yieldSimulation').textContent.includes('多规格'));
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#simulatedUpperInput').isDisabled(), true);
    assert.equal(await page.locator('#resetLimitsButton').isDisabled(), true);
    assert.match(await page.locator('#distributionHint').textContent(), /种规格/);
    assert.match(await page.locator('#yieldSimulation').innerText(), /多规格/);
    await page.locator('[data-tab="files"]').click();
    assert.equal(await page.locator('#fileTableBody tr').count(), 2);
    assert.match(await page.locator('#fileTableBody').innerText(), /layout_FT.csv/);
    assert.match(await page.locator('#fileTableBody').innerText(), /other_FT.csv/);
    await page.locator('#clearButton').click();
    assert.equal(await page.locator('#dropZone').isVisible(), true);
    assert.equal(await page.locator('#distributionSearch').inputValue(), '');
    assert.equal(await page.locator('#compactImportZone').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: phase-two five KPIs, exact original statistical values/precision, responsive strip; phase-one compact chrome, collapsible 252px sidebar, sorting/selection, target viewports; connected sequence Canvas stroke, reference layout, searchable three-column list, full statistics details, simulation/reset/invalid/drag, all-parameter selection, six viewports, themes, shared header across all seven tabs without reanalysis, compact import click/drop, visible clear action, v1.87 logs, clear restoration and multi-spec boundaries');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

// Run: node --test tests/core-regression.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Core = require('../ft-core.js');

function fixture(id, loop = false) {
  const csv = [
    'Test Name,,,,Voltage', 'Test Number,,,,2',
    'Lower Limit,,,,0', 'Upper Limit,,,,10', 'Units,,,,V',
    'Site #,Serial #,SBin,HBin,Voltage',
    '1,1,1,1,5', '1,2,2,3,15',
  ].join('\n');
  const file = Core.parseFtFileText(csv, 'sample_FT_20260909090000.csv', id);
  if (loop) Object.assign(file, { dataKind: 'loop', format: 'Loop XLSX', stage: 'LOOP' });
  return file;
}

test('production stability excludes failed measurements', () => {
  const a = Core.analyze([fixture('production')], 'all');
  assert.equal(a.total, 2);
  assert.equal(a.pass, 1);
  assert.equal(a.stability[0].n, 1);
  assert.equal(a.stability[0].mean, 5);
});

test('loop failure remains in stability and parameter trend', () => {
  const file = fixture('loop', true);
  const a = Core.analyze([file], 'all');
  assert.equal(a.stability[0].n, 2);
  assert.equal(a.stability[0].mean, 10);
  assert.equal(Core.parameterSeries(a, 'Voltage').points.length, 2);
  assert.equal(Core.analyzeProductionFlow([file]).productionInitial.total, 0);
  assert.equal(Core.factoryFileRole(file), 'loop');
});

test('mixed inputs preserve each stability and production population', () => {
  const files = [fixture('production'), fixture('loop', true)];
  const a = Core.analyze(files, 'all');
  assert.equal(a.total, 4);
  assert.equal(a.stability[0].n, 3);
  assert.equal(Core.analyzeProductionFlow(files).productionInitial.total, 2);
  assert.equal(Core.analyze(files, 'production').stability[0].n, 1);
});

// Optional real-file validation; private samples are never stored in this repo.
for (const [index, path] of (process.env.FT_LOOP_SAMPLES || '').split('|').filter(Boolean).entries()) {
  test(`real Loop workbook ${index + 1}`, async () => {
    const bytes = fs.readFileSync(path);
    const result = await Core.parseXlsxWorkbook(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), path, `real-${index}`);
    assert.equal(result.kind, 'detail');
    assert.equal(result.data.dataKind, 'loop');
    assert.equal(result.data.records.length, 100);
    assert.equal(result.data.tests.length, index === 0 ? 78 : 58);
    const a = Core.analyze([result.data], 'all');
    assert.equal(a.stabilityRecords.length, 100);
    assert.equal(Core.analyzeProductionFlow([result.data]).productionInitial.total, 0);
  });
}

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Core = require('../ft-core.js');
function fixture(stage, rows) {
  return Core.parseFtFileText([
    'PRODUCT_MODEL,LX3418C', 'CUSTOMER_LOTID,C', 'Sub Lot Number,A',
    'Test Name,,,,OS_VDD,OS_V1,OS_V2,OS_V3,OS_VDD_POST,OS_V1_POST',
    'Test Number,,,,1,2,3,4,5,6', 'Lower Limit,,,,-1.2,-1.2,-1.2,-1.2,-1.2,-1.2',
    'Upper Limit,,,,-0.3,-0.3,-0.3,-0.3,-0.3,-0.3', 'Units,,,,V,V,V,V,V,V',
    'Site #,Serial #,SBin,HBin', ...rows,
  ].join('\n'), `A_${stage}.csv`, stage);
}
test('two distinct front OS pins, tolerance, missing values and POST exclusion', () => {
  const f = fixture('FT', ['1,1,1,1,-0.8,-0.8,-0.8,-0.8,-2.9,-2.9',
    '1,2,10,5,-2.95,-2.85,-0.8,-0.8', '1,3,10,5,-2.9,,-0.8,-0.8',
    '1,4,10,5,-2.951,-2.9,-0.8,-0.8']);
  const a = Core.analyze([f]);
  assert.equal(a.emptySeal, 1);
  assert.deepEqual(f.records.map(r => r.isEmptySeal), [false,true,false,false]);
  assert.equal(a.yield, 1/4);
  const p = Core.analyzeSubLots([f]).parents[0];
  assert.equal(p.yieldWithoutEmptySeal, 1/3);
});
test('latest-round empty seals are deducted and all-empty yields are unavailable', () => {
  const ft=fixture('FT',['1,1,1,1,-0.8,-0.8,-0.8,-0.8','1,2,10,5,-2.9,-2.9,-2.9,-2.9']);
  const rt=fixture('RT',['1,1,10,5,-2.9,-2.9,-2.9,-2.9']);
  const p=Core.analyzeSubLots([ft,rt]).parents[0];
  assert.equal(p.emptySeal,1); assert.equal(p.yield,.5); assert.equal(p.yieldWithoutEmptySeal,1);
  assert.equal(Core.analyzeSubLots([fixture('FT',['1,1,10,5,-2.9,-2.9,-2.9,-2.9'])]).parents[0].yieldWithoutEmptySeal,null);
  ft.dataKind='loop'; Core.classifyEmptySeals(ft); assert.equal(ft.records.some(r=>r.isEmptySeal),false);
});
test('latest RT replaces initial empty count, independent of import order', () => {
  const ft=fixture('FT',['1,1,1,1,-0.8,-0.8,-0.8,-0.8','1,2,10,5,-2.9,-2.9,-2.9,-2.9','1,3,10,5,-2.9,-2.9,-2.9,-2.9']);
  const rt=fixture('RT',['1,1,1,1,-0.8,-0.8,-0.8,-0.8','1,2,10,5,-2.9,-2.9,-2.9,-2.9']);
  const rt1=fixture('RT1',['1,1,1,1,-0.8,-0.8,-0.8,-0.8']);
  const mid=Core.analyzeSubLots([rt,ft]).lots[0];
  assert.equal(mid.emptySeal,1); assert.equal(mid.yieldWithoutEmptySeal,1); assert.equal(mid.finalStage,'RT');
  const last=Core.analyzeSubLots([rt1,ft,rt]).lots[0];
  assert.equal(last.emptySeal,0); assert.equal(last.yieldWithoutEmptySeal,1); assert.equal(last.finalStage,'RT1');
  assert.deepEqual(last.steps.map(s=>s.emptySeal),[2,1,0]);
});
for (const [i,path] of (process.env.FT_EMPTY_SAMPLES || '').split('|').filter(Boolean).entries()) {
  test(`real empty seal sample ${i+1}`, () => {
    const f=Core.parseFtFileText(fs.readFileSync(path,'utf8'),require('node:path').basename(path),'real');
    const a=Core.analyze([f]); assert.equal(a.emptySeal, i===0 ? 40 : 22);
    if(i===0) for(const serial of ['1','513','705','2385']) assert.equal(f.records.find(r=>String(r.serial)===serial).isEmptySeal,false);
  });
}

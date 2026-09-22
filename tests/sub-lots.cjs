const { test } = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../ft-core.js');
function file(lot, stage, total, pass, extra = {}) {
  return { id: `${lot}-${stage}`, name: `sample_${stage}.csv`, stage, metadata: { 'sub lot number': lot, device: 'P', 'cust lotid': 'C' }, tests: [], testIndexByName: {},
    records: Array.from({ length: total }, (_, i) => ({ fileId: `${lot}-${stage}`, serial: `${i + 1}`, site: '1', isPass: i < pass, failReason: i < pass ? '' : 'V', values: [], hbin: i < pass ? '1' : '3' })), ...extra };
}
test('groups independently and weights total by initial input; QA/BIN do not inflate recovery', () => {
  const files = [file('A','FT',100,80), file('A','RT',18,10), file('A','RT1',8,2), file('B','FT',10,9), file('B','RT',1,0), file('A','FT_QA',20,20), file('A','BIN5',3,3)];
  const { lots, parents } = Core.analyzeSubLots(files);
  const a = lots.find(l => l.lot === 'A');
  assert.deepEqual([a.input,a.output,a.recovered,a.gap,a.remaining], [100,92,12,2,6]);
  assert.equal(a.pending.length,1);
  assert.equal(a.excluded.length,1);
  assert.equal(parents[0].yield,101/110);
  assert.equal(parents[0].gap,2);
  const group=Core.groupSubLots(files).find(g=>g.lot==='A');
  assert.equal(Core.analyze(files,group.id).selectedFiles.length,5);
});
test('opposite discrepancies cannot cancel across sublots; abnormal total remains pending', () => {
  const result=Core.analyzeSubLots([file('A','FT',100,90),file('A','RT',8,7),file('B','FT',100,95),file('B','RT',7,7)]);
  assert.equal(result.lots.find(l=>l.lot==='A').gap,2);
  assert.equal(result.lots.find(l=>l.lot==='B').yield,null);
  assert.equal(result.parents[0].yield,null);
  assert.equal(result.parents[0].complete,false);
});
test('same sublot in different products/customer lots never merges; missing lots isolated', () => {
  const a=file('A','FT',10,9), b=file('A','RT',1,1);
  b.metadata.device='Other';
  const c=file('A','RT1',1,1); c.metadata['cust lotid']='Other';
  const u=file('','FT',10,9), v=file('','RT',1,1);
  const result=Core.analyzeSubLots([a,b,c,u,v]);
  assert.equal(result.lots.length,5);
  assert.equal(result.parents.length,3);
  assert.equal(result.parents.find(p=>p.product==='P' && p.customerLot==='C').yield,null);
  assert.equal(result.lots.filter(l=>!l.lot).every(l=>l.yield===null),true);
});
test('rejects missing, duplicated, skipped and oversized rounds', () => {
  const cases=[ [file('A','RT',1,1)], [file('A','FT',10,8),file('A','FT1',10,8)], [file('A','FT',10,8),file('A','RT',2,1),file('A','RT',2,1)], [file('A','FT',10,8),file('A','RT2',2,1)] ];
  for(const files of cases) assert.equal(Core.analyzeSubLots(files).lots[0].yield,null);
  const f=file('A','FT',10,8); f.records[1].serial='1';
  assert.equal(Core.analyzeSubLots([f]).lots[0].yield,null);
});
test('FT alone remains fail, not loss; RT1 can be first retest; loops are excluded', () => {
  const a=Core.analyzeSubLots([file('A','FT',10,8)]).lots[0];
  assert.equal(a.gap,0); assert.equal(a.remaining,2);
  const b=Core.analyzeSubLots([file('A','FT',10,8),file('A','RT1',2,1)]).lots[0];
  assert.equal(b.output,9);
  const c=Core.analyzeSubLots([file('A','FT',10,8,{dataKind:'loop'})]);
  assert.equal(c.parents.length,0);
});
test('rejects reversed chronology and treats placeholder lots as unknown', () => {
  const ft=file('A','FT',10,8,{fileTimeKey:'20260921120000'});
  const rt=file('A','RT',2,1,{fileTimeKey:'20260921110000'});
  assert.equal(Core.analyzeSubLots([ft,rt]).lots[0].yield,null);
  assert.equal(Core.groupSubLots([file('N/A','FT',10,8),file('N/A','RT',2,1)]).length,2);
});

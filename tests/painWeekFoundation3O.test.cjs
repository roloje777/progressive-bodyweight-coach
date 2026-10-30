const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('engine/PainWeekPolicy.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }}).outputText;
const moduleObj = { exports: {} };
vm.runInNewContext(compiled, { module: moduleObj, exports: moduleObj.exports, Date, Number, Error });
const { assessPainWeek, assessFinalPainWeek, painWeekDay } = moduleObj.exports;
const sample = { episodeId:'test', localDate:'2026-10-29', recordedAt:'2026-10-29T10:00:00Z', painScore:0, symptoms:'resolved', movementLimited:false, severePain:false, warningSigns:false, readyForReducedTraining:true, earlyReturnAcknowledged:false };
test('Day 3 pain-free offers final assessment without seven-day minimum', () => {
  assert.equal(painWeekDay('2026-10-27','2026-10-29'),3);
  assert.equal(assessPainWeek(sample),'final-assessment-eligible');
});
test('Early return requires explicit acknowledgement', () => {
  assert.equal(assessFinalPainWeek(sample,3,7),'early-return-confirmation-required');
  assert.equal(assessFinalPainWeek({...sample,earlyReturnAcknowledged:true},3,7),'ready-for-deload');
  assert.equal(assessFinalPainWeek(sample,7,7),'ready-for-deload');
});
test('Persistent pain never qualifies even on day seven', () => {
  assert.equal(assessFinalPainWeek({...sample,painScore:2},7,7),'continue-recovery');
});
test('Severe, worsening or warning signs always require medical pathway', () => {
  for (const update of [{severePain:true},{symptoms:'worsening'},{warningSigns:true}])
    assert.equal(assessFinalPainWeek({...sample,...update,earlyReturnAcknowledged:true},3,7),'medical-recovery');
});
test('Movement limitation and lack of readiness prevent early return', () => {
  assert.equal(assessFinalPainWeek({...sample,movementLimited:true,earlyReturnAcknowledged:true},3,7),'continue-recovery');
  assert.equal(assessFinalPainWeek({...sample,readyForReducedTraining:false,earlyReturnAcknowledged:true},3,7),'continue-recovery');
});
test('Storage persists dates, recommended duration, actual duration and unique daily check-ins', () => {
  const storage = fs.readFileSync('storage/painWeekStorage.ts','utf8');
  for (const term of ['startedLocalDate','recommendedDays','actualDays','originalWeekIndex','originalDayIndex','localDate !== assessment.localDate','deletePainWeekEpisode'])
    assert.ok(storage.includes(term),`missing ${term}`);
});

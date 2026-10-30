const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (p) => fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('verification is evaluated before graduation and advances individual days',()=>{
 const s=read('app/screens/workoutSummary.tsx');
 assert.ok(s.indexOf('evaluateVerificationAttempt({') < s.indexOf('const lifecycleResult = await evaluateProgramLifecycle('));
 assert.match(s,/advanceVerificationDay\(\)/);
 assert.match(s,/kind: "verification-retry"/);
});
test('verification final recovery is calendar based and persists its cursor',()=>{
 const s=read('app/screens/workoutSummary.tsx');
 assert.match(s,/recoveryDays: 2, kind: "verification-final"/);
 assert.match(s,/finishVerificationWeek\(\)/);
 const c=read('context/ProgressContext.tsx');
 assert.match(c,/phase: "verification-recovery"/);
 assert.match(c,/activeDeload\.returnDayIndex/);
});
test('compulsory is the default without overwriting saved settings',()=>{
 const s=read('storage/generalSettingsStorage.ts');
 assert.match(s,/recoveryEnforcement: "compulsory",/);
 assert.match(s,/\.\.\.DEFAULT_GENERAL_SETTINGS, \.\.\.\(JSON\.parse\(raw\)/);
});
test('recovery messages localized in Portuguese',()=>{
 const s=read('i18n/locales/pt-PT.ts');
 assert.match(s,/recoveryCoach\.compulsory/);
 assert.match(s,/Recuperação obrigatória/);
});

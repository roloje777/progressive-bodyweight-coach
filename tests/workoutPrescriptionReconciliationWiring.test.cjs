const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('reconciliation preserves active or invalid recovery snapshots',()=>{
 const s=read('utils/reconcileStaleWorkoutPrescription.ts');
 assert.match(s,/active\.status !== 'none'/);
 assert.match(s,/stored\.state !== 'valid'/);
});
test('reconciliation requires completed history evidence for same program position',()=>{
 const s=read('utils/reconcileStaleWorkoutPrescription.ts');
 assert.match(s,/entry\?\.status === 'completed'/);
 assert.match(s,/entry\?\.weekIndex === old\.weekIndex/);
 assert.match(s,/entry\.endWorkoutTime >= old\.startWorkoutTime/);
});
test('start reconciles before saving new immutable prescription',()=>{
 const s=read('app/screens/preWorkoutOverView.tsx');
 assert.ok(s.indexOf('await reconcileStaleWorkoutPrescription(')<s.indexOf('await saveLockedWorkoutPrescription(lockedPrescription)'));
});

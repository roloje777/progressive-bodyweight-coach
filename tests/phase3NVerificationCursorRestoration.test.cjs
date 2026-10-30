const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {scenario}=require('./lifecycleHarness.cjs');
const root=path.resolve(__dirname,'..');
test('deload remembers exact normal week and day',()=>{
 const s=scenario({week:1,day:1});s.invoke('activateDeload','fatigue');
 assert.equal(s.state.activeDeload.returnWeekIndex,1);
 assert.equal(s.state.activeDeload.returnDayIndex,1);
});
test('verification success clears recovery and restores original cursor',()=>{
 const first=scenario({week:1,day:1});first.invoke('activateDeload','fatigue');
 const verify=scenario({week:3,day:0,activeDeload:{...first.state.activeDeload,phase:'verification',verificationWeekIndex:3}});
 verify.invoke('clearDeload');
 assert.equal(verify.state.week,1);assert.equal(verify.state.day,1);
 assert.equal(verify.state.activeDeload,null);
});
test('failed verification starts a new deload retaining original cursor',()=>{
 const first=scenario({week:1,day:1});first.invoke('activateDeload','fatigue');
 const failed=scenario({week:3,day:0,activeDeload:{...first.state.activeDeload,phase:'verification',verificationWeekIndex:3}});
 failed.invoke('activateDeload','recovery');
 assert.equal(failed.state.activeDeload.returnWeekIndex,1);
 assert.equal(failed.state.activeDeload.returnDayIndex,1);
 assert.equal(failed.state.activeDeload.deloadWeekIndex,2);
});
test('pain recovery remembers the triggering normal day',()=>{
 const s=scenario({week:1,day:1});s.invoke('beginPainRecovery',1);
 assert.equal(s.state.activeDeload.returnWeekIndex,1);
 assert.equal(s.state.activeDeload.returnDayIndex,1);
});
test('legacy verification without saved day does not invent a return day',()=>{
 const s=scenario({week:3,day:0,activeDeload:{programId:'level1',phase:'verification',triggeredAtWeekIndex:1,deloadWeekIndex:2,verificationWeekIndex:3,reason:'fatigue'}});
 s.invoke('clearDeload');assert.equal(s.state.week,3);assert.equal(s.state.day,0);
});
test('verification is not advanced by the ordinary workout cursor',()=>{
 const source=fs.readFileSync(path.join(root,'app/screens/workoutSummary.tsx'),'utf8');
 assert.match(source,/!isVerificationWorkout && workoutSaved && normalWorkoutMayAdvance/);
});

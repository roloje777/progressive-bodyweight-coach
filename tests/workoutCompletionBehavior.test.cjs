/** Behavioural baseline: executes production TypeScript functions with isolated storage stubs. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript'); // Resolve the project's local devDependency
const root=path.resolve(__dirname,'..');
function load(relative,mocks={}){
 const src=fs.readFileSync(path.join(root,relative),'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};
 const context={module,exports:module.exports,require:(id)=>{if(Object.hasOwn(mocks,id))return mocks[id];throw Error('Unexpected import: '+id)},Date,Math,Map,Number,String,Array,console};
 vm.runInNewContext(js,context,{filename:relative});return module.exports;
}
const {calculateWorkoutProgress}=load('utils/workoutProgress.ts');
for(const [done,total,pct] of [[0,12,0],[8,12,67],[10,12,83],[11,12,92],[12,12,100]]){
 test(`real progress function: ${done}/${total} yields ${pct}%`,()=>{
  const p=calculateWorkoutProgress(done,total);
  assert.equal(p.completedSets,done);assert.equal(p.totalSets,total);assert.equal(p.completionPercent,pct);
  assert.equal(p.completedSets===p.totalSets,done===total);
 });
}
function makeRecorder(){
 const writes=[];
 const {recordAbortedWorkout}=load('utils/createAbortAttempt.ts',{'@/storage/abortAttemptStorage':{saveAbortAttempt:async x=>{writes.push(x)}}});
 return {recordAbortedWorkout,writes};
}
function fixture(sets,stage='workout'){
 return {stage,reason:'other',startWorkoutTime:Date.now()-30000,session:{programId:'level1',dayId:'day1',weekIndex:0,dayIndex:0,blocks:[{type:'main',exercises:[{exerciseId:'squat',sets:12}]}],results:{workout:{exercises:[{exerciseId:'squat',sets}]}}}};
}
test('abort before sets records zero-work attempt',async()=>{
 const {recordAbortedWorkout,writes}=makeRecorder();const x=await recordAbortedWorkout(fixture([]));
 assert.equal(x.plannedSets,12);assert.equal(x.completedSets,0);assert.equal(x.completionPercent,0);assert.equal(writes.length,1);assert.equal(writes[0].attemptId,x.attemptId);
});
test('abort after 11 completed sets preserves 92% and reason',async()=>{
 const {recordAbortedWorkout,writes}=makeRecorder();const x=await recordAbortedWorkout(fixture(Array.from({length:11},()=>({status:'completed'}))));
 assert.equal(x.completedSets,11);assert.equal(x.completionPercent,92);assert.equal(x.reason,'other');assert.equal(writes.length,1);
});
test('two attempts on same day get distinct IDs',async()=>{
 const {recordAbortedWorkout,writes}=makeRecorder();const a=await recordAbortedWorkout(fixture([]));const b=await recordAbortedWorkout(fixture([]));
 assert.notEqual(a.attemptId,b.attemptId);assert.equal(writes.length,2);
});
test('pain attempt saves pain reason and stage',async()=>{
 const {recordAbortedWorkout,writes}=makeRecorder();const x=await recordAbortedWorkout({...fixture([{status:'completed'}],'dynamicWarmUp'),reason:'pain'});
 assert.equal(x.reason,'pain');assert.equal(x.stage,'dynamicWarmUp');assert.equal(writes.length,1);
});
test('BASELINE KNOWN RISK: pending sets are currently counted as completed in abort helper',async()=>{
 const {recordAbortedWorkout}=makeRecorder();const x=await recordAbortedWorkout(fixture([{status:'pending'},{status:'completed'},{status:'skipped'}]));
 assert.equal(x.completedSets,2,'Current behaviour counts pending + completed; should be fixed later');
});
test('BASELINE KNOWN RISK: optional recorded sets can increase abort percentage',async()=>{
 const {recordAbortedWorkout}=makeRecorder();const x=await recordAbortedWorkout(fixture(Array.from({length:14},()=>({status:'completed'}))));
 assert.equal(x.plannedSets,12);assert.equal(x.completedSets,14);assert.equal(x.completionPercent,100);
});

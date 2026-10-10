/** Phase 3B: production sessionBuilder execution + prescription handoff assertions. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, mocks) {
  const js = ts.transpileModule(source(file), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(js, {module,exports:module.exports,require:(id)=>{
    if(Object.prototype.hasOwnProperty.call(mocks,id)) return mocks[id];
    throw Error(`Unexpected import ${id} in ${file}`);
  }, console, Date, Math, Object, Array}, {filename:file});
  return module.exports;
}
const state = {setOverrides:{},activatedOptionalExercises:{},pendingRecommendations:{}};
const {buildSession} = load('engine/sessionBuilder.ts', {
  '../data/dynamicWarmUp':{dynamicWarmUp:{title:'Warmup'}},
  '../data/staticStretches':{staticStretches:{title:'Stretch'}},
  '../models/AdaptiveVolume':{EMPTY_ADAPTIVE_PROGRAM_STATE:state,getAdaptiveExerciseKey:(p,d,e)=>`${p}:${d}:${e}`},
  './adapters':{mapWarmupToExercises:()=>[],mapStretchToExercises:()=>[]},
  '../models/WorkoutStatus':{ItemStatus:{Pending:'pending'},WorkoutStatus:{InProgress:'in-progress'}}
});
const program={id:'p',days:[{id:'d',title:'Day',exercises:[
  {exerciseId:'push',sets:3}, {exerciseId:'row',sets:3}, {exerciseId:'dip',sets:2,optional:true}
]}]};
const build=(adaptiveVolume=state,completedSessions=[])=>buildSession(program,0,{includeWarmup:false,includeStretch:false,adaptiveVolume,completedSessions});
const main=(s)=>s.blocks.find(b=>b.type==='main').exercises;
test('production builder excludes unaccepted optional exercise',()=>{
  assert.deepEqual(Array.from(main(build()),e=>e.exerciseId),['push','row']);
});
test('production builder includes accepted optional exercise in live prescription',()=>{
  const activatedOptionalExercises={'p:d:dip':{activatedAtWeekIndex:1}};
  const s=build({...state,activatedOptionalExercises});
  assert.deepEqual(Array.from(main(s),e=>e.exerciseId),['push','row','dip']);
});
test('production builder applies accepted adaptive set overrides before session start',()=>{
  const s=build({...state,setOverrides:{'p:d:push':{sets:5}}});
  assert.equal(main(s)[0].sets,5);
  assert.equal(program.days[0].exercises[0].sets,3,'static program unchanged');
});
test('activated optional first exposure carries adaptive baseline marker',()=>{
  const s=build({...state,activatedOptionalExercises:{'p:d:dip':{activatedAtWeekIndex:1}}});
  assert.equal(main(s)[2].adaptiveBaselineOnly,true);
});
test('activated optional after prior exposure loses baseline-only marker',()=>{
  const s=build({...state,activatedOptionalExercises:{'p:d:dip':{activatedAtWeekIndex:1}}},
    [{programId:'p',dayId:'d',weekIndex:1,exercises:[{exerciseId:'dip',sets:[{}]}]}]);
  assert.notEqual(main(s)[2].adaptiveBaselineOnly,true);
});
test('overview builds session with adaptive state before creating recovery snapshot',()=>{
  const src=source('app/screens/preWorkoutOverView.tsx');
  assert.match(src,/buildSession\(program, dayIndex, \{[\s\S]*?adaptiveVolume,/);
  assert.ok(src.indexOf('const builtSession = buildSession(')<src.indexOf('await createActiveWorkout('));
  assert.match(src,/createActiveWorkout\(\{[\s\S]*?session: sessionToStart/);
});
test('overview passes same start session through route params even when recovery disabled',()=>{
  const src=source('app/screens/preWorkoutOverView.tsx');
  assert.match(src,/if \(workoutRecoveryConfig\.enabled\) \{\s*await createActiveWorkout/);
  assert.match(src,/session: JSON\.stringify\(sessionToStart\)/);
});
test('active workout snapshot stores live session but lacks separate locked prescription',()=>{
  const src=source('models/WorkoutRecovery.ts');
  const snapshot=src.split('export type ActiveWorkoutSnapshot = {')[1].split('\n};')[0];
  assert.match(snapshot,/session: LiveWorkoutSession/);
  assert.doesNotMatch(snapshot,/prescriptionSnapshot\s*:/);
});
test('session builder is not an immutable prescription snapshot',()=>{
  const s=build();
  assert.equal(Object.isFrozen(s),false);
  assert.equal(Object.isFrozen(main(s)),false);
});

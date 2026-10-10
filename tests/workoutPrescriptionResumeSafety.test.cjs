const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const db = new Map();
const writes = [];
const storage = {
  getItem: async k => db.get(k) ?? null,
  setItem: async (k,v) => { writes.push(['set',k]); db.set(k,v); },
  removeItem: async k => { writes.push(['remove',k]); db.delete(k); },
};
function load(file, mocks={}) {
  const js = ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(js, {module,exports:module.exports,require:id=>{if(id in mocks)return mocks[id];throw Error('Unexpected import '+id)},Object,Array,Map,Set,JSON,Number,String,Error,console}, {filename:file});
  return module.exports;
}
const policy = load('utils/WorkoutCompletionPolicy.ts');
const api = load('storage/workoutPrescriptionStorage.ts', {'@react-native-async-storage/async-storage':{default:storage,...storage},'../utils/WorkoutCompletionPolicy':policy});
const id = {programId:'level1',weekIndex:1,dayIndex:2,startWorkoutTime:1720000000000};
const session = sets => ({dayIndex:2,blocks:[{type:'main',exercises:[{exerciseId:'pushup',sets},{exerciseId:'row',sets:3}]}]});
const make = (sets=3, identity=id) => api.lockWorkoutPrescription({...identity,session:session(sets)});
function reset(){db.clear();writes.length=0;}
test('resume with exact identity loads original locked prescription', async()=>{
  reset(); await api.saveLockedWorkoutPrescription(make());
  const result=await api.loadLockedWorkoutPrescription(id);
  assert.equal(result.prescription.requiredSets,6);
  assert.equal(result.startWorkoutTime,id.startWorkoutTime);
});
test('resume never re-derives denominator from mutated current session', async()=>{
  reset(); await api.saveLockedWorkoutPrescription(make());
  const modified=make(7);
  assert.equal(modified.prescription.requiredSets,10);
  assert.equal((await api.loadLockedWorkoutPrescription(id)).prescription.requiredSets,6);
  await assert.rejects(api.saveLockedWorkoutPrescription(modified),/changed during workout/);
  assert.equal((await api.loadLockedWorkoutPrescription(id)).prescription.requiredSets,6);
});
test('different workout start time does not reuse old lock', async()=>{
  reset(); await api.saveLockedWorkoutPrescription(make());
  assert.equal(await api.loadLockedWorkoutPrescription({...id,startWorkoutTime:id.startWorkoutTime+1}),null);
});
test('different week or day cannot reuse old lock', async()=>{
  reset(); await api.saveLockedWorkoutPrescription(make());
  assert.equal(await api.loadLockedWorkoutPrescription({...id,weekIndex:0}),null);
  assert.equal(await api.loadLockedWorkoutPrescription({...id,dayIndex:0}),null);
});
test('nonmatching terminal cleanup cannot delete a current lock', async()=>{
  reset(); await api.saveLockedWorkoutPrescription(make()); writes.length=0;
  await api.clearLockedWorkoutPrescription({...id,startWorkoutTime:id.startWorkoutTime+1});
  assert.equal(writes.length,0);
  assert.ok(await api.loadLockedWorkoutPrescription(id));
});
test('matching terminal cleanup removes only the locked record', async()=>{
  reset(); await api.saveLockedWorkoutPrescription(make()); db.set('ACTIVE_WORKOUT_RECOVERY_V2','preserve'); writes.length=0;
  await api.clearLockedWorkoutPrescription(id);
  assert.equal(await api.loadLockedWorkoutPrescription(id),null);
  assert.equal(db.get('ACTIVE_WORKOUT_RECOVERY_V2'),'preserve');
  assert.deepEqual(writes,[['remove','WORKOUT_PRESCRIPTION_V1']]);
});
test('legacy resume with no lock remains unavailable', async()=>{
  reset(); assert.equal(await api.loadLockedWorkoutPrescription(id),null);
  assert.equal(writes.length,0);
});
test('corrupt snapshot cannot be silently deleted by identity cleanup', async()=>{
  reset(); db.set('WORKOUT_PRESCRIPTION_V1','{corrupt');
  await api.clearLockedWorkoutPrescription(id);
  assert.equal(db.get('WORKOUT_PRESCRIPTION_V1'),'{corrupt');
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const db=new Map();
const storage={getItem:async k=>db.get(k)??null,setItem:async(k,v)=>{db.set(k,v)},removeItem:async k=>{db.delete(k)}};
function load(file,mocks={}){
 const js=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(js,{module,exports:module.exports,require:id=>{if(id in mocks)return mocks[id];throw Error('Unexpected import '+id)},Object,Array,Map,Set,JSON,Number,String,Error,console},{filename:file});
 return module.exports;
}
const policy=load('utils/WorkoutCompletionPolicy.ts');
const api=load('storage/workoutPrescriptionStorage.ts',{'@react-native-async-storage/async-storage':{default:storage,...storage},'../utils/WorkoutCompletionPolicy':policy});
const identity={programId:'level1',weekIndex:0,dayIndex:0,startWorkoutTime:123456};
const session=(exercises)=>({dayIndex:0,blocks:[{type:'main',exercises}]});
const ex=[{exerciseId:'pushup',sets:3},{exerciseId:'squat',sets:4}];
function lock(exercises=ex){return api.lockWorkoutPrescription({...identity,session:session(exercises)})}
function reset(){db.clear()}
test('start snapshot includes accepted adaptive exercises and set overrides',()=>{const x=lock([...ex,{exerciseId:'activated',sets:2,optional:true}]);assert.equal(x.prescription.requiredSets,9);assert.equal(x.prescription.required.length,3)});
test('unaccepted optional exercises absent from built session are not invented',()=>{assert.equal(lock().prescription.required.length,2)});
test('stored prescription round trips independently of workout recovery',async()=>{reset();await api.saveLockedWorkoutPrescription(lock());const v=await api.loadLockedWorkoutPrescription(identity);assert.equal(v.prescription.requiredSets,7)});
test('same identity and same prescription is idempotent',async()=>{reset();await api.saveLockedWorkoutPrescription(lock());await api.saveLockedWorkoutPrescription(lock());assert.equal(db.size,1)});
test('same identity cannot silently change prescribed sets',async()=>{reset();await api.saveLockedWorkoutPrescription(lock());await assert.rejects(api.saveLockedWorkoutPrescription(lock([{exerciseId:'pushup',sets:9}])))});
test('resumed session identity mismatch does not receive another session prescription',async()=>{reset();await api.saveLockedWorkoutPrescription(lock());assert.equal(await api.loadLockedWorkoutPrescription({...identity,startWorkoutTime:999}),null)});
test('legacy session with no snapshot is unavailable',async()=>{reset();assert.equal(await api.loadLockedWorkoutPrescription(identity),null)});
test('corrupt and unsupported stored versions fail closed',async()=>{reset();db.set('WORKOUT_PRESCRIPTION_V1','{broken');assert.equal(await api.loadLockedWorkoutPrescription(identity),null);db.set('WORKOUT_PRESCRIPTION_V1',JSON.stringify({...lock(),schemaVersion:99}));assert.equal(await api.loadLockedWorkoutPrescription(identity),null)});
test('completed sets cannot mutate frozen in-memory denominator',()=>{const x=lock();assert.equal(Object.isFrozen(x.prescription.required),true);assert.equal(x.prescription.requiredSets,7)});
test('no main block is rejected, including guided recovery only',()=>{assert.throws(()=>api.lockWorkoutPrescription({...identity,session:{dayIndex:0,blocks:[{type:'stretch',exercises:[]}]}}))});
test('duplicate required exercise identifiers are rejected',()=>{assert.throws(()=>lock([{exerciseId:'same',sets:2},{exerciseId:'same',sets:2}]))});
test('matching cleanup clears, nonmatching cleanup preserves',async()=>{reset();await api.saveLockedWorkoutPrescription(lock());await api.clearLockedWorkoutPrescription({...identity,startWorkoutTime:1});assert.equal(db.size,1);await api.clearLockedWorkoutPrescription(identity);assert.equal(db.size,0)});

test('different active workout cannot overwrite existing lock',async()=>{reset();await api.saveLockedWorkoutPrescription(lock());const other=api.lockWorkoutPrescription({...identity,startWorkoutTime:999,session:session(ex)});await assert.rejects(api.saveLockedWorkoutPrescription(other),/already locked/);assert.equal((await api.loadLockedWorkoutPrescription(identity)).prescription.requiredSets,7)});

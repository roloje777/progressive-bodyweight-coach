const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  const abs = path.resolve(root, file);
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = fs.readFileSync(abs, 'utf8');
  const js = ts.transpileModule(src, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  const mod = new Module(abs, module);
  mod.filename = abs;
  mod.paths = Module._nodeModulePaths(path.dirname(abs));
  cache.set(abs, mod);
  mod.require = (id) => id.startsWith('./') && id.includes('WorkoutCompletionPolicy')
    ? load('utils/WorkoutCompletionPolicy.ts') : require(id);
  mod._compile(js, abs);
  return mod.exports;
}
const {observeWorkoutSummary: observe} = load('utils/workoutCompletionObservation.ts');
const prescribed = [{exerciseId:'push',sets:6},{exerciseId:'pull',sets:6}];
const performed = (a,b) => [{exerciseId:'push',sets:Array.from({length:6},(_,i)=>({status:i<a?'completed':'pending'}))},{exerciseId:'pull',sets:Array.from({length:6},(_,i)=>({status:i<b?'completed':'pending'}))}];
const run = (a,b,overrides={}) => observe({prescribed,performed:performed(a,b),mode:'normal',outcome:'finished',existingCompletedFlag:a+b===12,...overrides});
test('summary observation: 0/12 detects provisional advancement disagreement',()=>{const r=run(0,0);assert.equal(r.status,'provisional');assert.equal(r.proposed.advanceDay,false);assert.equal(r.disagreement,true)});
test('summary observation: 8/12 detects provisional advancement disagreement',()=>{assert.equal(run(4,4).disagreement,true)});
test('summary observation: 11/12 with primary coverage is proposed candidate',()=>{const r=run(6,5);assert.equal(r.proposed.advanceDay,true);assert.equal(r.disagreement,false)});
test('summary observation: 12/12 agrees with current cursor advancement',()=>{assert.equal(run(6,6).disagreement,false)});
test('summary observation: primary skipped blocks despite 50% sets',()=>{assert.ok(run(6,0).proposed.reasons.includes('primary_exercise_missing'))});
test('summary observation: abort blocks advancement',()=>{assert.equal(run(6,6,{outcome:'aborted'}).proposed.advanceDay,false)});
test('summary observation: verification needs full prescription and pass',()=>{assert.equal(run(6,5,{mode:'verification',verificationPassed:true}).proposed.advanceDay,false);assert.equal(run(6,6,{mode:'verification',verificationPassed:true}).proposed.advanceDay,true)});
test('summary observation: no prescription is unavailable, not an invented zero-set snapshot',()=>{assert.equal(run(0,0,{prescribed:[]}).status,'unavailable')});
test('summary observation: duplicate IDs unavailable',()=>{assert.equal(run(0,0,{prescribed:[{exerciseId:'x',sets:1},{exerciseId:'x',sets:1}]}).status,'unavailable')});
test('summary observation: pending sets never count as completed',()=>{assert.equal(run(2,1).proposed.requiredCompletedSets,3)});

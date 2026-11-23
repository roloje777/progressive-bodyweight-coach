const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.resolve(__dirname, '../utils/normalizeExercises.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleObj = { exports: {} };
const warnings = [];
vm.runInNewContext(compiled, {
  module: moduleObj, exports: moduleObj.exports,
  require() { throw new Error('Unexpected runtime dependency'); },
  console: { warn: (...args) => warnings.push(args) },
}, { filename: 'normalizeExercises.ts' });
const { normalizeWarmupExercise } = moduleObj.exports;

test('Jumping Jacks time warm-up is parsed as 30 seconds without warning', () => {
  warnings.length = 0;
  const result = normalizeWarmupExercise({
    id: 'jumping-jacks', name: 'Jumping Jacks', type: 'time', sets: 1,
    config: { durationSeconds: 30 },
  });
  assert.equal(result.secondsPerSet, 30);
  assert.equal(result.category, 'warmup');
  assert.equal(result.sets, 1);
  assert.equal(warnings.length, 0);
});

test('legacy hold warm-up remains supported', () => {
  warnings.length = 0;
  assert.equal(normalizeWarmupExercise({id:'hold', name:'Hold', type:'hold', config:{durationSeconds:25}}).secondsPerSet, 25);
  assert.equal(warnings.length, 0);
});

test('reps warm-up behavior remains unchanged', () => {
  warnings.length = 0;
  assert.equal(normalizeWarmupExercise({id:'reps', name:'Reps', type:'reps', config:{minReps:8,maxReps:12}}).secondsPerSet, 30);
  assert.equal(warnings.length, 0);
});

test('unrecognized warm-up types still produce diagnostic warnings', () => {
  warnings.length = 0;
  assert.equal(normalizeWarmupExercise({id:'bad', name:'Bad', type:'unknown', config:{}}).secondsPerSet, 0);
  assert.equal(warnings.length, 1);
});

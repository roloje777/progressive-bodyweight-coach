const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('returning to the current normal-training day is not blocked by old completed marker', () => {
  const src = read('context/ProgressContext.tsx');
  const fn = src.slice(src.indexOf('const getDayStatus ='), src.indexOf('// CAN OPEN DAY'));
  assert.ok(fn.indexOf('if (dayIndex === day)') < fn.indexOf('storedProgress?.completed === true'));
  assert.match(fn, /isPainRecoveryScheduleActive/);
});

test('progress writes are serialized and reads await pending writes', () => {
  const src = read('storage/progressStorage.ts');
  assert.match(src, /pendingWrite\.catch\(\(\) => undefined\)\.then/);
  assert.match(src, /await pendingWrite\.catch\(\(\) => undefined\)/);
});

test('suggested normal-training return waits for restored cursor before navigation', () => {
  const src = read('app/(tabs)/index.tsx');
  assert.match(src, /week !== earlyNormalWorkout\.week \|\| day !== earlyNormalWorkout\.day/);
  assert.match(src, /setEarlyNormalWorkout\(\{ week: savedReturnWeek!, day: savedReturnDay! \}\)/);
});

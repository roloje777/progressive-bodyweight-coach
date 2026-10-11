const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app/screens/workoutSummary.tsx'), 'utf8');
test('3M: completion decision is obtained before save and lock cleanup', () => {
  assert.ok(source.indexOf('const completionObservation = await observeLockedWorkoutCompletion(') < source.indexOf('const workoutSaved = await saveWorkoutSession('));
  assert.ok(source.indexOf('const completionObservation = await observeLockedWorkoutCompletion(') < source.indexOf('await clearLockedWorkoutPrescription('));
});
test('3M: normal cursor requires saved workout and qualifying locked prescription', () => {
  assert.match(source, /completionObservation\.status === "available" &&\s*completionObservation\.proposed\?\.advanceDay === true/);
  assert.match(source, /isDeloadWorkout \|\| isVerificationWorkout \|\| \(workoutSaved && normalWorkoutMayAdvance\)/);
});
test('3M: retains cursor and reports failed normal gate', () => {
  assert.match(source, /\[PBH completion gate\] normal_cursor_retained/);
  assert.equal((source.match(/\bcompleteWorkout\(\);/g) || []).length, 1);
});

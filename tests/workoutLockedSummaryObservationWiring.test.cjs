const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const summary = fs.readFileSync(path.join(__dirname, '../app/screens/workoutSummary.tsx'), 'utf8');
const helper = fs.readFileSync(path.join(__dirname, '../utils/observeLockedWorkoutCompletion.ts'), 'utf8');
test('locked observer is invoked before save and terminal cleanup', () => {
  assert(summary.indexOf('await observeLockedWorkoutCompletion(') < summary.indexOf('await saveWorkoutSession(completedSession)'));
  assert(summary.indexOf('await observeLockedWorkoutCompletion(') < summary.indexOf('await clearLockedWorkoutPrescription('));
});
test('3M: observation runs outside development and gates normal cursor advancement', () => {
  assert.match(summary, /const completionObservation = await observeLockedWorkoutCompletion\(/);
  assert.match(summary, /if \(__DEV__\) \{\s*if \(completionObservation\.status === "unavailable"\)/);
  assert.match(summary, /completionObservation\.status === "available" &&\s*completionObservation\.proposed\?\.advanceDay === true/);
  assert.match(summary, /isDeloadWorkout \|\| isVerificationWorkout \|\| \(workoutSaved && normalWorkoutMayAdvance\)/);
  assert.match(summary, /completeWorkout\(\)/);
});
test('observer loads original lock instead of reconstructing from current main block', () => {
  assert.match(helper, /await loadLockedWorkoutPrescription\(identity\)/);
  assert.doesNotMatch(helper, /createPrescriptionSnapshot/);
});
test('untrusted or duplicate result exercise IDs fail closed', () => {
  assert.match(helper, /seen\.has\(result\.exerciseId\)/);
  assert.match(helper, /ambiguous_results/);
});
test('pending sets are not counted and verification is conservatively pending', () => {
  assert.match(helper, /s\?\.status === 'completed'/);
  assert.match(summary, /verificationPassed: false/);
});

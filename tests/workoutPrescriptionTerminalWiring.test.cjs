const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const workout = fs.readFileSync(path.join(__dirname, '../app/screens/workout.tsx'), 'utf8');
const summary = fs.readFileSync(path.join(__dirname, '../app/screens/workoutSummary.tsx'), 'utf8');

test('abort cleanup follows persisted attempt and recovery cleanup', () => {
  const begin = workout.indexOf('const confirmAbort = async');
  const end = workout.indexOf('const handlePainInterruption', begin);
  const body = workout.slice(begin, end);
  assert.ok(body.indexOf('await recordAbortedWorkout(') < body.indexOf('await clearActiveWorkout()'));
  assert.ok(body.indexOf('await clearActiveWorkout()') < body.indexOf('await clearLockedWorkoutPrescription('));
  assert.ok(body.indexOf('await clearLockedWorkoutPrescription(') < body.indexOf('router.replace("/")'));
});

test('pain interruption cleanup follows persisted attempt', () => {
  const begin = workout.indexOf('const handlePainInterruption');
  const end = workout.indexOf('router.replace({', begin);
  const body = workout.slice(begin, end);
  assert.ok(body.indexOf('await recordAbortedWorkout(') < body.indexOf('await clearActiveWorkout()'));
  assert.ok(body.indexOf('await clearActiveWorkout()') < body.indexOf('await clearLockedWorkoutPrescription('));
});

test('summary cleanup is conditional on successful session save', () => {
  const begin = summary.indexOf('if (workoutSaved) {');
  const end = summary.indexOf('console.log("FINAL WORKOUT DATA:', begin);
  const body = summary.slice(begin, end);
  assert.match(body, /await clearLockedWorkoutPrescription\(/);
  assert.ok(body.indexOf('await clearActiveWorkout(') < body.indexOf('await clearLockedWorkoutPrescription('));
});

test('all terminal cleanup paths use complete workout identity and isolate cleanup failures', () => {
  for (const text of [workout, summary]) {
    assert.match(text, /weekIndex:/);
    assert.match(text, /dayIndex/);
    assert.match(text, /startWorkoutTime/);
    assert.match(text, /catch \(error\)/);
  }
});

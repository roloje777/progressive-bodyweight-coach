const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const summary = read('app/screens/workoutSummary.tsx');
const progression = read('engine/ProgressEngine.ts');
test('progression engine no longer floods logs with per-set raw JSON and config dumps', () => {
  assert.doesNotMatch(progression, /console\.log\s*\(/);
  assert.doesNotMatch(summary, /Final Session Results:|FINAL WORKOUT DATA:|WorkoutSummary params:/);
});
test('MB diagnostic is development-only, de-duplicated and reports target, actual, skipped and candidate floor', () => {
  assert.match(summary, /if \(!__DEV__\) return;/);
  assert.match(summary, /mbTraceFingerprint\.current === fingerprint/);
  assert.match(summary, /\[PBH MB diagnostic\]/);
  assert.match(summary, /candidateNext: target\.target != null && actual != null/);
  assert.match(summary, /actual: actual \?\? "skipped\/unavailable"/);
  assert.match(summary, /eligibleTargets: feedbackMatchOrBeatPerformance\.applicableTargets/);
});
test('MB diagnostics include scheduled optional exercises but exclude baseline-only targets', () => {
  assert.match(summary, /\(mainBlock\?\.exercises \?\? \[\]\)\.map/);
  assert.match(summary, /configuredExercise\.adaptiveBaselineOnly\s*\? \[\]/);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const engine = read('engine/MatchOrBeatEngine.ts');
const summary = read('app/screens/workoutSummary.tsx');
const scoring = read('engine/WorkoutFeedbackEngine.ts');
test('per-set history retains strongest eligible value, not latest weaker value', () => {
  assert.match(engine, /let floor: number \| null = null/);
  assert.match(engine, /Math\.max\(floor \?\? 0, value\)/);
  assert.match(engine, /if \(!isValidHistoricalMBSource\(workout\)\) continue/);
});
test('skipped historical sets cannot replace next-week target', () => {
  assert.match(engine, /if \(set\.status === "skipped"\)/);
  assert.match(engine, /if \(value != null && value > 0\) floor/);
});
test('score includes scheduled exercise positions missing from result, including optional exercises', () => {
  assert.match(summary, /for \(const configuredExercise of mainBlock\?\.exercises \?\? \[\]\)/);
  assert.match(summary, /completedExercise\?\.sets \?\? \[\]/);
  assert.match(summary, /length: Math\.max\(0, Number\(configuredExercise\.sets\) \|\| 0\)/);
  assert.match(scoring, /applicableCount > 0\s*\? metTargets \/ applicableCount/);
});
test('baseline-only optional exercises are not falsely scored as failed MB targets', () => {
  assert.match(summary, /configuredExercise\.adaptiveBaselineOnly\s*\? \[\]/);
});

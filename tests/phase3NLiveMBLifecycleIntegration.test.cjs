const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const policySource = fs.readFileSync(path.join(__dirname, '../engine/WorkoutOutcomePolicy.ts'), 'utf8');
const policyJS = ts.transpileModule(policySource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const policy = { exports: {} };
new Function('module', 'exports', policyJS)(policy, policy.exports);
const decide = policy.exports.evaluateWorkoutOutcome;
const base = { prescriptionCompleted: true, jointDiscomfort: false, applicableTargets: 13, metTargets: 0, rating: 3 };
const outcome = (metTargets, rating, extra = {}) => decide({ ...base, metTargets, rating, ...extra });

test('live scenario: 8/13 rating 2 enters deload (not advisory retry)', () => {
  const decision = outcome(8, 2);
  assert.equal(decision.outcome, 'deload_verification');
  assert.equal(decision.completedProgramDay, true); // classification only: not an advancing program day
});
test('live scenario: 7/13 rating 3 enters deload, never Day 2', () => {
  assert.equal(outcome(7, 3).outcome, 'deload_verification');
});
test('live scenario: 12/13 rating 2 advances with recovery guidance', () => {
  const decision = outcome(12, 2);
  assert.equal(decision.outcome, 'recovery_evaluation');
  assert.equal(decision.completedProgramDay, true);
});
test('skipped target-bearing sets do not block MB pass when 80%+ achieved', () => {
  assert.equal(outcome(11, 4).outcome, 'readiness_evaluation');
});
test('pain overrides even 13/13', () => {
  assert.equal(outcome(13, 5, { jointDiscomfort: true }).outcome, 'pain_coach');
});
test('first baseline exposure is not a fabricated 0% failure', () => {
  const decision = outcome(0, 3, { applicableTargets: 0 });
  assert.equal(decision.outcome, 'baseline_or_unavailable');
  assert.equal(decision.mbSuccessRate, null);
});
test('summary connects MB policy to saved attempt and gates lifecycle by policy, not proposedAdvance', () => {
  const source = fs.readFileSync(path.join(__dirname, '../app/screens/workoutSummary.tsx'), 'utf8');
  assert.match(source, /evaluateWorkoutOutcome\(\{/);
  assert.match(source, /applicableTargets: feedbackMatchOrBeatPerformance\.applicableTargets/);
  assert.match(source, /metTargets: feedbackMatchOrBeatPerformance\.metTargets/);
  assert.match(source, /normalOutcome\.outcome !== "deload_verification"/);
  assert.match(source, /normalOutcome\?\.outcome === "mandatory_recovery_retry"/);
  assert.match(source, /await saveCalendarRecovery\(\{/);
  assert.match(source, /normalOutcome\?\.outcome === "deload_verification"/);
  assert.match(source, /activateDeload\("recovery"\)/);
  assert.match(source, /if \(!normalWorkoutMayAdvance\) \{/);
  assert.match(source, /advanceDay: normalWorkoutMayAdvance/);
  assert.doesNotMatch(source, /const normalWorkoutMayAdvance\s*=\s*completionObservation\.status/);
});

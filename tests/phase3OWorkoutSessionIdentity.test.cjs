const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('new workout receives one crypto UUID before prescription and recovery capture', () => {
  const start = read('app/screens/preWorkoutOverView.tsx');
  assert.match(start, /const workoutSessionId = randomUUID\(\)/);
  assert.match(start, /sessionToStart[^;]+workoutSessionId = workoutSessionId/);
  assert.match(start, /lockWorkoutPrescription\(\{[\s\S]*?workoutSessionId,/);
  assert.match(start, /createActiveWorkout\(\{[\s\S]*?workoutSessionId,/);
});

test('prescription storage enforces UUID equality and retains legacy composite identity', () => {
  const storage = read('storage/workoutPrescriptionStorage.ts');
  assert.match(storage, /old\.workoutSessionId === snapshot\.workoutSessionId/);
  assert.match(storage, /stored\.workoutSessionId !== identity\.workoutSessionId/);
  assert.match(storage, /old\.startWorkoutTime !== Number\(startWorkoutTime\)/);
});

test('pain and ordinary abort persist attempt before releasing prescription in all three stages', () => {
  for (const screen of ['workout', 'dynamicWarmUp', 'staticStretch']) {
    const source = read(`app/screens/${screen}.tsx`);
    assert.match(source, /await recordAbortedWorkout\(/);
    assert.match(source, /await clearActiveWorkout\(\)/);
    assert.match(source, /clearLockedWorkoutPrescription|clearPrescriptionForAbortedSession/);
  }
});

test('aborted attempts retain UUID for distinct repeated pain attempts', () => {
  assert.match(read('models/AbortAttempt.ts'), /workoutSessionId\?: string/);
  assert.match(read('utils/createAbortAttempt.ts'), /workoutSessionId: session\.workoutSessionId/);
});

test('resume retains original UUID and does not synthesize a prescription', () => {
  const resume = read('app/screens/workoutRecovery.tsx');
  assert.match(resume, /workoutSessionId: resumed\.workoutSessionId/);
  assert.match(read('utils/workoutPrescriptionResumeCheck.ts'), /locked\.workoutSessionId === identity\.workoutSessionId/);
  assert.doesNotMatch(resume, /saveLockedWorkoutPrescription\(/);
});

test('reconciliation preserves active and unknown snapshots', () => {
  const reconciliation = read('utils/reconcileStaleWorkoutPrescription.ts');
  assert.match(reconciliation, /active\.status !== 'none'/);
  assert.match(reconciliation, /preserved_active_or_unknown/);
  assert.match(reconciliation, /old\.workoutSessionId === next\.workoutSessionId/);
});

test('Pain Week and Medical Recovery checks precede normal workout start', () => {
  const overview = read('app/screens/preWorkoutOverView.tsx');
  const start = overview.indexOf('const startWorkoutTime = Date.now()');
  assert.ok(overview.indexOf('getActivePainWeek()', 0) >= 0);
  assert.ok(overview.indexOf('getActivePainWeek()', 0) < start);
  assert.ok(overview.indexOf('getActiveMedicalRecovery()', 0) < start);
});

// Regression: UUID must survive into the locked completion observer, not only cleanup.
test('normal summary evaluates completion against the same UUID-locked prescription', () => {
  const summary = read('app/screens/workoutSummary.tsx');
  const observer = read('utils/observeLockedWorkoutCompletion.ts');
  assert.match(summary, /observeLockedWorkoutCompletion\(\{[\s\S]*?identity:\s*\{[\s\S]*?workoutSessionId:\s*session\.workoutSessionId,[\s\S]*?\},\s*results:/);
  assert.match(observer, /type Identity = \{[^}]*workoutSessionId\?: string/);
  assert.match(observer, /loadLockedWorkoutPrescription\(identity\)/);
});

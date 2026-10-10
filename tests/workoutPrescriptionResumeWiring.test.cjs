const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const screen = fs.readFileSync(path.join(__dirname, '../app/screens/workoutRecovery.tsx'), 'utf8');
test('resume reads exact original identity before navigation', () => {
  const start = screen.indexOf('const resumed = await resumeActiveWorkout()');
  const load = screen.indexOf('await loadLockedWorkoutPrescription(identity)', start);
  const route = screen.indexOf('router.replace({', start);
  assert.ok(start >= 0 && load > start && route > load);
  for (const field of ['programId', 'weekIndex', 'dayIndex', 'startWorkoutTime']) assert.match(screen, new RegExp(`${field}: resumed\\.${field}`));
});
test('missing lock cannot block resume', () => {
  assert.match(screen, /catch \(error\) \{[\s\S]*?\}\s*const pathname =/);
});
test('resume never creates or replaces a lock', () => {
  assert.doesNotMatch(screen, /saveLockedWorkoutPrescription|lockWorkoutPrescription/);
});

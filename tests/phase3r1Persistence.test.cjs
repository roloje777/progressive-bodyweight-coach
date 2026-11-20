const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
test('abort persistence serializes writes and deduplicates by session', () => {
  const s = read('storage/abortAttemptStorage.ts');
  assert.match(s, /let pending: Promise<void>/);
  assert.match(s, /attempt\.workoutSessionId && a\.workoutSessionId === attempt\.workoutSessionId/);
  assert.match(read('utils/createAbortAttempt.ts'), /`abort-\$\{session\.workoutSessionId\}`/);
});
test('medical assessment saves timestamp at submission and serializes history changes', () => {
  assert.match(read('app/screens/medicalRecovery.tsx'), /saveMedicalRecoveryAssessment\(\{ \.\.\.assessment, recordedAt: new Date\(\)\.toISOString\(\) \}\)/);
  const s = read('storage/medicalRecoveryStorage.ts');
  assert.match(s, /pendingAssessments/);
  assert.match(s, /a\.episodeId === value\.episodeId && a\.recordedAt === value\.recordedAt/);
});
test('pain coach decisions persist with answers and outcome', () => {
  const s = read('app/screens/painCoach.tsx');
  for (const outcome of ['medical-recovery', 'pain-week', 'continue']) assert.ok(s.includes(`saveTriage("${outcome}")`));
  assert.match(read('storage/painTriageHistoryStorage.ts'), /PBH_PAIN_TRIAGE_HISTORY_V1/);
});

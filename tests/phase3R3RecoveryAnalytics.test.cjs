const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const analytics = fs.readFileSync(path.join(root, 'utils/recoveryAnalytics.ts'), 'utf8');
const screen = fs.readFileSync(path.join(root, 'app/screens/recoveryAnalytics.tsx'), 'utf8');
const history = fs.readFileSync(path.join(root, 'app/screens/recoveryHistory.tsx'), 'utf8');
test('Recovery History links to read-only analytics screen', () => {
  assert.match(history, /router\.push\("\/screens\/recoveryAnalytics"\)/);
  assert.match(screen, /useFocusEffect/);
});
test('analytics uses four existing persisted sources and explicit medical allowlist', () => {
  for (const source of ['getAbortAttempts', 'loadPainTriageHistory', 'loadPainWeekEpisodes', 'loadMedicalRecoveryAssessments']) assert.ok(screen.includes(source));
  assert.match(screen, /const safeMedical = assessments\.map/);
  assert.doesNotMatch(analytics, /["'](?:treatment|notes|consultationDate)["']/);
  assert.doesNotMatch(screen, /\ba\.treatment\b|\ba\.notes\b/);
});
test('analytics performs no persistence writes or progression changes', () => {
  for (const source of [analytics, screen]) assert.doesNotMatch(source, /AsyncStorage\.setItem|savePain|saveMedical|completeWorkout|activateDeload|beginMedicalRecovery|fetch\(/);
});
test('analytics reports separate event categories and supports date windows', () => {
  for (const key of ['abortReasons', 'abortStages', 'triageOutcomes', 'painWeekStatuses', 'medicalEpisodes', 'dailyCheckIns']) assert.ok(analytics.includes(key));
  assert.match(analytics, /"all" \| "30" \| "90"/);
  assert.match(screen, /Counts across sections must not be added together/);
});

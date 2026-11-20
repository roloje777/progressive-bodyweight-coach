const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const screen = fs.readFileSync(path.join(root, 'app/screens/recoveryHistory.tsx'), 'utf8');
const history = fs.readFileSync(path.join(root, 'app/(tabs)/history.tsx'), 'utf8');
test('history links to dedicated read-only recovery history', () => {
  assert.match(history, /router\.push\("\/screens\/recoveryHistory"\)/);
  assert.match(screen, /useFocusEffect/);
  assert.doesNotMatch(screen, /saveMedicalRecoveryAssessment|savePainWeekEpisode|savePainTriageRecord|saveAbortAttempt/);
});
test('four persisted record sources and filters are represented', () => {
  for (const name of ['getAbortAttempts','loadPainTriageHistory','loadPainWeekEpisodes','loadMedicalRecoveryAssessments']) assert.match(screen, new RegExp(name));
  for (const kind of ['abort','triage','pain-week','medical']) assert.ok(screen.includes(`value: "${kind}"`));
});
test('private medical details are opt-in and not part of analytics', () => {
  assert.match(screen, /privateDetails/);
  assert.match(screen, /showPrivate === item\.id/);
  assert.doesNotMatch(screen, /analyticsStorage|saveAnalytics|trackEvent/);
});
test('existing workout export screen remains untouched by recovery history', () => {
  assert.match(history, /\/screens\/workoutDetail/);
});

test('workout summary exports import their implementation and format types', () => {
  assert.match(history, /import \{ exportWorkoutHistorySummary, type WorkoutHistoryCategory \} from "@\/utils\/workoutHistorySummaryExport"/);
  assert.match(history, /import type \{ WorkoutExportFormat \} from "@\/utils\/workoutExport"/);
});

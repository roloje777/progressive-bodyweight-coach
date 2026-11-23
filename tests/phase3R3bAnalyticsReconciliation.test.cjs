const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p, 'utf8');
test('dashboard loads persisted abort and triage sources', () => {
 const s=read('hooks/useAnalytics.ts');
 assert.match(s,/getAbortAttempts\(\)/);
 assert.match(s,/loadPainTriageHistory\(\)/);
 assert.match(s,/buildRecoveryAnalytics\(\{ completedSessions, abortAttempts, painTriages, range \}\)/);
});
test('recovery summary separates pain aborts, fatigue aborts, and triage assessments', () => {
 const s=read('engine/analytics/RecoveryAnalyticsEngine.ts');
 assert.match(s,/abort\.reason === "pain"/);
 assert.match(s,/abort\.reason === "fatigue"/);
 assert.match(s,/painOccurrences: painOccurrences \+ uniquePainAborts\.size/);
 assert.match(s,/painCoachAssessments: uniqueTriages/);
 assert.doesNotMatch(s,/medicalRecoveryAssessments|treatment|\.notes/);
});
test('main dashboard displays new counts and existing metrics', () => {
 const s=read('app/(tabs)/analytics.tsx');
 assert.match(s,/recovery\.painCoachAssessments/);
 assert.match(s,/recovery\.fatigueAbortOccurrences/);
 assert.match(s,/recovery\.painOccurrences/);
});
test('history routes have no stack headers and remain navigable', () => {
 const s=read('app/_layout.tsx');
 assert.match(s,/name="screens\/recoveryHistory" options=\{\{ headerShown: false \}\}/);
 assert.match(s,/name="screens\/recoveryAnalytics" options=\{\{ headerShown: false \}\}/);
 assert.match(read('app/(tabs)/history.tsx'),/\/screens\/recoveryHistory/);
 assert.match(read('app/screens/recoveryHistory.tsx'),/\/screens\/recoveryAnalytics/);
});

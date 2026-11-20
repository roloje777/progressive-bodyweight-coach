const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p,'utf8');
const pain = read('app/screens/painCoach.tsx');
const medical = read('app/screens/medicalRecovery.tsx');
const policy = read('engine/PainMedicalTriagePolicy.ts');
test('normal workout pain abort routes to the same Pain Coach triage', () => {
  assert.match(read('app/screens/workout.tsx'), /reason: "pain"/);
  assert.match(read('app/screens/workout.tsx'), /pathname: "\/screens\/painCoach"/);
  assert.match(pain, /requiresMedicalRecovery/);
  assert.match(pain, /medicalRequired &&/);
});
test('severe, worsening or warning-sign symptoms independently require medical recovery', () => {
  for (const key of ['severePain', 'worseningPain', 'warningSigns']) assert.match(policy, new RegExp(`a\\.${key} === true`));
  assert.match(pain, /handleEnterMedicalRecovery/);
});
test('medical hold persists and workout entry checks it regardless of rest settings', () => {
  const storage = read('storage/medicalRecoveryStorage.ts');
  assert.match(storage, /PBH_MEDICAL_RECOVERY_ACTIVE_V1/);
  assert.match(read('app/(tabs)/index.tsx'), /await getActiveMedicalRecovery\(\)/);
  assert.match(read('app/screens/preWorkoutOverView.tsx'), /await getActiveMedicalRecovery\(\)/);
  assert.match(pain, /await getActiveMedicalRecovery\(\)/);
});
test('no clearance blocks Deload; clearance alone cannot bypass symptom checks', () => {
  const rules = read('engine/MedicalRecoveryPolicy.ts');
  assert.match(rules, /!a.medicalClearanceConfirmed/);
  assert.match(rules, /a.symptoms !== "resolved"/);
  assert.match(rules, /a.painScore !== 0/);
  assert.match(rules, /a.warningSigns/);
  assert.match(medical, /decision === "ready-for-deload" &&/);
});
test('approved assessment is saved before Deload and safety hold release', () => {
  const save = medical.indexOf('await saveMedicalRecoveryAssessment(');
  const start = medical.indexOf('beginPainRecovery(week)');
  const release = medical.indexOf('await completeMedicalRecovery(assessment.episodeId)');
  assert.ok(save !== -1 && save < start && start < release);
  assert.match(medical, /if \(!proceed\) await saveMedicalRecoveryAssessment\(/);
  assert.match(medical, /if \(proceed && !approvedAndSaved\)/);
  assert.match(medical, /if \(!started\) throw new Error/);
});
test('verification pain abort re-enters Pain Coach and preserves normal cursor', () => {
  assert.match(read('app/screens/workout.tsx'), /interruptionDuringRecovery:/);
  assert.match(pain, /interruptionDuringRecovery/);
  assert.match(pain, /beginPainWeekEpisode/);
  assert.match(read("app/screens/painWeek.tsx"), /beginPainRecovery\(episode.originalWeekIndex\)/);
  const ctx = read('context/ProgressContext.tsx');
  assert.match(ctx, /activeDeload\.returnWeekIndex != null/);
  assert.match(ctx, /activeDeload\.returnDayIndex != null/);
});
test('warmup, workout and stretch pain interruption share Pain Coach', () => {
  for (const file of ['dynamicWarmUp.tsx','workout.tsx','staticStretch.tsx'])
    assert.match(read(`app/screens/${file}`), /pathname: "\/screens\/painCoach"/);
});

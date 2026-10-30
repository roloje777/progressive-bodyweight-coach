const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
test('ordinary pain enters persistent Pain Week instead of directly entering Deload', () => {
 const coach=read('app/screens/painCoach.tsx');
 assert.match(coach,/beginPainWeekEpisode/);
 assert.match(coach,/router\.replace\("\/screens\/painWeek"\)/);
});
test('home and pre-workout route to Pain Week while medical recovery takes priority', () => {
 for(const file of ['app/(tabs)/index.tsx','app/screens/preWorkoutOverView.tsx']) {
  const s=read(file); assert.match(s,/getActiveMedicalRecovery/); assert.match(s,/getActivePainWeek/);
 }
});
test('daily and final assessment are separate; final requires saved daily and early acknowledgement', () => {
 const s=read('app/screens/painWeek.tsx');
 for(const marker of ['savePainWeekDailyAssessment','assessFinalPainWeek','earlyReturnAcknowledged: early','savedDaily','savedFinal','beginPainRecovery','completePainWeekEpisode']) assert.ok(s.includes(marker),marker);
});
test('pain escalation closes ordinary Pain Week and enters Medical Recovery', () => {
 const s=read('app/screens/painWeek.tsx');
 assert.match(s,/escalatePainWeekEpisode/);assert.match(s,/beginMedicalRecovery/);
});

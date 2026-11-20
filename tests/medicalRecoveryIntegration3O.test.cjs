const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p,'utf8');
test('Medical Recovery persists a separate active safety hold',()=>{
 const s=read('storage/medicalRecoveryStorage.ts');
 assert.match(s,/PBH_MEDICAL_RECOVERY_ACTIVE_V1/);
 assert.match(s,/beginMedicalRecovery/);
 assert.match(s,/completeMedicalRecovery/);
});
test('Home and workout entry both check medical recovery lock',()=>{
 assert.match(read('app/(tabs)/index.tsx'),/await getActiveMedicalRecovery\(\)/);
 assert.match(read('app/screens/preWorkoutOverView.tsx'),/await getActiveMedicalRecovery\(\)/);
});
test('Medical return screen saves assessment before entering Deload and releasing lock',()=>{
 const s=read('app/screens/medicalRecovery.tsx');
 const save=s.indexOf('await saveMedicalRecoveryAssessment(');
 const start=s.indexOf('beginPainRecovery(week)');
 const unlock=s.indexOf('await completeMedicalRecovery(assessment.episodeId)');
 assert.ok(save>=0 && start>save && unlock>start);
 // The UX refinement requires an approved decision AND an explicitly saved assessment.
 assert.match(s,/const approvedAndSaved\s*=\s*decision === "ready-for-deload" && savedApproved/);
 assert.match(s,/if \(proceed && !approvedAndSaved\)/);
 assert.match(s,/if \(!proceed\) await saveMedicalRecoveryAssessment\(\{ \.\.\.assessment, recordedAt: new Date\(\)\.toISOString\(\) \}\)/);
 assert.match(s,/\{approvedAndSaved && <TouchableOpacity/);
 // The safety hold is released only after beginPainRecovery reports success.
 assert.match(s,/if \(!started\) throw new Error/);

});
test('Pain interruption retains original normal cursor through a new pain recovery',()=>{
 const s=read('context/ProgressContext.tsx');
 assert.match(s,/activeDeload\.returnWeekIndex != null/);
 assert.match(s,/activeDeload\.returnDayIndex != null/);
});

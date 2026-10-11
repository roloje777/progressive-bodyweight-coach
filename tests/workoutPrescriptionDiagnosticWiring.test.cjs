const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
test('diagnostic reads storage without mutation', () => {
 const s=read('storage/workoutPrescriptionDiagnostics.ts');
 assert.match(s,/AsyncStorage.getItem/);
 assert.doesNotMatch(s,/AsyncStorage\.(setItem|removeItem)/);
});
test('start logs both success and failure metadata', () => {
 const s=read('app/screens/preWorkoutOverView.tsx');
 assert.equal((s.match(/\[PBH prescription start diagnostic\]/g)||[]).length,2);
});
test('summary diagnostic only runs when observer unavailable', () => {
 const s=read('app/screens/workoutSummary.tsx');
 assert.match(s,/if \(completionObservation.status === "unavailable"\)/);
 assert.match(s,/\[PBH prescription summary diagnostic\]/);
});

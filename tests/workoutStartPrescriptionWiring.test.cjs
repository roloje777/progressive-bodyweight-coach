const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../app/screens/preWorkoutOverView.tsx'),'utf8');
test('capture occurs before started-position write and recovery snapshot',()=>{
  const a=src.indexOf('await saveLockedWorkoutPrescription(lockedPrescription)');
  const b=src.indexOf('await saveStartedProgramPosition({');
  const c=src.indexOf('await createActiveWorkout({');
  assert.ok(a>=0 && a<b && b<c);
});
test('guided mobility bypasses main prescription lock',()=>{
  assert.match(src,/if \(!isGuidedRecovery\) \{[\s\S]*?lockWorkoutPrescription\(/);
});
test('capture failure is isolated from workout start',()=>{
  assert.match(src,/await saveLockedWorkoutPrescription\(lockedPrescription\);[\s\S]*?\} catch \(error\) \{/);
  assert.match(src,/\} catch \(error\) \{[\s\S]*?\}\s*\}\s*await saveStartedProgramPosition\(/);
});

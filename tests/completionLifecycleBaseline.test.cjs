/** Source-level regression guardrails. Does not simulate React/Expo runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const summary=read('app/screens/workoutSummary.tsx');
const abort=read('utils/createAbortAttempt.ts');
const deload=read('engine/DeloadEngine.ts');
const graduation=read('engine/ProgramGraduationEngine.ts');
const pain=read('engine/ImmediatePainInterceptionEngine.ts');
const screens=['workout','dynamicWarmUp','staticStretch'].map(n=>read(`app/screens/${n}.tsx`));
function check(name,fn){test(name,fn)}
check('01 zero-set summary: advancement currently lacks completion guard',()=>assert.match(summary,/completeWorkout\(\);/));
check('02 70% summary: completion flag is distinct from advancement',()=>assert.match(summary,/completed:\s*progress\.completedSets\s*===\s*progress\.totalSets/));
check('03 85%: no qualifying gate at advancement call (baseline)',()=>{const at=summary.indexOf('    completeWorkout();'); assert.ok(at>=0);assert.doesNotMatch(summary.slice(Math.max(0,at-180),at),/if\s*\([^)]*(?:completionPercent|completion|qualif)/);});
check('04 100%: completed flag is based on set equality',()=>assert.match(summary,/completed:\s*progress\.completedSets\s*===\s*progress\.totalSets/));
check('05 ordinary abort: all three screens persist attempts',()=>screens.forEach(s=>assert.match(s,/recordAbortedWorkout\(/)));
check('06 pain: all three screens expose pain interruption',()=>screens.forEach(s=>assert.match(s,/onPainInterruption=\{handlePainInterruption\}/)));
check('07 deload: 60% target scale configured',()=>assert.match(deload,/FATIGUE_DELOAD_TARGET_SCALE\s*=\s*0\.6/));
check('08 verification: 80% target scale configured',()=>assert.match(deload,/VERIFICATION_TARGET_SCALE\s*=\s*0\.8/));
check('09 verification: summary checks rating and recovery blocker',()=>{assert.match(summary,/verificationRating\s*>=\s*3/);assert.match(summary,/verificationHasRecoveryBlocker\s*===\s*false/);});
check('10 graduation: final-week and readiness logic present',()=>{assert.match(graduation,/programComplete/);assert.match(graduation,/finalReadiness/);});
check('11 optional sets: snapshot denominator not proven by current abort helper',()=>{assert.match(abort,/const plannedSets = prescribed\.reduce/);});
check('12 primary skipped: abort counting only excludes skipped (risk)',()=>assert.match(abort,/!s\?\.skipped && s\?\.status !== "skipped"/));
check('13 pain evaluation engine exists',()=>assert.match(pain,/export function evaluateImmediatePainInterception/));

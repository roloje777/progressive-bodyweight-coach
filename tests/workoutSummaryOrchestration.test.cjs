/** Read-only audit of the actual Workout Summary completion callback. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const source=fs.readFileSync(path.resolve(__dirname,'../app/screens/workoutSummary.tsx'),'utf8');
const ast=ts.createSourceFile('workoutSummary.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='handleCompleteWorkout')callback=n.initializer;ts.forEachChild(n,visit)}
visit(ast);
assert.ok(callback&&ts.isArrowFunction(callback),'Production completion callback must exist');
const body=callback.body.getText(ast);
function at(fragment){const pos=body.indexOf(fragment);assert.notEqual(pos,-1,`Missing production operation: ${fragment}`);return pos}
function before(a,b){assert.ok(at(a)<at(b),`Expected ${a} before ${b}`)}
function verificationExpression(){let expression;function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='verificationPassed')expression=n.initializer;ts.forEachChild(n,walk)}walk(callback);assert.ok(expression,'Missing production verificationPassed expression');return expression.getText(ast)}
const verification=verificationExpression();
function evaluateVerification({mbSuccessRate,rating,blocker}){
 const js=ts.transpileModule(`const value = (${verification});`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 const vm=require('node:vm');
 return vm.runInNewContext(js+'\nvalue;', {report:{mbSuccessRate},verificationRating:rating,verificationHasRecoveryBlocker:blocker});
}
test('summary saves session before lifecycle evaluation',()=>before('await saveWorkoutSession(completedSession)','await evaluateProgramLifecycle('));
test('summary refreshes history after successful save before lifecycle evaluation',()=>{before('await saveWorkoutSession(completedSession)','await refreshWorkoutHistory()');before('await refreshWorkoutHistory()','await evaluateProgramLifecycle(')});
test('summary clears active workout after successful save, before lifecycle evaluation',()=>{before('await clearActiveWorkout("workout_completed")','await evaluateProgramLifecycle(');assert.match(body,/if \(workoutSaved\)\s*\{[\s\S]*?await clearActiveWorkout\("workout_completed"\)/)});
test('summary evaluates lifecycle before persisting progress',()=>before('await evaluateProgramLifecycle(','saveWorkoutProgress(programIndex, week, day,'));
test('summary saves progress before advancing cursor',()=>before('saveWorkoutProgress(programIndex, week, day,','completeWorkout();'));
test('BASELINE RISK: cursor advances before pain interception routing',()=>before('completeWorkout();','if (reportedJointDiscomfort) {'));
test('BASELINE RISK: cursor advances before deload-to-verification transition',()=>before('completeWorkout();','const movedToVerification = beginVerificationPhase();'));
test('BASELINE RISK: completion flag is strict set equality while cursor advances unconditionally',()=>{assert.match(body,/completed:\s*progress\.completedSets === progress\.totalSets/);assert.match(body,/saveWorkoutProgress\([\s\S]*?completeWorkout\(\);/);assert.doesNotMatch(body.slice(at('saveWorkoutProgress(programIndex, week, day,'),at('completeWorkout();')),/if\s*\(\s*progress\.completedSets\s*===\s*progress\.totalSets/)});
test('BASELINE EDGE: zero prescribed sets are currently marked completed',()=>{assert.match(body,/totalSetsPlanned === 0\s*\?\s*\{ completedSets: 0, totalSets: 0 \}/);assert.equal(0===0,true)});
for(const [name,input,expected] of [
 ['verification passes at MB 0.8, rating 3, no blocker',{mbSuccessRate:.8,rating:3,blocker:false},true],
 ['verification fails below MB threshold',{mbSuccessRate:.79,rating:5,blocker:false},false],
 ['verification fails below rating threshold',{mbSuccessRate:1,rating:2,blocker:false},false],
 ['verification fails with absent rating',{mbSuccessRate:1,rating:null,blocker:false},false],
 ['verification fails with recovery blocker',{mbSuccessRate:1,rating:5,blocker:true},false],
])test('real verification expression: '+name,()=>assert.equal(evaluateVerification(input),expected));
test('BASELINE RISK: verification expression has no prescribed-set completion condition',()=>{assert.doesNotMatch(verification,/completedSets|totalSets|progress|prescribed|requiredSets/);assert.equal(evaluateVerification({mbSuccessRate:.9,rating:4,blocker:false}),true)});
test('verification pass clears recovery and failure activates new deload',()=>{assert.match(body,/if \(verificationPassed\)\s*\{\s*clearDeload\(\)/);assert.match(body,/else\s*\{[\s\S]*?activateDeload\(retryReason\)/)});
test('pain routing returns before deload verification routing',()=>{before('if (reportedJointDiscomfort) {','const movedToVerification = beginVerificationPhase();');assert.match(body,/if \(reportedJointDiscomfort\)\s*\{[\s\S]*?router\.replace\([\s\S]*?return;/)});

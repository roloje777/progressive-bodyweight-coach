const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = fs.readFileSync(path.join(__dirname,"../engine/WorkoutOutcomePolicy.ts"),"utf8");
const js = ts.replace(/export type WorkoutOutcome =\s*[\s\S]*?;/, "")
  .replace(/export type WorkoutOutcomeInput = Readonly<[\s\S]*?>;/, "")
  .replace(/export type WorkoutOutcomeDecision = Readonly<[\s\S]*?>;/, "")
  .replace(/export function evaluateWorkoutOutcome\(input: WorkoutOutcomeInput\): WorkoutOutcomeDecision/, "function evaluateWorkoutOutcome(input)")
  .replace(/: WorkoutOutcomeDecision/g, "")
  .replace(/\(outcome: WorkoutOutcome, completedProgramDay: boolean, requiresRetry: boolean\)/, "(outcome, completedProgramDay, requiresRetry)");
const evaluate = new Function(js + "\nreturn evaluateWorkoutOutcome;")();
const base = {prescriptionCompleted:true,jointDiscomfort:false,applicableTargets:10,metTargets:8,rating:4};
const check = (changes, expected) => assert.equal(evaluate({...base,...changes}).outcome, expected);
test("incomplete prescription retains day",()=>check({prescriptionCompleted:false},"incomplete_retry"));
test("pain overrides other outcomes",()=>check({jointDiscomfort:true,metTargets:0},"pain_coach"));
test("MB below 60% always deload",()=>[1,2,3,4,5].forEach(rating=>check({metTargets:5,rating},"deload_verification")));
test("MB 60–79% with low rating deload",()=>[1,2].forEach(rating=>check({metTargets:7,rating},"deload_verification")));
test("MB 60–79% with healthy rating retries",()=>[3,4,5].forEach(rating=>check({metTargets:7,rating},"mandatory_recovery_retry")));
test("MB 80%+ healthy rating goes to readiness",()=>check({},"readiness_evaluation"));
test("MB 80%+ low rating requires recovery review",()=>check({rating:2},"recovery_evaluation"));
test("no MB targets does not imply failure",()=>check({applicableTargets:0,metTargets:0},"baseline_or_unavailable"));
test("boundaries 60% and 80%",()=>{check({metTargets:6,rating:4},"mandatory_recovery_retry");check({metTargets:8,rating:3},"readiness_evaluation")});
test("rejects impossible MB counts",()=>assert.throws(()=>evaluate({...base,metTargets:11})));

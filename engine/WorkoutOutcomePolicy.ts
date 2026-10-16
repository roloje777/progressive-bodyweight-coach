/** Phase 3N: independent prescription, MB and recovery classification.
 * Pure policy: callers must persist decisions and enforce recovery separately. */
export type WorkoutOutcome =
  | "incomplete_retry" | "pain_coach" | "baseline_or_unavailable"
  | "deload_verification" | "mandatory_recovery_retry"
  | "recovery_evaluation" | "readiness_evaluation";
export type WorkoutOutcomeInput = Readonly<{
  prescriptionCompleted: boolean;
  jointDiscomfort: boolean;
  applicableTargets: number;
  metTargets: number;
  rating: number | null;
}>;
export type WorkoutOutcomeDecision = Readonly<{
  outcome: WorkoutOutcome;
  mbSuccessRate: number | null;
  completedProgramDay: boolean;
  requiresRetry: boolean;
}>;
export function evaluateWorkoutOutcome(input: WorkoutOutcomeInput): WorkoutOutcomeDecision {
  const { prescriptionCompleted, jointDiscomfort, applicableTargets, metTargets, rating } = input;
  if (!Number.isInteger(applicableTargets) || applicableTargets < 0 || !Number.isInteger(metTargets) || metTargets < 0 || metTargets > applicableTargets)
    throw new Error("Invalid MB evidence");
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))
    throw new Error("Invalid workout rating");
  const mbSuccessRate = applicableTargets > 0 ? metTargets / applicableTargets : null;
  const result = (outcome: WorkoutOutcome, completedProgramDay: boolean, requiresRetry: boolean): WorkoutOutcomeDecision =>
    Object.freeze({ outcome, mbSuccessRate, completedProgramDay, requiresRetry });
  // Pain is an independent higher-priority trigger even when the workout is incomplete.
  if (jointDiscomfort) return result("pain_coach", false, false);
  if (!prescriptionCompleted) return result("incomplete_retry", false, true);
  // No valid targets is not 0% MB success. Do not penalize baseline sessions.
  if (mbSuccessRate === null) return result("baseline_or_unavailable", true, false);
  if (mbSuccessRate < 0.60) return result("deload_verification", true, false);
  if (mbSuccessRate < 0.80) {
    if (rating !== null && rating <= 2) return result("deload_verification", true, false);
    if (rating !== null && rating >= 3) return result("mandatory_recovery_retry", false, true);
    return result("recovery_evaluation", false, false);
  }
  if (rating !== null && rating <= 2) return result("recovery_evaluation", true, false);
  return result("readiness_evaluation", true, false);
}

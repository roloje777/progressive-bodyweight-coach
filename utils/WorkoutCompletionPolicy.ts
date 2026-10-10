/** Observation-only completion proposal. Does not write state or advance workouts. */
export type PrescriptionExercise = Readonly<{ exerciseId: string; requiredSets: number; primary: boolean }>;
export type PrescriptionSnapshot = Readonly<{
  version: 1;
  required: readonly PrescriptionExercise[];
  optional: readonly Readonly<{ exerciseId: string; offeredSets: number }>[];
  requiredSets: number;
}>;
export type WorkoutEvidence = Readonly<{ exerciseId: string; completedSets: number }>;
export type CompletionMode = 'normal' | 'deload' | 'verification';
export type CompletionInput = Readonly<{
  snapshot: PrescriptionSnapshot;
  performed: readonly WorkoutEvidence[];
  mode: CompletionMode;
  outcome: 'finished' | 'aborted' | 'pain';
  verificationPassed?: boolean;
  recoveryBlocked?: boolean;
}>;
export type CompletionDecision = Readonly<{
  recordAttempt: boolean;
  qualifiesCompleted: boolean;
  advanceDay: boolean;
  acceptMBEvidence: boolean;
  graduationEligible: boolean;
  requiredCompletedSets: number;
  requiredTotalSets: number;
  completionPercent: number;
  reasons: readonly string[];
}>;

/** Capture the original prescription before adaptive optional work is offered. */
export function createPrescriptionSnapshot(input: {
  required: readonly { exerciseId: string; sets: number; primary?: boolean }[];
  optional?: readonly { exerciseId: string; sets: number }[];
}): PrescriptionSnapshot {
  const seen = new Set<string>();
  const required = input.required.map(ex => {
    if (!ex.exerciseId || seen.has(ex.exerciseId) || !Number.isSafeInteger(ex.sets) || ex.sets < 0) {
      throw new Error('Invalid or duplicate required exercise prescription');
    }
    seen.add(ex.exerciseId);
    return Object.freeze({ exerciseId: ex.exerciseId, requiredSets: ex.sets, primary: ex.primary !== false });
  });
  const optional = (input.optional ?? []).map(ex => {
    if (!ex.exerciseId || !Number.isSafeInteger(ex.sets) || ex.sets < 0) {
      throw new Error('Invalid optional exercise prescription');
    }
    return Object.freeze({ exerciseId: ex.exerciseId, offeredSets: ex.sets });
  });
  return Object.freeze({ version: 1 as const, required: Object.freeze(required), optional: Object.freeze(optional), requiredSets: required.reduce((sum, ex) => sum + ex.requiredSets, 0) });
}

/** Proposal only: never invoke this result to mutate ProgressContext without a separate activation review. */
export function evaluateWorkoutCompletion(input: CompletionInput): CompletionDecision {
  const reasons: string[] = [];
  const performed = new Map<string, number>();
  for (const ex of input.performed) {
    if (!ex.exerciseId || !Number.isSafeInteger(ex.completedSets) || ex.completedSets < 0) {
      throw new Error('Invalid performed-set evidence');
    }
    performed.set(ex.exerciseId, (performed.get(ex.exerciseId) ?? 0) + ex.completedSets);
  }
  const requiredTotalSets = input.snapshot.requiredSets;
  const requiredCompletedSets = input.snapshot.required.reduce((sum, ex) => sum + Math.min(ex.requiredSets, performed.get(ex.exerciseId) ?? 0), 0);
  const completionPercent = requiredTotalSets > 0 ? Math.round(100 * requiredCompletedSets / requiredTotalSets) : 0;
  const primaryCovered = input.snapshot.required.filter(ex => ex.primary && ex.requiredSets > 0).every(ex => (performed.get(ex.exerciseId) ?? 0) > 0);
  const fullPrescription = requiredTotalSets > 0 && requiredCompletedSets === requiredTotalSets;
  if (input.outcome !== 'finished') reasons.push(input.outcome === 'pain' ? 'pain_interruption' : 'explicit_abort');
  if (requiredTotalSets === 0) reasons.push('empty_prescription');
  if (!primaryCovered) reasons.push('primary_exercise_missing');
  if (input.recoveryBlocked) reasons.push('recovery_blocked');
  if (input.mode === 'verification' && !input.verificationPassed) reasons.push('verification_not_passed');
  if (input.mode === 'verification' && !fullPrescription) reasons.push('verification_prescription_incomplete');
  if (input.mode === 'deload' && !fullPrescription) reasons.push('deload_prescription_incomplete');
  if (input.mode === 'normal' && completionPercent < 85) reasons.push('below_proposed_85_percent');
  const enoughSets = input.mode === 'normal' ? completionPercent >= 85 : fullPrescription;
  const qualifiesCompleted = input.outcome === 'finished' && requiredTotalSets > 0 && primaryCovered && enoughSets && !input.recoveryBlocked && (input.mode !== 'verification' || input.verificationPassed === true);
  if (!qualifiesCompleted && reasons.length === 0) reasons.push('not_qualified');
  // Conservative: deload/verification evidence is not ordinary MB or graduation evidence.
  const normalEligible = qualifiesCompleted && input.mode === 'normal';
  return Object.freeze({
    recordAttempt: true,
    qualifiesCompleted,
    advanceDay: qualifiesCompleted,
    acceptMBEvidence: normalEligible,
    graduationEligible: normalEligible,
    requiredCompletedSets,
    requiredTotalSets,
    completionPercent,
    reasons: Object.freeze(reasons),
  });
}

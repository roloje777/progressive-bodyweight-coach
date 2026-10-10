import { loadLockedWorkoutPrescription } from '../storage/workoutPrescriptionStorage';
import { evaluateWorkoutCompletion, type CompletionMode, type CompletionDecision } from './WorkoutCompletionPolicy';

type Identity = { programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number };
type Result = { exerciseId?: unknown; sets?: unknown };
export type LockedCompletionObservation = Readonly<{
  status: 'available' | 'unavailable';
  reason: string;
  proposed?: CompletionDecision;
  existingAdvancesCursor: true;
  disagreement?: boolean;
}>;

/** Diagnostics only. Never use the result to mutate workout state. */
export async function observeLockedWorkoutCompletion(input: {
  identity: Identity;
  results: readonly Result[] | undefined;
  mode: CompletionMode;
  recoveryBlocked: boolean;
  verificationPassed?: boolean;
}): Promise<LockedCompletionObservation> {
  const unavailable = (reason: string): LockedCompletionObservation => Object.freeze({ status: 'unavailable', reason, existingAdvancesCursor: true });
  const { identity } = input;
  if (!identity.programId || !Number.isSafeInteger(identity.weekIndex) || identity.weekIndex < 0 ||
      !Number.isSafeInteger(identity.dayIndex) || identity.dayIndex < 0 ||
      !Number.isFinite(identity.startWorkoutTime) || identity.startWorkoutTime <= 0) return unavailable('invalid_identity');
  if (!Array.isArray(input.results)) return unavailable('missing_results');
  try {
    const locked = await loadLockedWorkoutPrescription(identity);
    if (!locked) return unavailable('missing_or_mismatched_lock');
    const performed: { exerciseId: string; completedSets: number }[] = [];
    const seen = new Set<string>();
    for (const result of input.results) {
      if (typeof result.exerciseId !== 'string' || !result.exerciseId || seen.has(result.exerciseId) || !Array.isArray(result.sets))
        return unavailable('ambiguous_results');
      seen.add(result.exerciseId);
      performed.push({ exerciseId: result.exerciseId, completedSets: result.sets.filter((s: any) => s?.status === 'completed').length });
    }
    const proposed = evaluateWorkoutCompletion({
      snapshot: locked.prescription, performed, mode: input.mode,
      outcome: 'finished', recoveryBlocked: input.recoveryBlocked,
      verificationPassed: input.verificationPassed,
    });
    return Object.freeze({ status: 'available', reason: 'locked_prescription_observation_only', proposed,
      existingAdvancesCursor: true, disagreement: proposed.advanceDay !== true });
  } catch {
    return unavailable('storage_or_evaluation_error');
  }
}

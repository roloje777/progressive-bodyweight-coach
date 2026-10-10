import { createPrescriptionSnapshot, evaluateWorkoutCompletion, type CompletionMode, type CompletionDecision } from './WorkoutCompletionPolicy';

/**
 * Read-only, provisional observation of Summary data.
 * The main block is NOT a persisted start-of-workout prescription. Until such a
 * snapshot exists, this must never be used to decide progression or MB evidence.
 */
export type SummaryObservation = Readonly<{
  status: 'provisional' | 'unavailable';
  reason: string;
  proposed?: CompletionDecision;
  existing: Readonly<{ completedFlag: boolean; advancesCursor: true }>;
  disagreement?: boolean;
}>;

type ExerciseLike = { exerciseId?: unknown; sets?: unknown };
type PerformedExerciseLike = { exerciseId?: unknown; sets?: unknown };

export function observeWorkoutSummary(input: {
  prescribed: readonly ExerciseLike[] | undefined;
  performed: readonly PerformedExerciseLike[] | undefined;
  mode: CompletionMode;
  outcome: 'finished' | 'aborted' | 'pain';
  verificationPassed?: boolean;
  recoveryBlocked?: boolean;
  existingCompletedFlag: boolean;
}): SummaryObservation {
  const existing = Object.freeze({ completedFlag: input.existingCompletedFlag, advancesCursor: true as const });
  const unavailable = (reason: string): SummaryObservation => Object.freeze({ status: 'unavailable', reason, existing });
  if (!input.prescribed?.length || !input.performed) return unavailable('missing_prescription_or_results');
  const seen = new Set<string>();
  const required: { exerciseId: string; sets: number; primary: boolean }[] = [];
  for (const ex of input.prescribed) {
    if (typeof ex.exerciseId !== 'string' || !ex.exerciseId || seen.has(ex.exerciseId) ||
        typeof ex.sets !== 'number' || !Number.isSafeInteger(ex.sets) || ex.sets < 0) {
      return unavailable('ambiguous_prescription');
    }
    seen.add(ex.exerciseId);
    required.push({ exerciseId: ex.exerciseId, sets: ex.sets, primary: true });
  }
  const performed: { exerciseId: string; completedSets: number }[] = [];
  for (const ex of input.performed) {
    if (typeof ex.exerciseId !== 'string' || !ex.exerciseId || !Array.isArray(ex.sets)) {
      return unavailable('ambiguous_results');
    }
    performed.push({ exerciseId: ex.exerciseId, completedSets: ex.sets.filter((s: {status?: unknown}) => s?.status === 'completed').length });
  }
  const proposed = evaluateWorkoutCompletion({
    snapshot: createPrescriptionSnapshot({ required }),
    performed,
    mode: input.mode,
    outcome: input.outcome,
    verificationPassed: input.verificationPassed,
    recoveryBlocked: input.recoveryBlocked,
  });
  return Object.freeze({
    status: 'provisional',
    reason: 'main_block_is_not_immutable_start_snapshot_optional_sets_not_proven',
    proposed,
    existing,
    disagreement: proposed.advanceDay !== existing.advancesCursor,
  });
}

import { inspectActiveWorkout } from '../storage/activeWorkoutStorage';
import { getWorkoutHistory } from '../storage/workoutStorage';
import { inspectLockedWorkoutPrescription, clearLockedWorkoutPrescription } from '../storage/workoutPrescriptionStorage';

export type ReconciliationResult = 'no_lock' | 'same_identity' | 'preserved_active_or_unknown' | 'preserved_no_completion_evidence' | 'retired_completed_lock';
type Identity = { programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number };

/** Never infer a prescription from history. Retire only a different lock whose
 * program position has subsequently been saved, with no recovery snapshot.
 * A corrupt/invalid recovery record is treated as potentially active. */
export async function reconcileStaleWorkoutPrescription(next: Identity): Promise<ReconciliationResult> {
  const stored = await inspectLockedWorkoutPrescription();
  if (stored.state === 'absent') return 'no_lock';
  if (stored.state !== 'valid' || !stored.identity) return 'preserved_active_or_unknown';
  const old = stored.identity;
  if (old.programId === next.programId && old.weekIndex === next.weekIndex &&
      old.dayIndex === next.dayIndex && old.startWorkoutTime === next.startWorkoutTime) return 'same_identity';
  const active = await inspectActiveWorkout();
  if (active.status !== 'none') return 'preserved_active_or_unknown';
  const history = await getWorkoutHistory();
  if (!Array.isArray(history)) return 'preserved_no_completion_evidence';
  const completed = history.some((entry: any) =>
    entry?.programId === old.programId && entry?.weekIndex === old.weekIndex &&
    entry?.dayIndex === old.dayIndex && entry?.status === 'completed' &&
    Number.isFinite(entry?.endWorkoutTime) && entry.endWorkoutTime >= old.startWorkoutTime &&
    // A completion recorded before the old lock cannot retire it.
    Number.isFinite(entry?.startWorkoutTime) && entry.startWorkoutTime <= entry.endWorkoutTime
  );
  if (!completed) return 'preserved_no_completion_evidence';
  await clearLockedWorkoutPrescription(old);
  return 'retired_completed_lock';
}

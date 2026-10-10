import type { LockedWorkoutPrescription } from '../storage/workoutPrescriptionStorage';

/** Observation only: never create a new prescription from a resumed session. */
export function classifyResumedPrescription(
  identity: { programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number },
  locked: LockedWorkoutPrescription | null,
): 'matched' | 'unavailable' | 'mismatch' {
  if (!locked) return 'unavailable';
  return locked.programId === identity.programId &&
    locked.weekIndex === identity.weekIndex &&
    locked.dayIndex === identity.dayIndex &&
    locked.startWorkoutTime === identity.startWorkoutTime ? 'matched' : 'mismatch';
}

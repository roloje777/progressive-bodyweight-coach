import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession } from '../engine/sessionBuilder';
import { createPrescriptionSnapshot, type PrescriptionSnapshot } from '../utils/WorkoutCompletionPolicy';

/** Separate from ACTIVE_WORKOUT_RECOVERY_V2; works with recovery disabled. */
const KEY = 'WORKOUT_PRESCRIPTION_V1';
export type LockedWorkoutPrescription = Readonly<{
  schemaVersion: 1;
  programId: string;
  weekIndex: number;
  dayIndex: number;
  startWorkoutTime: number;
  prescription: PrescriptionSnapshot;
}>;

/** Fail closed if the live prescription is ambiguous; never infer from results. */
export function lockWorkoutPrescription(input: {
  programId: string;
  weekIndex: number;
  dayIndex: number;
  startWorkoutTime: number;
  session: WorkoutSession;
}): LockedWorkoutPrescription {
  if (!input.programId || !Number.isSafeInteger(input.weekIndex) || input.weekIndex < 0 ||
      !Number.isSafeInteger(input.dayIndex) || input.dayIndex < 0 ||
      !Number.isFinite(input.startWorkoutTime) || input.startWorkoutTime <= 0 ||
      input.session.dayIndex !== input.dayIndex) throw new Error('Invalid prescription identity');
  const main = input.session.blocks.filter(block => block.type === 'main');
  if (main.length !== 1 || main[0].exercises.length === 0) throw new Error('Missing or ambiguous main prescription');
  const required = main[0].exercises.map((exercise: any) => ({
    exerciseId: exercise.exerciseId ?? exercise.id,
    sets: exercise.sets,
    primary: true,
  }));
  const prescription = createPrescriptionSnapshot({ required });
  if (prescription.requiredSets <= 0) throw new Error('Empty main prescription');
  return Object.freeze({
    schemaVersion: 1 as const,
    programId: input.programId,
    weekIndex: input.weekIndex,
    dayIndex: input.dayIndex,
    startWorkoutTime: input.startWorkoutTime,
    prescription,
  });
}

function validateStored(value: unknown): value is LockedWorkoutPrescription {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, any>;
  if (v.schemaVersion !== 1 || typeof v.programId !== 'string' || !v.programId ||
      !Number.isSafeInteger(v.weekIndex) || v.weekIndex < 0 ||
      !Number.isSafeInteger(v.dayIndex) || v.dayIndex < 0 ||
      !Number.isFinite(v.startWorkoutTime) || v.startWorkoutTime <= 0) return false;
  const p = v.prescription;
  if (!p || p.version !== 1 || !Array.isArray(p.required) || !Array.isArray(p.optional)) return false;
  try {
    const rebuilt = createPrescriptionSnapshot({
      required: p.required.map((e: any) => ({ exerciseId: e.exerciseId, sets: e.requiredSets, primary: e.primary })),
      optional: p.optional.map((e: any) => ({ exerciseId: e.exerciseId, sets: e.offeredSets })),
    });
    return rebuilt.requiredSets > 0 && rebuilt.requiredSets === p.requiredSets &&
      p.required.every((e: any) => typeof e.primary === 'boolean');
  } catch { return false; }
}

/** Never replace an existing prescription for the same workout identity. */
export async function saveLockedWorkoutPrescription(snapshot: LockedWorkoutPrescription): Promise<void> {
  if (!validateStored(snapshot)) throw new Error('Invalid locked prescription');
  const existingRaw = await AsyncStorage.getItem(KEY);
  if (existingRaw) {
    let existing: unknown;
    try { existing = JSON.parse(existingRaw); } catch { throw new Error('Corrupt stored prescription; refusing overwrite'); }
    if (!validateStored(existing)) throw new Error('Invalid stored prescription; refusing overwrite');
    const old = existing as LockedWorkoutPrescription;
    if (old.startWorkoutTime === snapshot.startWorkoutTime && old.programId === snapshot.programId &&
        old.weekIndex === snapshot.weekIndex && old.dayIndex === snapshot.dayIndex) {
      if (JSON.stringify(old.prescription) !== JSON.stringify(snapshot.prescription))
        throw new Error('Locked prescription changed during workout');
      return;
    }
    // Never overwrite another active workout's lock: fail closed and let the
    // existing workout-start flow continue without observation.
    throw new Error('Another workout prescription is already locked');
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
}

/** Legacy sessions have no trusted snapshot: return null, never backfill from results. */
export async function loadLockedWorkoutPrescription(identity: {
  programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number;
}): Promise<LockedWorkoutPrescription | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!validateStored(parsed)) return null;
  const stored = parsed as LockedWorkoutPrescription;
  if (stored.programId !== identity.programId || stored.weekIndex !== identity.weekIndex ||
      stored.dayIndex !== identity.dayIndex || stored.startWorkoutTime !== identity.startWorkoutTime) return null;
  return Object.freeze({ ...stored, prescription: createPrescriptionSnapshot({
    required: stored.prescription.required.map(e => ({ exerciseId: e.exerciseId, sets: e.requiredSets, primary: e.primary })),
    optional: stored.prescription.optional.map(e => ({ exerciseId: e.exerciseId, sets: e.offeredSets })),
  }) });
}

/** Only call on a confirmed terminal cleanup for the matching workout. */
export async function clearLockedWorkoutPrescription(identity: {
  programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number;
}): Promise<void> {
  if (await loadLockedWorkoutPrescription(identity)) await AsyncStorage.removeItem(KEY);
}

/** Read-only storage inspection for lifecycle reconciliation. Invalid records
 * are preserved; callers must not interpret them as absent. */
export async function inspectLockedWorkoutPrescription(): Promise<
  | { state: 'absent' | 'invalid'; identity?: never }
  | { state: 'valid'; identity: { programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number } }
> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { state: 'absent' };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!validateStored(parsed)) return { state: 'invalid' };
    const { programId, weekIndex, dayIndex, startWorkoutTime } = parsed;
    return { state: 'valid', identity: { programId, weekIndex, dayIndex, startWorkoutTime } };
  } catch { return { state: 'invalid' }; }
}

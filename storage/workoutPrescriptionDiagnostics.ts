import AsyncStorage from '@react-native-async-storage/async-storage';

/** Development-only metadata. Does not modify or reconstruct prescriptions. */
export async function diagnoseWorkoutPrescription(identity: {
  programId: string; weekIndex: number; dayIndex: number; startWorkoutTime: number;
}): Promise<{
  state: 'absent' | 'invalid_json' | 'invalid_record' | 'matching' | 'different_identity' | 'read_error';
  expected: typeof identity;
  stored?: typeof identity;
}> {
  const expected = { ...identity };
  try {
    const raw = await AsyncStorage.getItem('WORKOUT_PRESCRIPTION_V1');
    if (!raw) return { state: 'absent', expected };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return { state: 'invalid_json', expected }; }
    if (!parsed || typeof parsed !== 'object') return { state: 'invalid_record', expected };
    const v = parsed as Record<string, unknown>;
    if (v.schemaVersion !== 1 || typeof v.programId !== 'string' ||
      !Number.isSafeInteger(v.weekIndex) || !Number.isSafeInteger(v.dayIndex) ||
      !Number.isFinite(v.startWorkoutTime)) return { state: 'invalid_record', expected };
    const stored = {
      programId: v.programId as string,
      weekIndex: v.weekIndex as number,
      dayIndex: v.dayIndex as number,
      startWorkoutTime: v.startWorkoutTime as number,
    };
    return {
      state: stored.programId === expected.programId && stored.weekIndex === expected.weekIndex &&
        stored.dayIndex === expected.dayIndex && stored.startWorkoutTime === expected.startWorkoutTime
        ? 'matching' : 'different_identity',
      expected, stored,
    };
  } catch { return { state: 'read_error', expected }; }
}

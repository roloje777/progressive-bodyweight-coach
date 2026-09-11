import { getMatchOrBeatTargets } from "@/engine/MatchOrBeatEngine";
import { CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";

type AssertionResult = {
  passed: boolean;
  checks: {
    label: string;
    expected: unknown;
    actual: unknown;
  }[];
};

function assertEqual(
  checks: AssertionResult["checks"],
  label: string,
  actual: unknown,
  expected: unknown,
) {
  checks.push({ label, expected, actual });

  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${String(expected)}, received ${String(actual)}`,
    );
  }
}

function makeSession(args: {
  completedAt: string;
  set3: number;
  manualRecoverySet3?: boolean;
  excludeManualSet3?: boolean;
}): CompletedSession {
  return {
    programId: "recovery-progression-test",
    dayId: "day-1",
    weekIndex: 0,
    dayIndex: 0,
    completedAt: args.completedAt,
    startWorkoutTime: 1,
    endWorkoutTime: 2,
    workoutDuration: 1,
    timeUnderTension: 1,
    feedback: {
      rating: 4,
      tags: ["great-focus"],
    },
    exercises: [
      {
        exerciseId: "recovery-test-squats",
        sets: [
          {
            setNumber: 1,
            status: ItemStatus.Completed,
            repsCompleted: 11,
            entrySource: "live",
          },
          {
            setNumber: 2,
            status: ItemStatus.Completed,
            repsCompleted: 10,
            entrySource: "live",
          },
          {
            setNumber: 3,
            status: ItemStatus.Completed,
            repsCompleted: args.set3,
            entrySource: args.manualRecoverySet3
              ? "manualRecovery"
              : "live",
            advisoryConfirmed: args.manualRecoverySet3
              ? true
              : undefined,
            excludeFromProgression: args.excludeManualSet3
              ? true
              : undefined,
          },
        ],
      },
    ],
  } as CompletedSession;
}

/**
 * Direct regression proof for:
 *
 * Settings > Use recovered data for progression
 *
 * Scenario:
 * - Older valid Set 3 = 8 reps.
 * - Newer interrupted workout has manually recovered Set 3 = 25 reps.
 *
 * OFF:
 *   25 remains in history but MUST NOT become future MB evidence.
 *   Future Set 3 MB should fall back to the older valid 8 reps.
 *
 * ON:
 *   The same confirmed 25-rep recovered value is valid evidence.
 *   Future Set 3 MB should therefore be 25.
 */
export function runWorkoutRecoveryProgressionAssertions(): AssertionResult {
  const checks: AssertionResult["checks"] = [];

  const olderValidWorkout = makeSession({
    completedAt: "2026-09-01T10:00:00.000Z",
    set3: 8,
  });

  const recoveredProgressionOff = makeSession({
    completedAt: "2026-09-08T10:00:00.000Z",
    set3: 25,
    manualRecoverySet3: true,
    excludeManualSet3: true,
  });

  const recoveredProgressionOn = makeSession({
    completedAt: "2026-09-08T10:00:00.000Z",
    set3: 25,
    manualRecoverySet3: true,
    excludeManualSet3: false,
  });

  const recoveredExerciseOff = recoveredProgressionOff.exercises[0];
  const recoveredExerciseOn = recoveredProgressionOn.exercises[0];

  // 1) Data integrity: OFF does not delete or alter the recovered value.
  const storedManualSet = recoveredExerciseOff.sets.find(
    (set) => set.setNumber === 3,
  );

  assertEqual(
    checks,
    "Manual recovery value remains visible/stored",
    storedManualSet?.repsCompleted,
    25,
  );

  assertEqual(
    checks,
    "Manual recovery provenance is retained",
    storedManualSet?.entrySource,
    "manualRecovery",
  );

  assertEqual(
    checks,
    "Progression exclusion flag is retained",
    storedManualSet?.excludeFromProgression,
    true,
  );

  // 2) Setting OFF: the newer manual 25 MUST be ignored.
  const targetsOff = getMatchOrBeatTargets(
    recoveredExerciseOff,
    [olderValidWorkout, recoveredProgressionOff],
    "recovery-test-squats",
  );

  const set3Off = targetsOff.find((target) => target.setNumber === 3);

  assertEqual(
    checks,
    "Progression OFF ignores recovered 25-rep Set 3",
    set3Off?.target,
    8,
  );

  assertEqual(
    checks,
    "Progression OFF uses older same-set evidence",
    set3Off?.source,
    "historicalSameSet",
  );

  // 3) Setting ON: the confirmed recovered 25 is valid MB evidence.
  const targetsOn = getMatchOrBeatTargets(
    recoveredExerciseOn,
    [olderValidWorkout, recoveredProgressionOn],
    "recovery-test-squats",
  );

  const set3On = targetsOn.find((target) => target.setNumber === 3);

  assertEqual(
    checks,
    "Progression ON accepts recovered 25-rep Set 3",
    set3On?.target,
    25,
  );

  assertEqual(
    checks,
    "Progression ON uses newest same-set evidence",
    set3On?.source,
    "historicalSameSet",
  );

  return {
    passed: true,
    checks,
  };
}

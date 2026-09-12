import AsyncStorage from "@react-native-async-storage/async-storage";

import { programs } from "@/data/programs";
import { ProgramEngine } from "@/engine/ProgramEngine";
import { buildSession, WorkoutSession } from "@/engine/sessionBuilder";
import { EMPTY_ADAPTIVE_PROGRAM_STATE } from "@/models/AdaptiveVolume";
import { CompletedSet } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";
import {
  checkpointActiveWorkout,
  clearActiveWorkout,
  createActiveWorkout,
  loadActiveWorkout,
} from "@/storage/activeWorkoutStorage";
import { saveProgress } from "@/storage/progressStorage";
import { hydrateExercise } from "@/utils/hydrateExercise";

const WORKOUT_HISTORY_KEY = "workout_history";
const PROGRAM_EVALUATIONS_KEY = "program_evaluations";
const USER_PROGRESS_KEY = "USER_PROGRESS";
const ACTIVE_WORKOUT_V1_KEY = "ACTIVE_WORKOUT_RECOVERY_V1";
const ACTIVE_WORKOUT_V2_KEY = "ACTIVE_WORKOUT_RECOVERY_V2";

const SEEDED_TRUSTED_DURATION_MS = 3 * 60 * 1000;

type UiWorkoutSet =
  | { reps: number | { left: number; right: number }; phaseDurations?: number[] }
  | { durationSeconds: number }
  | { durationLeft: number; durationRight: number }
  | { skipped: true };

export type WorkoutRecoveryLifecycleScenarioResult = {
  programId: string;
  programName: string;
  week: number;
  day: number;
  exerciseCount: number;
  finalExerciseId: string;
  finalExerciseName: string;
  finalSetNumber: number;
  totalSetsInFinalExercise: number;
  seededTrustedDurationSeconds: number;
  session: WorkoutSession;
  recoveryState: {
    started: boolean;
    phase: "active";
    sets: UiWorkoutSet[];
    sectionSkipped: boolean;
    engineState: ReturnType<ProgramEngine["exportState"]>;
  };
  startWorkoutTime: number;
};

/**
 * Creates a real active Week 1 / Day 1 workout whose MAIN block is nearly
 * complete:
 *
 * - every earlier exercise is fully completed;
 * - every set of the final exercise is completed except its final set;
 * - 3 minutes of trusted active main-workout time are pre-seeded;
 * - no warm-up/stretch blocks are included, so the tester lands directly on
 *   the final live set.
 *
 * This is intended for V2.1 lifecycle/background/restart testing.
 */
export async function seedWorkoutRecoveryLifecycleScenario(
  programId: string = "level1",
): Promise<WorkoutRecoveryLifecycleScenarioResult> {
  // Keep this timing fixture deterministic.
  await AsyncStorage.multiRemove([
    WORKOUT_HISTORY_KEY,
    PROGRAM_EVALUATIONS_KEY,
    USER_PROGRESS_KEY,
    ACTIVE_WORKOUT_V1_KEY,
    ACTIVE_WORKOUT_V2_KEY,
  ]);

  await clearActiveWorkout();

  const programIndex = programs.findIndex((candidate) => candidate.id === programId);
  if (programIndex < 0) {
    throw new Error(
      `WorkoutRecoveryLifecycleScenarioSeeder: program "${programId}" not found`,
    );
  }

  const program = programs[programIndex];
  const dayIndex = 0;
  const weekIndex = 0;
  const day = program.days[dayIndex];

  if (!day) {
    throw new Error(
      `WorkoutRecoveryLifecycleScenarioSeeder: ${programId} has no Day 1`,
    );
  }

  const session = buildSession(program, dayIndex, {
    includeWarmup: false,
    includeStretch: false,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
    completedSessions: [],
    workoutReason: "scheduled",
  });

  const mainBlock = session.blocks.find((block) => block.type === "main");
  if (!mainBlock || mainBlock.exercises.length === 0) {
    throw new Error(
      "WorkoutRecoveryLifecycleScenarioSeeder: main block has no exercises",
    );
  }

  const engine = new ProgramEngine(program, dayIndex, mainBlock.exercises);
  engine.startWorkout();

  let finalExerciseUiSets: UiWorkoutSet[] = [];

  for (
    let exerciseIndex = 0;
    exerciseIndex < mainBlock.exercises.length;
    exerciseIndex++
  ) {
    const prescribedExercise = mainBlock.exercises[exerciseIndex];
    const hydrated = hydrateExercise(prescribedExercise);
    const isFinalExercise =
      exerciseIndex === mainBlock.exercises.length - 1;

    const setsToComplete = isFinalExercise
      ? Math.max(0, prescribedExercise.sets - 1)
      : prescribedExercise.sets;

    const uiSets: UiWorkoutSet[] = [];

    for (let setIndex = 0; setIndex < setsToComplete; setIndex++) {
      const setNumber = setIndex + 1;
      const fixture = createFixtureSet(hydrated.type, setNumber);

      engine.completeSet({
        status: ItemStatus.Completed,
        ...fixture.completed,
      });

      uiSets.push(fixture.ui);
    }

    if (isFinalExercise) {
      finalExerciseUiSets = uiSets;
      break;
    }

    if (engine.hasNextExercise()) {
      engine.nextExercise();
    }
  }

  const finalExercise = engine.getCurrentExercise();
  if (!finalExercise) {
    throw new Error(
      "WorkoutRecoveryLifecycleScenarioSeeder: failed to position final exercise",
    );
  }

  const startWorkoutTime = Date.now() - SEEDED_TRUSTED_DURATION_MS;

  // Position normal program progress at human Week 1 / Day 1.
  await saveProgress({
    programIndex,
    week: weekIndex,
    day: dayIndex,
    workouts: {},
    pendingGraduation: null,
    activeDeload: null,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  // Create the same active snapshot used by a real workout start.
  await createActiveWorkout({
    programId: program.id,
    weekIndex,
    dayIndex,
    startWorkoutTime,
    session,
  });

  const recoveryState = {
    started: true,
    phase: "active" as const,
    sets: finalExerciseUiSets,
    sectionSkipped: false,
    engineState: engine.exportState(),
  };

  await checkpointActiveWorkout({
    screen: "workout",
    blockIndex: 0,
    session,
    activeBlockId: mainBlock.id,
    screenState: recoveryState,
  });

  /**
   * Seed a visible trusted-time baseline.
   *
   * We intentionally mutate only trusted timing accumulators in this test
   * fixture. The snapshot's runtimeId and lifecycle metadata come from the
   * production createActiveWorkout() path, so background and process-restart
   * classification are still tested normally.
   */
  const active = await loadActiveWorkout();
  if (!active) {
    throw new Error(
      "WorkoutRecoveryLifecycleScenarioSeeder: active snapshot was not created",
    );
  }

  const now = Date.now();
  const seeded = {
    ...active,
    createdAt: now - SEEDED_TRUSTED_DURATION_MS,
    updatedAt: now,
    lastCheckpointAt: now,
    accumulatedActiveDurationMs: SEEDED_TRUSTED_DURATION_MS,
    blockActiveDurationMs: {
      ...active.blockActiveDurationMs,
      [mainBlock.id]: SEEDED_TRUSTED_DURATION_MS,
    },
    activeTimingSegment: {
      startedAt: now,
      lastCheckpointAt: now,
    },
    activeBlockId: mainBlock.id,
    lastAppState: "active" as const,
    backgroundedAt: undefined,
    interruption: undefined,
  };

  await AsyncStorage.setItem(
    ACTIVE_WORKOUT_V2_KEY,
    JSON.stringify(seeded),
  );

  console.log("🧪 V2.1 LIFECYCLE SCENARIO SEEDED", {
    program: program.name,
    week: 1,
    day: 1,
    finalExercise: finalExercise.name,
    completedSetsInFinalExercise: finalExerciseUiSets.length,
    totalSetsInFinalExercise: finalExercise.sets,
    seededTrustedDurationSeconds: SEEDED_TRUSTED_DURATION_MS / 1000,
  });

  return {
    programId: program.id,
    programName: program.name,
    week: 1,
    day: 1,
    exerciseCount: mainBlock.exercises.length,
    finalExerciseId: finalExercise.exerciseId,
    finalExerciseName: finalExercise.name,
    finalSetNumber: finalExerciseUiSets.length + 1,
    totalSetsInFinalExercise: finalExercise.sets,
    seededTrustedDurationSeconds: SEEDED_TRUSTED_DURATION_MS / 1000,
    session,
    recoveryState,
    startWorkoutTime,
  };
}

function createFixtureSet(
  exerciseType: string,
  setNumber: number,
): {
  completed: Omit<CompletedSet, "status">;
  ui: UiWorkoutSet;
} {
  const recoveryContext =
    setNumber === 1
      ? {}
      : {
          prescribedRestBeforeSet: 120,
          actualRestBeforeSet: 120,
          adaptiveRestAdjustmentBeforeSet: 0,
        };

  if (exerciseType === "hold" || exerciseType === "time") {
    const durationSeconds = 20 + setNumber;
    return {
      completed: {
        setNumber,
        durationSeconds,
        ...recoveryContext,
      },
      ui: { durationSeconds },
    };
  }

  const reps = 8 + setNumber;

  return {
    completed: {
      setNumber,
      reps,
      ...recoveryContext,
    },
    ui: { reps },
  };
}

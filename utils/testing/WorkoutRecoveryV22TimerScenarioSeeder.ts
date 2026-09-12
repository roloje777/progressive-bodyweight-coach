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
import { RecoveryTimerState } from "@/models/WorkoutRecovery";

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

export type V22ScenarioKind =
  | "set-rest"
  | "exercise-rest"
  | "hold";

export type V22ScenarioResult = {
  kind: V22ScenarioKind;
  programId: string;
  programName: string;
  week: number;
  day: number;
  exerciseName: string;
  exerciseId: string;
  seededTrustedDurationSeconds: number;
  restDurationSeconds?: number;
  session: WorkoutSession;
  recoveryState: {
    started: boolean;
    phase: "active" | "rest-set" | "rest-exercise";
    sets: UiWorkoutSet[];
    sectionSkipped: boolean;
    timerState: RecoveryTimerState | null;
    engineState: ReturnType<ProgramEngine["exportState"]>;
  };
  startWorkoutTime: number;
};

async function resetScenarioStorage() {
  await AsyncStorage.multiRemove([
    WORKOUT_HISTORY_KEY,
    PROGRAM_EVALUATIONS_KEY,
    USER_PROGRESS_KEY,
    ACTIVE_WORKOUT_V1_KEY,
    ACTIVE_WORKOUT_V2_KEY,
  ]);

  await clearActiveWorkout();
}

function createFixtureSet(
  exercise: ReturnType<typeof hydrateExercise>,
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

  if (exercise.type === "hold" || exercise.type === "time") {
    const durationSeconds = 20 + setNumber;

    const sideMode = (exercise as { sideMode?: "none" | "alternating" }).sideMode;

    if (sideMode === "alternating") {
      return {
        completed: {
          setNumber,
          durationLeft: durationSeconds,
          durationRight: durationSeconds,
          ...recoveryContext,
        },
        ui: {
          durationLeft: durationSeconds,
          durationRight: durationSeconds,
        },
      };
    }

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

async function seedSnapshot(input: {
  programIndex: number;
  dayIndex: number;
  session: WorkoutSession;
  engine: ProgramEngine;
  sets: UiWorkoutSet[];
  phase: "active" | "rest-set" | "rest-exercise";
  timerState: RecoveryTimerState | null;
  exerciseName: string;
  exerciseId: string;
  kind: V22ScenarioKind;
  restDurationSeconds?: number;
}): Promise<V22ScenarioResult> {
  const {
    programIndex,
    dayIndex,
    session,
    engine,
    sets,
    phase,
    timerState,
    exerciseName,
    exerciseId,
    kind,
    restDurationSeconds,
  } = input;

  const program = programs[programIndex];
  const mainBlock = session.blocks.find((block) => block.type === "main");

  if (!mainBlock) {
    throw new Error("V2.2 test seeder: main block not found");
  }

  const startWorkoutTime = Date.now() - SEEDED_TRUSTED_DURATION_MS;

  await saveProgress({
    programIndex,
    week: 0,
    day: dayIndex,
    workouts: {},
    pendingGraduation: null,
    activeDeload: null,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  await createActiveWorkout({
    programId: program.id,
    weekIndex: 0,
    dayIndex,
    startWorkoutTime,
    session,
  });

  const recoveryState = {
    started: true,
    phase,
    sets,
    sectionSkipped: false,
    timerState,
    engineState: engine.exportState(),
  };

  await checkpointActiveWorkout({
    screen: "workout",
    blockIndex: 0,
    session,
    activeBlockId: mainBlock.id,
    screenState: recoveryState,
  });

  const active = await loadActiveWorkout();

  if (!active) {
    throw new Error("V2.2 test seeder: active snapshot was not created");
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
    screenState: recoveryState,
  };

  await AsyncStorage.setItem(
    ACTIVE_WORKOUT_V2_KEY,
    JSON.stringify(seeded),
  );

  console.log("🧪 V2.2 TIMER SCENARIO SEEDED", {
    kind,
    program: program.name,
    week: 1,
    day: dayIndex + 1,
    exerciseName,
    exerciseId,
    phase,
    timerState,
    trustedDurationSeconds: SEEDED_TRUSTED_DURATION_MS / 1000,
  });

  return {
    kind,
    programId: program.id,
    programName: program.name,
    week: 1,
    day: dayIndex + 1,
    exerciseName,
    exerciseId,
    seededTrustedDurationSeconds: SEEDED_TRUSTED_DURATION_MS / 1000,
    restDurationSeconds,
    session,
    recoveryState,
    startWorkoutTime,
  };
}

/**
 * Starts on a real 60-second SET rest.
 *
 * Use this one for:
 * - brief background;
 * - force-close + Resume Workout;
 * - normal rest reconstruction.
 */
export async function seedV22SetRestScenario(
  restDurationSeconds: number = 60,
): Promise<V22ScenarioResult> {
  await resetScenarioStorage();

  const programIndex = programs.findIndex((program) => program.id === "level1");
  if (programIndex < 0) {
    throw new Error('V2.2 test seeder: program "level1" not found');
  }

  const program = programs[programIndex];
  const dayIndex = 0;

  const session = buildSession(program, dayIndex, {
    includeWarmup: false,
    includeStretch: false,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
    completedSessions: [],
    workoutReason: "scheduled",
  });

  const mainBlock = session.blocks.find((block) => block.type === "main");
  if (!mainBlock) {
    throw new Error("V2.2 set-rest scenario: main block not found");
  }

  const targetIndex = mainBlock.exercises.findIndex(
    (exercise) => Number(exercise.sets ?? 0) >= 2,
  );

  if (targetIndex < 0) {
    throw new Error(
      "V2.2 set-rest scenario: no exercise with at least 2 sets was found",
    );
  }

  const engine = new ProgramEngine(program, dayIndex, mainBlock.exercises);
  engine.startWorkout();

  for (let index = 0; index < targetIndex; index++) {
    const exercise = hydrateExercise(mainBlock.exercises[index]);

    for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
      const fixture = createFixtureSet(exercise, setIndex + 1);
      engine.completeSet({
        status: ItemStatus.Completed,
        ...fixture.completed,
      });
    }

    engine.nextExercise();
  }

  const target = hydrateExercise(mainBlock.exercises[targetIndex]);
  const firstSet = createFixtureSet(target, 1);

  engine.completeSet({
    status: ItemStatus.Completed,
    ...firstSet.completed,
  });

  const timerStartedAt = Date.now();

  return seedSnapshot({
    programIndex,
    dayIndex,
    session,
    engine,
    sets: [firstSet.ui],
    phase: "rest-set",
    timerState: {
      kind: "rest-set",
      startedAt: timerStartedAt,
      durationSeconds: restDurationSeconds,
      exerciseId: target.exerciseId,
      setNumber: 2,
    },
    exerciseName: target.name,
    exerciseId: target.exerciseId,
    kind: "set-rest",
    restDurationSeconds,
  });
}

/**
 * Starts on a real rest BETWEEN EXERCISES.
 *
 * The current exercise is fully complete and the next exercise is waiting.
 * When the rest expires, the app should advance to the next exercise exactly once.
 */
export async function seedV22ExerciseRestScenario(
  restDurationSeconds: number = 60,
): Promise<V22ScenarioResult> {
  await resetScenarioStorage();

  const programIndex = programs.findIndex((program) => program.id === "level1");
  if (programIndex < 0) {
    throw new Error('V2.2 test seeder: program "level1" not found');
  }

  const program = programs[programIndex];
  const dayIndex = 0;

  const session = buildSession(program, dayIndex, {
    includeWarmup: false,
    includeStretch: false,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
    completedSessions: [],
    workoutReason: "scheduled",
  });

  const mainBlock = session.blocks.find((block) => block.type === "main");
  if (!mainBlock || mainBlock.exercises.length < 2) {
    throw new Error(
      "V2.2 exercise-rest scenario: at least two main exercises are required",
    );
  }

  const engine = new ProgramEngine(program, dayIndex, mainBlock.exercises);
  engine.startWorkout();

  const target = hydrateExercise(mainBlock.exercises[0]);
  const uiSets: UiWorkoutSet[] = [];

  for (let setIndex = 0; setIndex < target.sets; setIndex++) {
    const fixture = createFixtureSet(target, setIndex + 1);

    engine.completeSet({
      status: ItemStatus.Completed,
      ...fixture.completed,
    });

    uiSets.push(fixture.ui);
  }

  const timerStartedAt = Date.now();

  return seedSnapshot({
    programIndex,
    dayIndex,
    session,
    engine,
    sets: uiSets,
    phase: "rest-exercise",
    timerState: {
      kind: "rest-exercise",
      startedAt: timerStartedAt,
      durationSeconds: restDurationSeconds,
      exerciseId: target.exerciseId,
      setNumber: target.sets,
    },
    exerciseName: target.name,
    exerciseId: target.exerciseId,
    kind: "exercise-rest",
    restDurationSeconds,
  });
}

/**
 * Finds the earliest real prescribed hold/time exercise in the production
 * program data and opens the workout directly on that exercise.
 *
 * No timer is pre-started. Press START in the normal HoldExercise UI, allow
 * several seconds to elapse, then background/force-close the app.
 */
export async function seedV22HoldScenario(): Promise<V22ScenarioResult> {
  await resetScenarioStorage();

  let selected:
    | {
        programIndex: number;
        dayIndex: number;
        session: WorkoutSession;
        targetIndex: number;
      }
    | undefined;

  // Prefer a non-alternating hold because it gives the cleanest lifecycle test.
  for (const preferNonAlternating of [true, false]) {
    for (let programIndex = 0; programIndex < programs.length; programIndex++) {
      const program = programs[programIndex];

      for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
        const session = buildSession(program, dayIndex, {
          includeWarmup: false,
          includeStretch: false,
          adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
          completedSessions: [],
          workoutReason: "scheduled",
        });

        const mainBlock = session.blocks.find((block) => block.type === "main");
        if (!mainBlock) continue;

        const targetIndex = mainBlock.exercises.findIndex((exercise) => {
          const hydrated = hydrateExercise(exercise);
          const isTimed =
            hydrated.type === "hold" || hydrated.type === "time";

          if (!isTimed) return false;

          return preferNonAlternating
            ? (hydrated as { sideMode?: "none" | "alternating" }).sideMode !== "alternating"
            : true;
        });

        if (targetIndex >= 0) {
          selected = {
            programIndex,
            dayIndex,
            session,
            targetIndex,
          };
          break;
        }
      }

      if (selected) break;
    }

    if (selected) break;
  }

  if (!selected) {
    throw new Error(
      "V2.2 hold scenario: no prescribed hold/time exercise was found in the program data",
    );
  }

  const {
    programIndex,
    dayIndex,
    session,
    targetIndex,
  } = selected;

  const program = programs[programIndex];
  const mainBlock = session.blocks.find((block) => block.type === "main");

  if (!mainBlock) {
    throw new Error("V2.2 hold scenario: main block not found");
  }

  const engine = new ProgramEngine(program, dayIndex, mainBlock.exercises);
  engine.startWorkout();

  for (let index = 0; index < targetIndex; index++) {
    const exercise = hydrateExercise(mainBlock.exercises[index]);

    for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
      const fixture = createFixtureSet(exercise, setIndex + 1);

      engine.completeSet({
        status: ItemStatus.Completed,
        ...fixture.completed,
      });
    }

    engine.nextExercise();
  }

  const target = hydrateExercise(mainBlock.exercises[targetIndex]);

  return seedSnapshot({
    programIndex,
    dayIndex,
    session,
    engine,
    sets: [],
    phase: "active",
    timerState: null,
    exerciseName: target.name,
    exerciseId: target.exerciseId,
    kind: "hold",
  });
}

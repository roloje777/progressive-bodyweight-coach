// utils/testing/AdaptiveRestV2ScenarioSeeder.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import { programs } from "@/data/programs";

import {
  CompletedExercise,
  CompletedSession,
  CompletedSet,
} from "@/models/WorkoutLog";
import { Program, WorkoutDay } from "@/models/Program";
import { ProgramExercise } from "@/models/Exercise";
import { ItemStatus, WorkoutStatus } from "@/models/WorkoutStatus";
import { EMPTY_ADAPTIVE_PROGRAM_STATE } from "@/models/AdaptiveVolume";

import { saveWorkoutSession } from "@/storage/workoutStorage";
import { saveProgress } from "@/storage/progressStorage";

const WORKOUT_HISTORY_KEY = "workout_history";
const PROGRAM_EVALUATIONS_KEY = "program_evaluations";
const USER_PROGRESS_KEY = "USER_PROGRESS";

export type AdaptiveRestV2Level = 1 | 2 | 3;

/**
 * "stable":
 *   The athlete normally preserves performance well between sets
 *   (roughly 10% set-to-set drop).
 *
 * "fatigue-tolerant":
 *   The athlete historically shows a much larger normal set-to-set drop
 *   (roughly 20-25% where integer reps allow it).
 *
 * The point of having both is to prove that V2 reacts to personal history,
 * not just the fixed V1 thresholds.
 */
export type AdaptiveRestV2Profile = "stable" | "fatigue-tolerant";

export type AdaptiveRestV2SeedResult = {
  scenarioId: string;
  programId: string;
  programName: string;
  level: AdaptiveRestV2Level;
  profile: AdaptiveRestV2Profile;
  seededWorkoutCount: number;
  comparableHistoryCount: number;
  targetWeek: number;
  targetDay: number;
  instructions: string[];
};

/**
 * Seeds Weeks 1-3 completely, then positions the program at human Week 4 Day 1.
 *
 * Since the same exercises recur each week, Week 4 now has exactly three
 * comparable normal-mode historical workouts for each Day-1 exercise/set
 * transition — the minimum required by Adaptive Rest Personalized/V2.
 *
 * Healthy-history requirements deliberately satisfied:
 * - trainingMode = "normal"
 * - workout feedback rating = 3 (> 2)
 * - no joint-discomfort/form-breakdown/low-energy tags
 * - rest metadata is stored on Sets 2+
 *
 * Adaptive Rest Settings are NOT overwritten. Before testing, Settings should
 * show Adaptive Rest = ON and Adaptive Rest Mode = Personalized.
 */
export async function seedAdaptiveRestV2Scenario(
  level: AdaptiveRestV2Level,
  profile: AdaptiveRestV2Profile,
): Promise<AdaptiveRestV2SeedResult> {
  const programId = `level${level}`;

  await AsyncStorage.multiRemove([
    WORKOUT_HISTORY_KEY,
    PROGRAM_EVALUATIONS_KEY,
    USER_PROGRESS_KEY,
  ]);

  const programIndex = programs.findIndex(
    (candidate) => candidate.id === programId,
  );

  if (programIndex < 0) {
    throw new Error(
      `AdaptiveRestV2ScenarioSeeder: program "${programId}" not found`,
    );
  }

  const program = programs[programIndex];
  const workoutHistory: CompletedSession[] = [];
  const workoutProgress: Record<
    string,
    { completedSets: number; totalSets: number; completed: boolean }
  > = {};

  // Seed human Weeks 1-3 => zero-based weekIndexes 0,1,2.
  for (let weekIndex = 0; weekIndex < 3; weekIndex++) {
    for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
      const day = program.days[dayIndex];

      const session = createV2BaselineWorkout({
        program,
        day,
        sessionIndex: workoutHistory.length,
        weekIndex,
        dayIndex,
        profile,
      });

      const saved = await saveWorkoutSession(session);

      if (!saved) {
        throw new Error(
          `AdaptiveRestV2ScenarioSeeder: failed to save Level ${level} Week ${
            weekIndex + 1
          } Day ${dayIndex + 1}`,
        );
      }

      workoutHistory.push(session);

      const totalSets = day.exercises
        .filter((exercise) => exercise.optional !== true)
        .reduce((total, exercise) => total + exercise.sets, 0);

      workoutProgress[`${programIndex}-${weekIndex}-${dayIndex}`] = {
        completedSets: totalSets,
        totalSets,
        completed: true,
      };
    }
  }

  await saveProgress({
    programIndex,
    week: 3, // zero-based => human Week 4
    day: 0, // human Day 1
    workouts: workoutProgress,
    pendingGraduation: null,
    activeDeload: null,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  const profileText =
    profile === "stable"
      ? "Stable baseline: roughly 10% normal set-to-set drop."
      : "Fatigue-tolerant baseline: roughly 20-25% normal set-to-set drop.";

  const instructions = [
    "Confirm Settings: Adaptive Rest = ON and Mode = Personalized.",
    "Weeks 1-3 are fully populated with healthy NORMAL workouts.",
    "Week 4 Day 1 now has 3 comparable histories, so V2 should NOT fall back to Standard.",
    profileText,
    "Use the displayed Match-or-Beat values during the live Week-4 workout to create normal or unusually large drop-off.",
    "Exercise Effort Rating remains available for the between-exercise V2 decision.",
  ];

  console.log("🧪 ADAPTIVE REST V2 STATE SEEDED", {
    level,
    profile,
    programId: program.id,
    programName: program.name,
    seededWorkoutCount: workoutHistory.length,
    target: { week: 4, day: 1 },
    comparableHistoryCount: 3,
    day1Baselines: workoutHistory
      .filter((session) => session.dayIndex === 0)
      .map((session) => ({
        weekIndex: session.weekIndex,
        exercises: session.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets.map((set) => ({
            setNumber: set.setNumber,
            value:
              set.repsCompleted ??
              (set.repsLeft != null && set.repsRight != null
                ? (set.repsLeft + set.repsRight) / 2
                : set.durationSeconds),
            restBeforeSet:
              set.actualRestBeforeSet ?? set.prescribedRestBeforeSet ?? null,
          })),
        })),
      })),
  });

  return {
    scenarioId: `adaptive-rest-v2-level-${level}-${profile}`,
    programId: program.id,
    programName: program.name,
    level,
    profile,
    seededWorkoutCount: workoutHistory.length,
    comparableHistoryCount: 3,
    targetWeek: 4,
    targetDay: 1,
    instructions,
  };
}

function createV2BaselineWorkout(input: {
  program: Program;
  day: WorkoutDay;
  sessionIndex: number;
  weekIndex: number;
  dayIndex: number;
  profile: AdaptiveRestV2Profile;
}): CompletedSession {
  const {
    program,
    day,
    sessionIndex,
    weekIndex,
    dayIndex,
    profile,
  } = input;

  const exercises = day.exercises
    .filter((exercise) => exercise.optional !== true)
    .map((programExercise) =>
      createV2BaselineExercise(programExercise, profile),
    );

  // Keep all setup history safely in the past.
  const completedAt = new Date(
    Date.now() - (30 - sessionIndex) * 24 * 60 * 60 * 1000,
  );

  const startWorkoutTime = completedAt.getTime() - 35 * 60 * 1000;
  const endWorkoutTime = completedAt.getTime();

  return {
    programId: program.id,
    dayId: day.id,
    weekIndex,
    dayIndex,
    status: WorkoutStatus.Completed,
    completedAt: completedAt.toISOString(),
    startWorkoutTime,
    endWorkoutTime,
    workoutDuration: Math.floor((endWorkoutTime - startWorkoutTime) / 1000),
    timeUnderTension: 0,
    exercises,
    feedback: {
      // V2 excludes rating <= 2. Rating 3 is intentionally healthy/comparable.
      rating: 3,
      tags: [],
      comment: `Adaptive Rest V2 ${profile} personalized baseline`,
    },
    sectionSkipped: false,
    trainingMode: "normal",
  };
}

function createV2BaselineExercise(
  programExercise: ProgramExercise,
  profile: AdaptiveRestV2Profile,
): CompletedExercise {
  const startValue = getStartingValue(programExercise);

  const completedSets: CompletedSet[] = Array.from(
    { length: programExercise.sets },
    (_, index) => {
      const setNumber = index + 1;
      const actualValue = getSetValue(startValue, index, profile);

      const recoveryContext =
        setNumber === 1
          ? {}
          : {
              prescribedRestBeforeSet: 120,
              actualRestBeforeSet: 120,
              adaptiveRestAdjustmentBeforeSet: 0,
            };

      const config = programExercise.config as any;
      const isTimed = config.durationSeconds != null;

      if (isTimed) {
        return {
          setNumber,
          status: ItemStatus.Completed,
          durationSeconds: actualValue,
          ...recoveryContext,
        };
      }

      if (programExercise.sideMode === "alternating") {
        return {
          setNumber,
          status: ItemStatus.Completed,
          repsLeft: actualValue,
          repsRight: actualValue,
          ...recoveryContext,
        };
      }

      return {
        setNumber,
        status: ItemStatus.Completed,
        repsCompleted: actualValue,
        ...recoveryContext,
      };
    },
  );

  return {
    exerciseId: programExercise.exerciseId,
    sets: completedSets,
    effortRating: 2, // About Right — healthy baseline.
  };
}

function getStartingValue(exercise: ProgramExercise): number {
  const config = exercise.config as any;

  if (config.durationSeconds != null) {
    return Math.max(8, Math.round(config.durationSeconds));
  }

  if (config.maxReps != null) {
    return Math.max(4, Math.round(config.maxReps));
  }

  if (config.minReps != null) {
    return Math.max(4, Math.round(config.minReps + 4));
  }

  return 10;
}

function getSetValue(
  startValue: number,
  zeroBasedSetIndex: number,
  profile: AdaptiveRestV2Profile,
): number {
  if (zeroBasedSetIndex === 0) return startValue;

  // Stable profile aims for ~10% loss on each transition.
  // Fatigue-tolerant profile aims for ~22% loss on each transition.
  // Integer rep exercises necessarily produce some rounding variance.
  const factor = profile === "stable" ? 0.9 : 0.78;

  let value = startValue;

  for (let i = 0; i < zeroBasedSetIndex; i++) {
    value = Math.max(1, Math.round(value * factor));
  }

  return value;
}

// utils/testing/Week2StartScenarioSeeder.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import { programs } from "@/data/programs";
import { hydrateExercise } from "@/utils/hydrateExercise";
import { getMatchOrBeatTargets } from "@/engine/MatchOrBeatEngine";

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

export type Week2StartLevel = 1 | 2 | 3;

export type Week2StartSeedResult = {
  scenarioId: string;
  programId: string;
  programName: string;
  seededWorkoutCount: number;
  targetWeek: number;
  targetDay: number;
  instructions: string[];
};

/**
 * Seeds a clean, healthy Week 1 for the requested program level and positions
 * the app at human Week 2 Day 1.
 *
 * The completed Week-1 sessions are real persisted workout-history entries.
 * This means Week 2 can immediately exercise Match-or-Beat, progression,
 * Adaptive Rest and the rest of the normal live workout pipeline.
 *
 * Adaptive Volume state is reset to its empty program state so the shortcut
 * does not carry adaptation decisions from a previous test.
 *
 * User-configured settings (including Adaptive Rest settings) are deliberately
 * NOT reset. This lets the tester change Settings first, seed a level, and
 * verify those settings in the live Week-2 workout.
 */
export async function seedWeek2StartScenario(
  level: Week2StartLevel,
): Promise<Week2StartSeedResult> {
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
      `Week2StartScenarioSeeder: program "${programId}" not found`,
    );
  }

  const program = programs[programIndex];
  const workoutHistory: CompletedSession[] = [];
  const workoutProgress: Record<
    string,
    { completedSets: number; totalSets: number; completed: boolean }
  > = {};

  // Human Week 1 => zero-based weekIndex 0.
  const weekIndex = 0;

  for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
    const day = program.days[dayIndex];

    const session = createHealthySeededWorkout({
      program,
      day,
      workoutHistory,
      sessionIndex: workoutHistory.length,
      weekIndex,
      dayIndex,
    });

    const saved = await saveWorkoutSession(session);

    if (!saved) {
      throw new Error(
        `Week2StartScenarioSeeder: failed to save Level ${level} Week 1 Day ${
          dayIndex + 1
        }`,
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

  await saveProgress({
    programIndex,
    week: 1, // zero-based => human Week 2
    day: 0, // human Day 1
    workouts: workoutProgress,
    pendingGraduation: null,
    activeDeload: null,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  const instructions = [
    `Level ${level} Week 1 is fully populated with healthy completed workouts.`,
    "The app is positioned at Week 2 Day 1.",
    "Week-2 exercises can use the seeded Week-1 performance as Match-or-Beat history.",
    "Your current Adaptive Rest Settings are preserved for the live test.",
  ];

  console.log("🧪 WEEK-2 START STATE SEEDED", {
    level,
    programId: program.id,
    programName: program.name,
    seededWorkoutCount: workoutHistory.length,
    target: { week: 2, day: 1 },
    history: workoutHistory.map((session) => ({
      weekIndex: session.weekIndex,
      dayIndex: session.dayIndex,
      dayId: session.dayId,
      completedAt: session.completedAt,
    })),
  });

  return {
    scenarioId: `level-${level}-week2-start`,
    programId: program.id,
    programName: program.name,
    seededWorkoutCount: workoutHistory.length,
    targetWeek: 2,
    targetDay: 1,
    instructions,
  };
}

function createHealthySeededWorkout(input: {
  program: Program;
  day: WorkoutDay;
  workoutHistory: CompletedSession[];
  sessionIndex: number;
  weekIndex: number;
  dayIndex: number;
}): CompletedSession {
  const { program, day, workoutHistory, sessionIndex, weekIndex, dayIndex } =
    input;

  const exercises = day.exercises
    .filter((exercise) => exercise.optional !== true)
    .map((programExercise) =>
      createHealthySeededExercise(programExercise, workoutHistory),
    );

  // Keep setup history safely in the past so scheduling logic does not treat
  // the seeded Week-1 sessions as workouts completed today.
  const completedAt = new Date(
    Date.now() - (14 - sessionIndex) * 24 * 60 * 60 * 1000,
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
      rating: 3,
      tags: [],
      comment: `Level ${program.id} Week-2-start healthy baseline`,
    },
    sectionSkipped: false,
    trainingMode: "normal",
  };
}

function createHealthySeededExercise(
  programExercise: ProgramExercise,
  workoutHistory: CompletedSession[],
): CompletedExercise {
  const hydratedExercise = hydrateExercise(programExercise);

  const targetExercise = {
    exerciseId: programExercise.exerciseId,
    sets: Array.from({ length: programExercise.sets }, (_, index) => ({
      setNumber: index + 1,
      status: ItemStatus.Pending,
    })),
  };

  const targets = getMatchOrBeatTargets(
    targetExercise,
    workoutHistory,
    programExercise.exerciseId,
    hydratedExercise,
  );

  const completedSets: CompletedSet[] = Array.from(
    { length: programExercise.sets },
    (_, index) => {
      const setNumber = index + 1;
      const target = targets.find(
        (candidate) => candidate.setNumber === setNumber,
      );
      const targetValue = target?.target ?? getConfigBaseline(programExercise);
      const actualValue = Math.max(1, targetValue + 1);

      const recoveryContext =
        setNumber === 1
          ? {}
          : {
              prescribedRestBeforeSet: 120,
              actualRestBeforeSet: 120,
              adaptiveRestAdjustmentBeforeSet: 0,
            };

      if (
        hydratedExercise.type === "hold" ||
        hydratedExercise.type === "time"
      ) {
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
    effortRating: 2, // About Right
  };
}

function getConfigBaseline(exercise: ProgramExercise): number {
  const config = exercise.config as any;

  if (config.durationSeconds != null) {
    return Math.max(1, Math.ceil(config.durationSeconds * 0.7));
  }

  if (config.minReps != null && config.maxReps != null) {
    return Math.max(1, Math.ceil((config.minReps + config.maxReps) / 2));
  }

  return 1;
}

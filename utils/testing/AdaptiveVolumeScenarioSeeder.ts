// utils/testing/AdaptiveVolumeScenarioSeeder.ts

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

export type AdaptiveVolumeLiveScenarioKind = "rating-4" | "rating-5";

export type AdaptiveVolumeLiveSeedResult = {
  scenarioId: string;
  programId: string;
  seededWorkoutCount: number;
  targetWeek: number;
  targetDay: number;
  instructions: string[];
};

/**
 * Seeds a clean Level-1 state at the beginning of human Week 3.
 *
 * Weeks 1 and 2 are genuine healthy completed sessions, so the live Week-3
 * workouts receive historical Match-or-Beat targets from persisted history.
 * No Week-3 adaptive evidence is pre-seeded: the user creates it live.
 */
export async function seedAdaptiveVolumeWeek3Scenario(
  kind: AdaptiveVolumeLiveScenarioKind,
  programId: string = "level1",
): Promise<AdaptiveVolumeLiveSeedResult> {
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
      `AdaptiveVolumeScenarioSeeder: program "${programId}" not found`,
    );
  }

  const program = programs[programIndex];
  const workoutHistory: CompletedSession[] = [];
  const workoutProgress: Record<
    string,
    { completedSets: number; totalSets: number; completed: boolean }
  > = {};

  // Human Weeks 1-2 => zero-based weekIndex 0-1.
  for (let weekIndex = 0; weekIndex < 2; weekIndex++) {
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
          `AdaptiveVolumeScenarioSeeder: failed to save Week ${
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
    week: 2, // human Week 3
    day: 0, // human Day 1
    workouts: workoutProgress,
    pendingGraduation: null,
    activeDeload: null,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  const instructions =
    kind === "rating-5"
      ? [
          "Train Week 3 Day 1 live and BEAT every displayed MB target.",
          "Choose Rating 5 on Day 1.",
          "Train Week 3 Day 2 live and BEAT the displayed MB targets.",
          "Choose Rating 4 or 5 on Day 2 to reach the weekly threshold.",
          "Adaptive Volume Coach should propose the Day-1 optional exercise plus eligible set changes.",
        ]
      : [
          "Train Week 3 Day 1 live and BEAT the displayed MB targets.",
          "Choose Rating 4 on Day 1. No Adaptive Coach should appear yet.",
          "Train Week 3 Day 2 live and BEAT the displayed MB targets.",
          "Choose Rating 4 on Day 2. The Adaptive Volume Coach should now appear.",
        ];

  console.log("🧪 ADAPTIVE VOLUME WEEK-3 LIVE STATE SEEDED", {
    kind,
    programId: program.id,
    seededWorkoutCount: workoutHistory.length,
    target: { week: 3, day: 1 },
    history: workoutHistory.map((session) => ({
      weekIndex: session.weekIndex,
      dayIndex: session.dayIndex,
      dayId: session.dayId,
      completedAt: session.completedAt,
    })),
  });

  return {
    scenarioId: `adaptive-volume-week3-${kind}`,
    programId: program.id,
    seededWorkoutCount: workoutHistory.length,
    targetWeek: 3,
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

  // Keep seeded history comfortably in the past so normal scheduling guidance
  // never mistakes these setup sessions for today's live training.
  const completedAt = new Date(
    Date.now() - (20 - sessionIndex) * 24 * 60 * 60 * 1000,
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
      comment: "Adaptive Volume live-test healthy baseline",
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
      const target = targets.find((candidate) => candidate.setNumber === setNumber);
      const targetValue = target?.target ?? getConfigBaseline(programExercise);
      const actualValue = Math.max(1, targetValue + 1);

      if (hydratedExercise.type === "hold" || hydratedExercise.type === "time") {
        return {
          setNumber,
          status: ItemStatus.Completed,
          durationSeconds: actualValue,
        };
      }

      if (programExercise.sideMode === "alternating") {
        return {
          setNumber,
          status: ItemStatus.Completed,
          repsLeft: actualValue,
          repsRight: actualValue,
        };
      }

      return {
        setNumber,
        status: ItemStatus.Completed,
        repsCompleted: actualValue,
      };
    },
  );

  return {
    exerciseId: programExercise.exerciseId,
    sets: completedSets,
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

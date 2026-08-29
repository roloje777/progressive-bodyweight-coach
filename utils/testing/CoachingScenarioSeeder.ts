// utils/testing/CoachingScenarioSeeder.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import { programs } from "@/data/programs";

import { hydrateExercise } from "@/utils/hydrateExercise";

import { getMatchOrBeatTargets } from "@/engine/MatchOrBeatEngine";

import {
  CompletedExercise,
  CompletedSession,
  CompletedSet,
  WorkoutFeedback,
} from "@/models/WorkoutLog";

import { Program, WorkoutDay } from "@/models/Program";

import { ProgramExercise } from "@/models/Exercise";

import { ItemStatus, WorkoutStatus } from "@/models/WorkoutStatus";
import { ActiveDeload } from "@/models/ProgramProgress";

import { saveWorkoutSession } from "@/storage/workoutStorage";

import { saveProgress } from "@/storage/progressStorage";

import {
  CoachingScenario,
  DirectCoachingScenario,
  HistoricalFeedbackOverride,
  SeedFeedback,
} from "@/tests/coachingScenarios";

// -----------------------------------
// STORAGE KEYS
// -----------------------------------
//
// These match the current storage files:
//
// workoutStorage.ts
// programEvaluationStorage.ts
// progressStorage.ts
// -----------------------------------

const WORKOUT_HISTORY_KEY = "workout_history";

const PROGRAM_EVALUATIONS_KEY = "program_evaluations";

const USER_PROGRESS_KEY = "USER_PROGRESS";

// -----------------------------------
// RESULT
// -----------------------------------

export type CoachingSeedResult = {
  scenarioId: string;

  programId: string;

  seededWorkoutCount: number;

  targetWeek: number;

  targetDay: number;

  finalPerformance: "meetOrBeat" | "failMatchOrBeat";

  finalFeedback: SeedFeedback;
};

// -----------------------------------
// RESET
// -----------------------------------

export async function resetCoachingTestData() {
  await AsyncStorage.multiRemove([
    WORKOUT_HISTORY_KEY,
    PROGRAM_EVALUATIONS_KEY,
    USER_PROGRESS_KEY,
  ]);

  console.log("🧹 Coaching test storage cleared");
}

// -----------------------------------
// PUBLIC SEED FUNCTION
// -----------------------------------

export async function seedCoachingScenario(
  scenario: CoachingScenario,
  programId: string = "level1",
): Promise<CoachingSeedResult> {
  await resetCoachingTestData();

  const programIndex = programs.findIndex(
    (program) => program.id === programId,
  );

  if (programIndex < 0) {
    throw new Error(`CoachingScenarioSeeder: program "${programId}" not found`);
  }

  const program = programs[programIndex];

  const workoutHistory: CompletedSession[] = [];

  const workoutProgress: Record<
    string,
    {
      completedSets: number;
      totalSets: number;
      completed: boolean;
    }
  > = {};

  // -----------------------------------
  // SEED HISTORY
  // -----------------------------------

  for (let weekIndex = 0; weekIndex < scenario.seedUntil.week; weekIndex++) {
    const isFinalSeedWeek = weekIndex === scenario.seedUntil.week - 1;

    const numberOfDays = isFinalSeedWeek
      ? scenario.seedUntil.day
      : program.days.length;

    for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
      const day = program.days[dayIndex];

      if (!day) {
        throw new Error(
          `Invalid seeded day: Week ${weekIndex + 1}, Day ${dayIndex + 1}`,
        );
      }

      const feedback = resolveHistoricalFeedback(
        scenario.historicalFeedback ?? [],
        weekIndex + 1,
        dayIndex + 1,
      );

      const session = createSeededWorkout(
        program,
        day,
        workoutHistory,
        feedback,
        workoutHistory.length,
        weekIndex,
        dayIndex,
      );
      /**
       * Use the real application storage API.
       */
      await saveWorkoutSession(session);

      workoutHistory.push(session);

      const totalSets = day.exercises.reduce(
        (total, exercise) => total + exercise.sets,
        0,
      );

      const progressKey = `${programIndex}-${weekIndex}-${dayIndex}`;

      workoutProgress[progressKey] = {
        completedSets: totalSets,

        totalSets,

        completed: true,
      };
    }
  }

  // -----------------------------------
  // POSITION APP AT NEXT WORKOUT
  // -----------------------------------
  //
  // Example:
  //
  // seedUntil:
  //
  // Week 4 Day 3
  //
  // becomes:
  //
  // week = 3
  // day  = 3
  //
  // because app progress is zero-based.
  // -----------------------------------

  const targetWeekIndex = scenario.seedUntil.week - 1;

  const targetDayIndex = scenario.seedUntil.day;

  if (targetDayIndex >= program.days.length) {
    throw new Error(
      [
        "CoachingScenarioSeeder:",
        "seedUntil already reaches the final day of the week.",
        "There is no remaining normal workout to complete.",
      ].join(" "),
    );
  }

  await saveProgress({
    programIndex,

    week: targetWeekIndex,

    day: targetDayIndex,

    workouts: workoutProgress,
  });

  console.log(
    "🗓️ SEEDED WORKOUT IDENTITIES",
    workoutHistory.map((workout, index) => ({
      session: index + 1,
      programId: workout.programId,
      weekIndex: workout.weekIndex,
      dayIndex: workout.dayIndex,
      dayId: workout.dayId,
    })),
  );

  console.log("🧪 COACHING SCENARIO SEEDED", {
    scenario: scenario.id,

    program: program.id,

    seededWorkoutCount: workoutHistory.length,

    nextWorkout: {
      week: targetWeekIndex + 1,

      day: targetDayIndex + 1,

      dayId: program.days[targetDayIndex]?.id,
    },

    finalPerformance: scenario.finalPerformance,

    finalFeedback: scenario.finalFeedback,

    expected: scenario.expected,
  });

  return {
    scenarioId: scenario.id,

    programId: program.id,

    seededWorkoutCount: workoutHistory.length,

    targetWeek: targetWeekIndex + 1,

    targetDay: targetDayIndex + 1,

    finalPerformance: scenario.finalPerformance,

    finalFeedback: scenario.finalFeedback,
  };
}

// -----------------------------------
// DIRECT DELOAD / VERIFICATION SEEDING
// -----------------------------------

export async function seedDirectCoachingScenario(
  scenario: DirectCoachingScenario,
  programId: string = "level1",
): Promise<CoachingSeedResult> {
  await resetCoachingTestData();

  const programIndex = programs.findIndex(
    (program) => program.id === programId,
  );

  if (programIndex < 0) {
    throw new Error(`CoachingScenarioSeeder: program "${programId}" not found`);
  }

  const program = programs[programIndex];
  const workoutHistory: CompletedSession[] = [];
  const workoutProgress: Record<
    string,
    {
      completedSets: number;
      totalSets: number;
      completed: boolean;
    }
  > = {};

  // Seed every normal workout in the finite Level 1 block.
  for (let weekIndex = 0; weekIndex < program.weeks; weekIndex++) {
    for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
      const day = program.days[dayIndex];

      const session = createSeededWorkout(
        program,
        day,
        workoutHistory,
        { rating: 3, tags: [], comment: "Direct-test healthy workout" },
        workoutHistory.length,
        weekIndex,
        dayIndex,
      );

      await saveWorkoutSession(session);
      workoutHistory.push(session);
      recordWorkoutProgress(
        workoutProgress,
        programIndex,
        weekIndex,
        dayIndex,
        day,
      );
    }
  }

  const triggeredAtWeekIndex = program.weeks - 1;
  const deloadWeekIndex = program.weeks;

  let activeDeload: ActiveDeload = {
    programId: program.id,
    reason: "fatigue",
    triggeredAtWeekIndex,
    deloadWeekIndex,
    phase: "deload",
    deloadTargetScale: 0.6,
    verificationTargetScale: 0.8,
    createdAt: new Date().toISOString(),
  };

  let targetWeekIndex = deloadWeekIndex;

  if (scenario.id === "fatigue-verification-direct") {
    // Seed a deliberately lower deload week into history. Verification must
    // ignore these performances and recover its 80% targets from Week 4.
    for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
      const day = program.days[dayIndex];

      const session = createSeededDeloadWorkout(
        program,
        day,
        workoutHistory,
        workoutHistory.length,
        deloadWeekIndex,
        dayIndex,
      );

      await saveWorkoutSession(session);
      workoutHistory.push(session);
      recordWorkoutProgress(
        workoutProgress,
        programIndex,
        deloadWeekIndex,
        dayIndex,
        day,
        session.exercises.reduce(
          (total, exercise) => total + exercise.sets.length,
          0,
        ),
      );
    }

    activeDeload = {
      ...activeDeload,
      phase: "verification",
      verificationWeekIndex: deloadWeekIndex + 1,
    };

    targetWeekIndex = deloadWeekIndex + 1;
  }

  await saveProgress({
    programIndex,
    week: targetWeekIndex,
    day: 0,
    workouts: workoutProgress,
    pendingGraduation: null,
    activeDeload,
  });

  console.log("⚡ DIRECT COACHING STATE SEEDED", {
    scenario: scenario.id,
    programId: program.id,
    seededWorkoutCount: workoutHistory.length,
    nextWorkout: {
      week: targetWeekIndex + 1,
      day: 1,
      dayId: program.days[0]?.id,
    },
    activeDeload,
  });

  return {
    scenarioId: scenario.id,
    programId: program.id,
    seededWorkoutCount: workoutHistory.length,
    targetWeek: targetWeekIndex + 1,
    targetDay: 1,
    finalPerformance: "meetOrBeat",
    finalFeedback: { rating: 3, tags: [] },
  };
}

function recordWorkoutProgress(
  workoutProgress: Record<
    string,
    {
      completedSets: number;
      totalSets: number;
      completed: boolean;
    }
  >,
  programIndex: number,
  weekIndex: number,
  dayIndex: number,
  day: WorkoutDay,
  totalSetsOverride?: number,
) {
  const totalSets =
    totalSetsOverride ??
    day.exercises.reduce((total, exercise) => total + exercise.sets, 0);

  workoutProgress[`${programIndex}-${weekIndex}-${dayIndex}`] = {
    completedSets: totalSets,
    totalSets,
    completed: true,
  };
}

function createSeededDeloadWorkout(
  program: Program,
  day: WorkoutDay,
  workoutHistory: CompletedSession[],
  workoutIndex: number,
  weekIndex: number,
  dayIndex: number,
): CompletedSession {
  const normalReference = createSeededWorkout(
    program,
    day,
    workoutHistory,
    { rating: 3, tags: [], comment: "Direct-test fatigue deload" },
    workoutIndex,
    weekIndex,
    dayIndex,
  );

  const exercises = normalReference.exercises.map((exercise) => {
    const programExercise = day.exercises.find(
      (candidate) => candidate.exerciseId === exercise.exerciseId,
    );

    const desiredSets = Math.max(1, (programExercise?.sets ?? exercise.sets.length) - 1);

    return {
      ...exercise,
      sets: exercise.sets.slice(0, desiredSets).map((set) =>
        scaleCompletedSet(set, 0.6),
      ),
    };
  });

  return {
    ...normalReference,
    exercises,
    trainingMode: "deload-fatigue",
    deload: {
      reason: "fatigue",
      phase: "deload",
      targetScale: 0.6,
    },
  };
}

function scaleCompletedSet(set: CompletedSet, scale: number): CompletedSet {
  const scaleValue = (value: number | undefined) =>
    value == null ? undefined : Math.max(1, Math.ceil(value * scale));

  return {
    ...set,
    durationSeconds: scaleValue(set.durationSeconds),
    durationLeft: scaleValue(set.durationLeft),
    durationRight: scaleValue(set.durationRight),
    repsCompleted: scaleValue(set.repsCompleted),
    repsLeft: scaleValue(set.repsLeft),
    repsRight: scaleValue(set.repsRight),
    reps:
      typeof set.reps === "number"
        ? Math.max(1, Math.ceil(set.reps * scale))
        : set.reps && typeof set.reps === "object"
          ? {
              left: Math.max(1, Math.ceil(set.reps.left * scale)),
              right: Math.max(1, Math.ceil(set.reps.right * scale)),
            }
          : set.reps,
  };
}

// -----------------------------------
// CREATE WORKOUT
// -----------------------------------
function createSeededWorkout(
  program: Program,
  day: WorkoutDay,
  workoutHistory: CompletedSession[],
  feedback: WorkoutFeedback,
  workoutIndex: number,
  weekIndex: number,
  dayIndex: number,
): CompletedSession {
  const exercises: CompletedExercise[] = day.exercises.map((programExercise) =>
    createSeededExercise(programExercise, workoutHistory),
  );

  /**
   * Deterministic timestamps.
   *
   * They only need to be chronological.
   */
  const baseTime = new Date("2026-01-01T08:00:00.000Z").getTime();

  const startWorkoutTime = baseTime + workoutIndex * 24 * 60 * 60 * 1000;

  const workoutDuration = 30 * 60;

  const endWorkoutTime = startWorkoutTime + workoutDuration * 1000;

  return {
    // -----------------------------------
    // PROGRAM LIFECYCLE IDENTITY
    // -----------------------------------

    programId: program.id,

    weekIndex,

    dayIndex,

    dayId: day.id,

    // -----------------------------------
    // WORKOUT STATUS
    // -----------------------------------

    status: WorkoutStatus.Completed,

    completedAt: new Date(endWorkoutTime).toISOString(),

    startWorkoutTime,

    endWorkoutTime,

    workoutDuration,

    /**
     * Test history does not need precise TUT.
     *
     * MB uses the set results.
     */
    timeUnderTension: 0,

    exercises,

    feedback,

    /**
     * Make seeded warm-up/stretch fully complete.
     *
     * This keeps seeded completion at 100% and
     * prevents completion from contaminating tests
     * whose purpose is pain/form/fatigue/MB.
     */
    warmup: {
      completed: ["seeded"],
      skipped: [],
      sectionSkipped: false,
    },

    stretch: {
      completed: ["seeded"],
      skipped: [],
      sectionSkipped: false,
    },

    sectionSkipped: false,
  };
}

// -----------------------------------
// CREATE EXERCISE
// -----------------------------------

function createSeededExercise(
  programExercise: ProgramExercise,
  workoutHistory: CompletedSession[],
): CompletedExercise {
  const hydratedExercise = hydrateExercise(programExercise);

  /**
   * Give MatchOrBeatEngine the set positions it
   * expects.
   *
   * There are intentionally no performance values
   * yet.
   */
  const targetExercise = {
    exerciseId: programExercise.exerciseId,

    sets: Array.from(
      {
        length: programExercise.sets,
      },
      (_, index) => ({
        setNumber: index + 1,

        status: ItemStatus.Pending,
      }),
    ),
  };

  const targets = getMatchOrBeatTargets(
    targetExercise,
    workoutHistory,
    programExercise.exerciseId,
    programExercise,
  );

  const completedSets: CompletedSet[] = targets.map((target, index) => {
    const setNumber = index + 1;

    /**
     * Seeded history always performs slightly
     * ABOVE the available target.
     *
     * This gives us a healthy, deterministic
     * progression history.
     */
    const targetValue = target.target ?? getConfigBaseline(programExercise);

    const actualValue = Math.max(1, targetValue + 1);

    // -----------------------------------
    // HOLD / TIME
    // -----------------------------------

    if (hydratedExercise.type === "hold" || hydratedExercise.type === "time") {
      return {
        setNumber,

        status: ItemStatus.Completed,

        durationSeconds: actualValue,
      };
    }

    // -----------------------------------
    // ALTERNATING REPS
    // -----------------------------------

    if (programExercise.sideMode === "alternating") {
      return {
        setNumber,

        status: ItemStatus.Completed,

        repsLeft: actualValue,

        repsRight: actualValue,
      };
    }

    // -----------------------------------
    // REPS / TEMPO
    // -----------------------------------

    return {
      setNumber,

      status: ItemStatus.Completed,

      repsCompleted: actualValue,
    };
  });

  return {
    exerciseId: programExercise.exerciseId,

    sets: completedSets,
  };
}

// -----------------------------------
// CONFIG BASELINE
// -----------------------------------
//
// Only used as a defensive fallback if
// MatchOrBeatEngine returns null.
//
// It mirrors the agreed initial target rules.
// -----------------------------------

function getConfigBaseline(exercise: ProgramExercise): number {
  const config = exercise.config as any;

  // HOLD
  if (config.durationSeconds != null) {
    return Math.max(1, Math.ceil(config.durationSeconds * 0.7));
  }

  // REPS / TEMPO
  if (config.minReps != null && config.maxReps != null) {
    return Math.max(1, Math.ceil((config.minReps + config.maxReps) / 2));
  }

  return 1;
}

// -----------------------------------
// FEEDBACK OVERRIDE
// -----------------------------------

function resolveHistoricalFeedback(
  overrides: HistoricalFeedbackOverride[],
  week: number,
  day: number,
): WorkoutFeedback {
  const override = overrides.find(
    (item) => item.week === week && item.day === day,
  );

  if (override) {
    return {
      rating: override.feedback.rating,

      tags: override.feedback.tags,

      comment: override.feedback.comment,
    };
  }

  /**
   * Normal historical workout.
   */
  return {
    rating: 3,

    tags: [],

    comment: "Seeded coaching test workout",
  };
}

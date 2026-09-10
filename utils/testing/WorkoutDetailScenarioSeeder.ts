import AsyncStorage from "@react-native-async-storage/async-storage";

import { programs } from "@/data/programs";
import { Program, WorkoutDay } from "@/models/Program";
import { ProgramExercise } from "@/models/Exercise";
import {
  CompletedExercise,
  CompletedSession,
  CompletedSet,
  TrainingMode,
  WorkoutReason,
} from "@/models/WorkoutLog";
import { ItemStatus, WorkoutStatus } from "@/models/WorkoutStatus";
import { saveWorkoutSession } from "@/storage/workoutStorage";

const WORKOUT_HISTORY_KEY = "workout_history";
const PROGRAM_EVALUATIONS_KEY = "program_evaluations";

export type WorkoutDetailScenarioId =
  | "normal"
  | "pain-recovery"
  | "deload"
  | "verification"
  | "repeat";

export type WorkoutDetailScenarioSummary = {
  id: WorkoutDetailScenarioId;
  title: string;
  week: number;
  day: number;
  dayTitle: string;
  trainingMode: TrainingMode;
  workoutReason: WorkoutReason;
};

export type WorkoutDetailScenarioSeedResult = {
  programId: string;
  programName: string;
  seededWorkoutCount: number;
  scenarios: WorkoutDetailScenarioSummary[];
  instructions: string[];
};

/**
 * Seeds five completed historical workouts specifically for visual/manual
 * testing of workoutDetail.tsx and its TXT / HTML / PDF exports.
 *
 * This intentionally clears workout history first so the History screen is
 * small, deterministic, and easy to compare.
 *
 * USER_PROGRESS is deliberately left untouched: these are historical-detail
 * fixtures, not lifecycle/progression fixtures.
 */
export async function seedWorkoutDetailScenarios(
  programId: string = "level1",
): Promise<WorkoutDetailScenarioSeedResult> {
  await AsyncStorage.multiRemove([
    WORKOUT_HISTORY_KEY,
    PROGRAM_EVALUATIONS_KEY,
  ]);

  const program = programs.find((candidate) => candidate.id === programId);

  if (!program) {
    throw new Error(
      `WorkoutDetailScenarioSeeder: program "${programId}" not found`,
    );
  }

  if (program.days.length === 0) {
    throw new Error(
      `WorkoutDetailScenarioSeeder: program "${programId}" has no workout days`,
    );
  }

  const definitions: Array<{
    id: WorkoutDetailScenarioId;
    title: string;
    weekIndex: number;
    dayIndex: number;
    trainingMode: TrainingMode;
    workoutReason: WorkoutReason;
  }> = [
    {
      id: "normal",
      title: "Normal Hypertrophy Workout",
      weekIndex: 0,
      dayIndex: 0,
      trainingMode: "normal",
      workoutReason: "scheduled",
    },
    {
      id: "pain-recovery",
      title: "Pain Recovery Workout",
      weekIndex: 1,
      dayIndex: Math.min(1, program.days.length - 1),
      trainingMode: "deload-pain",
      workoutReason: "scheduled",
    },
    {
      id: "deload",
      title: "Fatigue Deload Workout",
      weekIndex: 2,
      dayIndex: Math.min(2, program.days.length - 1),
      trainingMode: "deload-fatigue",
      workoutReason: "scheduled",
    },
    {
      id: "verification",
      title: "Verification Workout",
      weekIndex: 3,
      dayIndex: 0,
      trainingMode: "verification",
      workoutReason: "scheduled",
    },
    {
      id: "repeat",
      title: "Repeat Workout",
      weekIndex: 4,
      dayIndex: Math.min(1, program.days.length - 1),
      trainingMode: "normal",
      workoutReason: "repeat",
    },
  ];

  const seeded: WorkoutDetailScenarioSummary[] = [];

  for (let index = 0; index < definitions.length; index++) {
    const definition = definitions[index];
    const day = program.days[definition.dayIndex];

    const session = createScenarioSession({
      program,
      day,
      scenarioId: definition.id,
      weekIndex: definition.weekIndex,
      dayIndex: definition.dayIndex,
      scenarioIndex: index,
      workoutReason: definition.workoutReason,
    });

    const saved = await saveWorkoutSession(session);

    if (!saved) {
      throw new Error(
        `WorkoutDetailScenarioSeeder: failed to save ${definition.title}`,
      );
    }

    seeded.push({
      id: definition.id,
      title: definition.title,
      week: definition.weekIndex + 1,
      day: definition.dayIndex + 1,
      dayTitle: day.title,
      trainingMode: definition.trainingMode,
      workoutReason: definition.workoutReason,
    });
  }

  return {
    programId: program.id,
    programName: program.name,
    seededWorkoutCount: seeded.length,
    scenarios: seeded,
    instructions: [
      "Open Workout History. You should see exactly five seeded workouts.",
      "Open each workout and compare Week, Focus, Session Type, feedback and performance metrics.",
      "For Pain Recovery, confirm the recovery activity/context is shown and main exercise work is absent.",
      "For Deload, confirm the fatigue-deload reason and reduced workload are shown.",
      "For Verification, confirm the verification label and coaching context are shown.",
      "For Repeat, confirm Workout Reason is Repeat workout while Training Mode remains Standard workout.",
      "Export every scenario as TXT, HTML and PDF and compare the exported values with the Detail screen.",
    ],
  };
}

function createScenarioSession(args: {
  program: Program;
  day: WorkoutDay;
  scenarioId: WorkoutDetailScenarioId;
  weekIndex: number;
  dayIndex: number;
  scenarioIndex: number;
  workoutReason: WorkoutReason;
}): CompletedSession {
  const { program, day, scenarioId, weekIndex, dayIndex, scenarioIndex, workoutReason } = args;

  // Fixed dates make the fixture deterministic and keep all five records easy
  // to distinguish in History. Noon UTC avoids common date-boundary surprises.
  const endWorkoutTime = new Date(
    Date.UTC(2026, 7, 3 + scenarioIndex * 7, 12, 0, 0),
  ).getTime();

  const durationMinutes =
    scenarioId === "pain-recovery"
      ? 22
      : scenarioId === "deload"
        ? 31
        : scenarioId === "verification"
          ? 39
          : scenarioId === "repeat"
            ? 43
            : 46;

  const startWorkoutTime = endWorkoutTime - durationMinutes * 60 * 1000;

  if (scenarioId === "pain-recovery") {
    return {
      programId: program.id,
      dayId: day.id,
      weekIndex,
      dayIndex,
      status: WorkoutStatus.Completed,
      completedAt: new Date(endWorkoutTime).toISOString(),
      startWorkoutTime,
      endWorkoutTime,
      workoutDuration: durationMinutes * 60,
      timeUnderTension: 0,
      exercises: [],
      feedback: {
        rating: 3,
        tags: ["joint-discomfort"],
        comment:
          "Seeded Detail test: mild shoulder discomfort, so the prescribed pain-recovery session was completed instead of normal training.",
      },
      warmup: {
        completed: ["seeded-mobility-prep"],
        skipped: [],
        sectionSkipped: false,
      },
      stretch: {
        completed: ["seeded-gentle-stretch"],
        skipped: [],
        sectionSkipped: false,
      },
      sectionSkipped: true,
      workoutReason,
      trainingMode: "deload-pain",
      deload: {
        reason: "pain",
        phase: "deload",
        targetScale: 0,
      },
      recoveryActivity: {
        type: "guided-mobility",
        durationMinutes: 18,
        completed: true,
        notes: "Upper-body mobility and pain-free range-of-motion work.",
      },
      warmupStartedAt: startWorkoutTime,
      warmupCompletedAt: startWorkoutTime + 4 * 60 * 1000,
      mainStartedAt: startWorkoutTime + 4 * 60 * 1000,
      mainCompletedAt: endWorkoutTime - 2 * 60 * 1000,
      stretchStartedAt: endWorkoutTime - 2 * 60 * 1000,
      stretchCompletedAt: endWorkoutTime,
    };
  }

  const intensityScale =
    scenarioId === "deload" ? 0.6 : scenarioId === "verification" ? 0.8 : 1;

  const setReduction = scenarioId === "deload" ? 1 : 0;

  const exercises = day.exercises
    .filter((exercise) => exercise.optional !== true)
    .map((exercise, exerciseIndex) =>
      createCompletedExercise(
        exercise,
        exerciseIndex,
        intensityScale,
        setReduction,
      ),
    );

  const timeUnderTension = exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce((setTotal, set) => {
        if (set.durationSeconds != null) return setTotal + set.durationSeconds;
        if (set.durationLeft != null || set.durationRight != null) {
          return setTotal + (set.durationLeft ?? 0) + (set.durationRight ?? 0);
        }
        if (set.phaseDurations?.length) {
          return setTotal + set.phaseDurations.reduce((sum, value) => sum + value, 0);
        }
        return setTotal;
      }, 0),
    0,
  );

  const trainingMode: TrainingMode =
    scenarioId === "deload"
      ? "deload-fatigue"
      : scenarioId === "verification"
        ? "verification"
        : "normal";

  return {
    programId: program.id,
    dayId: day.id,
    weekIndex,
    dayIndex,
    status: WorkoutStatus.Completed,
    completedAt: new Date(endWorkoutTime).toISOString(),
    startWorkoutTime,
    endWorkoutTime,
    workoutDuration: durationMinutes * 60,
    timeUnderTension,
    exercises,
    feedback:
      scenarioId === "normal"
        ? {
            rating: 4,
            tags: ["good-pump"],
            comment:
              "Seeded Detail test: strong normal session with controlled technique and good pump.",
          }
        : scenarioId === "repeat"
          ? {
              rating: 4,
              tags: ["good-energy"],
              comment:
                "Seeded Detail test: optional repeat-week workout completed after choosing Train Another Week.",
            }
          : scenarioId === "deload"
            ? {
                rating: 3,
                tags: ["low-energy"],
                comment:
                  "Seeded Detail test: fatigue deload completed with reduced sets and targets.",
              }
            : {
                rating: 4,
                tags: ["good-energy"],
                comment:
                  "Seeded Detail test: post-deload verification completed at the verification target.",
              },
    warmup: {
      completed: ["seeded-dynamic-warmup-1", "seeded-dynamic-warmup-2"],
      skipped: [],
      sectionSkipped: false,
    },
    stretch: {
      completed: ["seeded-static-stretch-1", "seeded-static-stretch-2"],
      skipped: [],
      sectionSkipped: false,
    },
    sectionSkipped: false,
    workoutReason,
    trainingMode,
    ...(scenarioId === "deload"
      ? {
          deload: {
            reason: "fatigue" as const,
            phase: "deload" as const,
            targetScale: 0.6,
          },
        }
      : scenarioId === "verification"
        ? {
            deload: {
              reason: "fatigue" as const,
              phase: "verification" as const,
              targetScale: 0.8,
            },
          }
        : {}),
    warmupStartedAt: startWorkoutTime,
    warmupCompletedAt: startWorkoutTime + 6 * 60 * 1000,
    mainStartedAt: startWorkoutTime + 6 * 60 * 1000,
    mainCompletedAt: endWorkoutTime - 5 * 60 * 1000,
    stretchStartedAt: endWorkoutTime - 5 * 60 * 1000,
    stretchCompletedAt: endWorkoutTime,
  };
}

function createCompletedExercise(
  exercise: ProgramExercise,
  exerciseIndex: number,
  intensityScale: number,
  setReduction: number,
): CompletedExercise {
  const desiredSets = Math.max(1, exercise.sets - setReduction);

  const sets: CompletedSet[] = Array.from({ length: desiredSets }, (_, index) =>
    createCompletedSet(exercise, index + 1, exerciseIndex, intensityScale),
  );

  return {
    exerciseId: exercise.exerciseId,
    sets,
    effortRating: intensityScale < 1 ? 2 : exerciseIndex === 0 ? 3 : 2,
  };
}

function createCompletedSet(
  exercise: ProgramExercise,
  setNumber: number,
  exerciseIndex: number,
  intensityScale: number,
): CompletedSet {
  const config = exercise.config as any;
  const restBase = 90 + exerciseIndex * 10;

  const shared = {
    setNumber,
    status: ItemStatus.Completed,
    prescribedRestBeforeSet: setNumber === 1 ? undefined : restBase,
    actualRestBeforeSet:
      setNumber === 1 ? undefined : restBase + (setNumber % 2 === 0 ? 5 : -5),
    adaptiveRestAdjustmentBeforeSet: setNumber === 1 ? undefined : 0,
  };

  if (typeof config.durationSeconds === "number") {
    const duration = Math.max(5, Math.round(config.durationSeconds * intensityScale));

    if (exercise.sideMode === "alternating") {
      return {
        ...shared,
        durationLeft: duration,
        durationRight: Math.max(5, duration - (setNumber === 3 ? 1 : 0)),
      };
    }

    return {
      ...shared,
      durationSeconds: duration,
    };
  }

  const minReps = typeof config.minReps === "number" ? config.minReps : 6;
  const maxReps = typeof config.maxReps === "number" ? config.maxReps : minReps + 4;
  const midpoint = Math.round((minReps + maxReps) / 2);
  const reps = Math.max(1, Math.round((midpoint + 1 - (setNumber - 1)) * intensityScale));

  if (exercise.sideMode === "alternating") {
    return {
      ...shared,
      repsLeft: reps,
      repsRight: Math.max(1, reps - (setNumber === 3 ? 1 : 0)),
    };
  }

  return {
    ...shared,
    repsCompleted: reps,
  };
}

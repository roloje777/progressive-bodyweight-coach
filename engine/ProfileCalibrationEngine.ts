import { ExercisePerformanceProfile } from "../models/ExercisePerformanceProfile";
import { CompletedWorkout } from "../models/WorkoutLog";
import { HydratedExercise } from "../models/Exercise";

export function buildExercisePerformanceProfile(
  exercise: HydratedExercise,
  workoutHistory: CompletedWorkout[],
  previousProfile?: ExercisePerformanceProfile,
): ExercisePerformanceProfile | null {
  if (!workoutHistory.length) {
    return null;
  }

  // ---------------------------------
  // FIND MOST RECENT MATCHED EXERCISE
  // ---------------------------------
  let matchedExercise: any = null;

  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    const found = workout.exercises.find((e) => e.exerciseId === exercise.id);

    if (found) {
      matchedExercise = found;
      break;
    }
  }

  if (!matchedExercise || !matchedExercise.sets.length) {
    return null;
  }

  // ---------------------------------
  // EXTRACT PERFORMANCE VALUES
  // ---------------------------------
  const values: number[] = [];

  matchedExercise.sets.forEach((set: any) => {
    // bilateral reps
    if (set.repsCompleted != null) {
      values.push(set.repsCompleted);
    }

    // unilateral reps
    else if (set.repsLeft != null && set.repsRight != null) {
      values.push(Math.round((set.repsLeft + set.repsRight) / 2));
    }

    // bilateral holds
    else if (set.durationSeconds != null) {
      values.push(set.durationSeconds);
    }

    // unilateral holds
    else if (set.durationLeft != null && set.durationRight != null) {
      values.push(Math.round((set.durationLeft + set.durationRight) / 2));
    }
  });

  if (!values.length) {
    return null;
  }

  // ---------------------------------
  // METRICS
  // ---------------------------------
  const total = values.reduce((a, b) => a + b, 0);

  const avg = Math.round(total / values.length);

  // ---------------------------------
  // 🆕 TREND HISTORY
  // ---------------------------------

  const previousAvgHistory = previousProfile?.trend?.avgHistory ?? [];

  const avgHistory = [...previousAvgHistory, avg].slice(-8); // keep last 8 entries

  const best = Math.max(...values);

  const lowest = Math.min(...values);

  // fatigue dropoff
  const fatigueDropoff =
    best > 0 ? Number(((best - lowest) / best).toFixed(2)) : 0;

  // consistency
  const consistencyScore = best > 0 ? Number((lowest / best).toFixed(2)) : 0;

  // completion
  // const completionRate = Number((values.length / exercise.sets).toFixed(2));
  const totalSets = exercise.sets || values.length || 1;

  const completionRate = Number((values.length / totalSets).toFixed(2));

  // readiness
  const readinessScore = Math.round(
    consistencyScore * 40 + completionRate * 40 + (1 - fatigueDropoff) * 20,
  );

  const previousReadinessHistory =
    previousProfile?.trend?.readinessHistory ?? [];

  const readinessHistory = [...previousReadinessHistory, readinessScore].slice(
    -8,
  );

  // ---------------------------------
  // RECOMMENDED RANGE
  // ---------------------------------
  const recommendedMin = Math.max(3, Math.floor(avg * 0.8));

  const recommendedMax = Math.ceil(avg * 1.4);

  // ---------------------------------
  // PROFILE
  // ---------------------------------
  const profile: ExercisePerformanceProfile = {
    exerciseId: exercise.id,

    calibrated: true,

    baseline: {
      avgReps: exercise.type !== "hold" ? avg : undefined,

      bestReps: exercise.type !== "hold" ? best : undefined,

      lowestReps: exercise.type !== "hold" ? lowest : undefined,

      avgHold: exercise.type === "hold" ? avg : undefined,

      bestHold: exercise.type === "hold" ? best : undefined,

      lowestHold: exercise.type === "hold" ? lowest : undefined,
    },

    recommendedRange: {
      min: recommendedMin,
      max: recommendedMax,
    },

    progressionMetrics: {
      consistencyScore,
      fatigueDropoff,
      completionRate,
    },

    readinessScore,

    // currentBlockWeek: 1,

    // weeksAtCurrentLevel: 1,

    currentBlockWeek: (previousProfile?.currentBlockWeek ?? 0) + 1,

    weeksAtCurrentLevel: (previousProfile?.weeksAtCurrentLevel ?? 0) + 1,

    // graduationEligible: false,

    // updatedAt: new Date().toISOString(),
    graduationEligible: false,

    trend: {
      avgHistory,
      readinessHistory,
    },

    updatedAt: new Date().toISOString(),
  };

  return profile;
}

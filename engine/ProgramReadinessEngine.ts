import { CompletedWorkout } from "../models/WorkoutLog";
import { ProgramReadinessReport } from "../models/ProgramReadinessReport";

export function evaluateProgramReadiness(
  workoutHistory: CompletedWorkout[],
): ProgramReadinessReport {
  // -----------------------------------
  // NO HISTORY
  // -----------------------------------

  if (!workoutHistory.length) {
    return {
      readinessScore: 0,

      mbSuccessRate: 0,

      completionRate: 0,

      fatigueStability: 0,

      recoveryScore: 0,

      sorenessScore: 0,

      painScore: 0,

      averageDifficulty: 0,

      recommendation: "repeat",

      reasons: ["No workout history"],
    };
  }

  // -----------------------------------
  // FILTER VALID FEEDBACK
  // -----------------------------------

  const feedbackWorkouts = workoutHistory.filter(
    (w) => w.feedback,
  );

  // Prevent divide-by-zero
  const feedbackCount =
    feedbackWorkouts.length > 0
      ? feedbackWorkouts.length
      : 1;

  // -----------------------------------
  // RECOVERY
  // -----------------------------------

  const avgRecovery =
    feedbackWorkouts.reduce(
      (acc, w) => acc + (w.feedback?.recoveryRating || 0),
      0,
    ) / feedbackCount;

  // -----------------------------------
  // SORENESS
  // -----------------------------------

  const avgSoreness =
    feedbackWorkouts.reduce(
      (acc, w) => acc + (w.feedback?.sorenessRating || 0),
      0,
    ) / feedbackCount;

  // -----------------------------------
  // JOINT PAIN
  // -----------------------------------

  const avgPain =
    feedbackWorkouts.reduce(
      (acc, w) => acc + (w.feedback?.jointPainRating || 0),
      0,
    ) / feedbackCount;

  // -----------------------------------
  // DIFFICULTY
  // -----------------------------------

  const avgDifficulty =
    feedbackWorkouts.reduce(
      (acc, w) =>
        acc + (w.feedback?.perceivedDifficulty || 0),
      0,
    ) / feedbackCount;

  // -----------------------------------
  // COMPLETION RATE
  // V1 = exercise-level completion
  // -----------------------------------

  let completedExercises = 0;
  let totalExercises = 0;

  workoutHistory.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      totalExercises++;

      if (exercise.sets.length > 0) {
        completedExercises++;
      }
    });
  });

  const completionRate =
    totalExercises > 0
      ? completedExercises / totalExercises
      : 0;

  // -----------------------------------
  // FATIGUE STABILITY
  // V1 = set consistency
  // Higher score = more stable performance
  // -----------------------------------

  let consistencyTotal = 0;
  let consistencyEntries = 0;

  workoutHistory.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const setValues: number[] = [];

      exercise.sets.forEach((set: any) => {
        // bilateral reps
        if (set.repsCompleted != null) {
          setValues.push(set.repsCompleted);
        }

        // unilateral reps
        else if (
          set.repsLeft != null &&
          set.repsRight != null
        ) {
          setValues.push(
            Math.round(
              (set.repsLeft + set.repsRight) / 2,
            ),
          );
        }

        // bilateral holds
        else if (set.durationSeconds != null) {
          setValues.push(set.durationSeconds);
        }

        // unilateral holds
        else if (
          set.durationLeft != null &&
          set.durationRight != null
        ) {
          setValues.push(
            Math.round(
              (set.durationLeft + set.durationRight) /
                2,
            ),
          );
        }
      });

      // Need at least 2 sets for stability analysis
      if (setValues.length >= 2) {
        const best = Math.max(...setValues);

        const lowest = Math.min(...setValues);

        // Higher = better stability
        const setConsistency =
          best > 0
            ? Number((lowest / best).toFixed(2))
            : 0;

        consistencyTotal += setConsistency;

        consistencyEntries++;
      }
    });
  });

  const fatigueStability =
    consistencyEntries > 0
      ? Number(
          (
            consistencyTotal / consistencyEntries
          ).toFixed(2),
        )
      : 0;

  // -----------------------------------
  // MB SUCCESS RATE
  // TODO: real MB calculation
  // -----------------------------------

  const mbSuccessRate = 0.85;

  // -----------------------------------
  // READINESS SCORE
  // -----------------------------------

  const rawReadinessScore =
    completionRate * 30 +
    fatigueStability * 25 +
    (avgRecovery / 5) * 20 +
    (1 - avgPain / 5) * 15 +
    (1 - avgDifficulty / 5) * 10;

  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round(rawReadinessScore)),
  );

  // -----------------------------------
  // RECOMMENDATION
  // -----------------------------------

  let recommendation:
    | "advance"
    | "repeat"
    | "deload" = "repeat";

  const reasons: string[] = [];

  // ADVANCE
  if (
    readinessScore >= 80 &&
    completionRate >= 0.9 &&
    fatigueStability >= 0.75 &&
    avgPain <= 2
  ) {
    recommendation = "advance";

    reasons.push("Strong readiness");
    reasons.push("Stable fatigue");
    reasons.push("High completion");
    reasons.push("Recovery indicators good");
  }

  // DELOAD
  else if (
    readinessScore < 50 ||
    avgPain >= 4 ||
    avgRecovery <= 2
  ) {
    recommendation = "deload";

    reasons.push("Poor recovery");
    reasons.push("High fatigue/pain");
    reasons.push("Reduced readiness");
  }

  // REPEAT
  else {
    recommendation = "repeat";

    reasons.push("Adaptation still in progress");
    reasons.push("Continue current progression");
  }

  // -----------------------------------
  // FINAL REPORT
  // -----------------------------------

  return {
    readinessScore,

    mbSuccessRate,

    completionRate,

    fatigueStability,

    recoveryScore: Number(avgRecovery.toFixed(2)),

    sorenessScore: Number(avgSoreness.toFixed(2)),

    painScore: Number(avgPain.toFixed(2)),

    averageDifficulty: Number(
      avgDifficulty.toFixed(2),
    ),

    recommendation,

    reasons,
  };
}
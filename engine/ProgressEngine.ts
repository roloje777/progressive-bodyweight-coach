import { CompletedWorkout } from "../models/WorkoutLog";
import { Exercise, RepConfig, TempoConfig } from "../models/Exercise";

export function getNextExerciseConfig(
  exercise: Exercise,
  lastWorkout: CompletedWorkout | null
): Exercise {
  console.log("------ 🧠 PROGRESSION ENGINE ------");
  console.log("Exercise:", exercise.name);

  if (!lastWorkout) {
    console.log("No workout history → no changes");
    return exercise;
  }

  const feedback = (lastWorkout as any).feedback;

  if (!feedback || feedback.rating == null) {
    console.log("No feedback → no changes");
    return exercise;
  }

  const { rating, tags = [] } = feedback;

  const updated: Exercise = {
    ...exercise,
    config: { ...exercise.config },
  };

  // -----------------------------
  // 📊 EXERCISE HISTORY
  // -----------------------------
  const exerciseHistory = lastWorkout.exercises.find(
    (e) => e.exerciseId === exercise.id
  );

  if (!exerciseHistory || exerciseHistory.sets.length === 0) {
    console.log("No history for this exercise → no changes");
    return exercise;
  }

  const totalSets = exerciseHistory.sets.length;
  const expectedSets = exercise.sets;

  const completedAllSets = totalSets >= expectedSets;

  // -----------------------------
  // 📊 METRICS
  // -----------------------------
  const avgReps =
    exerciseHistory.sets.reduce((acc, s) => {
      if (s.repsCompleted != null) return acc + s.repsCompleted;
      if (s.repsLeft != null && s.repsRight != null) {
        return acc + (s.repsLeft + s.repsRight) / 2;
      }
      return acc;
    }, 0) / totalSets;

  const avgHold =
    exerciseHistory.sets.reduce((acc, s) => {
      if (s.durationSeconds != null) return acc + s.durationSeconds;
      if (s.durationLeft != null && s.durationRight != null) {
        return acc + (s.durationLeft + s.durationRight) / 2;
      }
      return acc;
    }, 0) / totalSets;

  // -----------------------------
  // 🧠 FLAGS (SAFE)
  // -----------------------------
  const maxReps =
    exercise.type === "reps" || exercise.type === "tempo"
      ? (exercise.config as RepConfig | TempoConfig).maxReps
      : undefined;

  const isTooEasy =
    (rating >= 4 && completedAllSets) ||
    (maxReps !== undefined && avgReps >= maxReps);

  const isTooHard = rating <= 2 || !completedAllSets;

  const badForm = tags.includes("Form broke down");

  console.log("Metrics:", {
    totalSets,
    expectedSets,
    completedAllSets,
    avgReps,
    avgHold,
  });

  console.log("Flags:", {
    isTooEasy,
    isTooHard,
    badForm,
  });

  // -----------------------------
  // 🔢 REPS
  // -----------------------------
  if (exercise.type === "reps") {
    const config = updated.config as RepConfig;

    if (isTooEasy) {
      config.minReps += 1;
      config.maxReps += 2;
    }

    if (isTooHard) {
      config.minReps = Math.max(3, config.minReps - 1);
      config.maxReps = Math.max(config.minReps + 1, config.maxReps - 2);
    }

    if (badForm) {
      config.maxReps = Math.max(config.minReps, config.maxReps - 1);
    }
  }

  // -----------------------------
  // ⏱ TEMPO
  // -----------------------------
  if (exercise.type === "tempo") {
    const config = updated.config as TempoConfig;

    if (isTooEasy) {
      config.minReps += 1;
      config.maxReps += 2;
      config.eccentric += 1;
    }

    if (isTooHard) {
      config.minReps = Math.max(3, config.minReps - 1);
      config.maxReps = Math.max(config.minReps + 1, config.maxReps - 2);
      config.eccentric = Math.max(1, config.eccentric - 1);
    }

    if (badForm) {
      config.maxReps = Math.max(config.minReps, config.maxReps - 1);
    }
  }

  // -----------------------------
  // ⏳ HOLD
  // -----------------------------
  if (exercise.type === "hold") {
    const config = updated.config as any;

    if (isTooEasy && avgHold >= config.durationSeconds) {
      config.durationSeconds += 5;
    }

    if (isTooHard) {
      config.durationSeconds = Math.max(5, config.durationSeconds - 5);
    }

    if (badForm) {
      config.durationSeconds = Math.max(5, config.durationSeconds - 3);
    }
  }

  // -----------------------------
  // 📦 SETS
  // -----------------------------
  if (isTooEasy && completedAllSets && exercise.sets < 5) {
    updated.sets += 1;
  }

  if (isTooHard && !completedAllSets && exercise.sets > 2) {
    updated.sets -= 1;
  }

  console.log("Final sets:", updated.sets);
  console.log("------ ✅ END ENGINE ------\n");

  return updated;
}
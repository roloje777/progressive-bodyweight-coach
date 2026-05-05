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

  console.log("Feedback rating:", rating);
  console.log("Feedback tags:", tags);

  const updated: Exercise = {
    ...exercise,
    config: { ...exercise.config },
  };

  const isTooEasy = rating >= 4 || tags.includes("Too easy");
  const isTooHard = rating <= 2 || tags.includes("Couldn’t finish all sets");
  const badForm = tags.includes("Form broke down");

  console.log("Flags:", {
    isTooEasy,
    isTooHard,
    badForm,
  });

  // -----------------------------
  // REPS
  // -----------------------------
  if (exercise.type === "reps") {
    const config = updated.config as RepConfig;

    console.log("Before:", { ...config });

    if (isTooEasy) {
      config.minReps += 1;
      config.maxReps += 2;
      console.log("Applied: +reps");
    }

    if (isTooHard) {
      config.minReps = Math.max(3, config.minReps - 1);
      config.maxReps = Math.max(config.minReps + 1, config.maxReps - 2);
      console.log("Applied: -reps");
    }

    if (badForm) {
      config.maxReps = Math.max(config.minReps, config.maxReps - 1);
      console.log("Applied: form correction");
    }

    console.log("After:", { ...config });
  }

  // -----------------------------
  // TEMPO
  // -----------------------------
  if (exercise.type === "tempo") {
    const config = updated.config as TempoConfig;

    console.log("Before:", { ...config });

    if (isTooEasy) {
      config.minReps += 1;
      config.maxReps += 2;
      config.eccentric += 1;
      console.log("Applied: +reps +eccentric");
    }

    if (isTooHard) {
      config.minReps = Math.max(3, config.minReps - 1);
      config.maxReps = Math.max(config.minReps + 1, config.maxReps - 2);
      config.eccentric = Math.max(1, config.eccentric - 1);
      console.log("Applied: -reps -eccentric");
    }

    if (badForm) {
      config.maxReps = Math.max(config.minReps, config.maxReps - 1);
      console.log("Applied: form correction");
    }

    console.log("After:", { ...config });
  }

  // -----------------------------
  // SETS
  // -----------------------------
  console.log("Sets before:", exercise.sets);

  if (isTooEasy && exercise.sets < 5) {
    updated.sets += 1;
    console.log("Applied: +set");
  }

  if (isTooHard && exercise.sets > 2) {
    updated.sets -= 1;
    console.log("Applied: -set");
  }

  console.log("Sets after:", updated.sets);
  console.log("------ ✅ END ENGINE ------\n");

  return updated;
}
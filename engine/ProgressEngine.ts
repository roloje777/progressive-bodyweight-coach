import { CompletedWorkout } from "../models/WorkoutLog";
import { Exercise, RepConfig, TempoConfig } from "../models/Exercise";
import { getMatchOrBeatTargets } from "./MatchOrBeatEngine";

export function getNextExerciseConfig(
  exercise: Exercise,
  workoutHistory: CompletedWorkout[],
): Exercise {
  console.log("------ 🧠 PROGRESSION ENGINE ------");
  console.log("Exercise:", exercise.name);

  if (!workoutHistory || workoutHistory.length === 0) {
    console.log("No workout history → no changes");
    return exercise;
  }

  // -----------------------------
  // 🔍 SEARCH FULL HISTORY (latest → oldest)
  // -----------------------------
  let matchedExerciseHistory = null;
  let matchedWorkout: CompletedWorkout | null = null;

  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    const match = workout.exercises.find((e) => e.exerciseId === exercise.id);

    if (match) {
      matchedExerciseHistory = match;
      matchedWorkout = workout;

      console.log("✅ MATCH FOUND IN HISTORY");
      console.log("Matched workout date:", workout.date);
      console.log("Matched exercise:", exercise.name);

      break;
    }
  }

  // -----------------------------
  // ❌ NO MATCH FOUND
  // -----------------------------
  if (!matchedExerciseHistory || matchedExerciseHistory.sets.length === 0) {
    console.log("No history for this exercise → no changes");
    return exercise;
  }

  // -----------------------------
  // 🧠 FEEDBACK FROM MATCHED WORKOUT
  // -----------------------------
  const feedback = (matchedWorkout as any)?.feedback;

  if (!feedback || feedback.rating == null) {
    console.log("No feedback → no changes");
    return exercise;
  }

  const { rating, tags = [] } = feedback;

  // -----------------------------
  // 🧬 CLONE EXERCISE (avoid mutation bugs)
  // -----------------------------
  const updated: Exercise = {
    ...exercise,
    config: { ...exercise.config },
  };

  updated.matchOrBeatTargets = getMatchOrBeatTargets(matchedExerciseHistory);
  const usingMB =
    updated.matchOrBeatTargets && updated.matchOrBeatTargets.length > 0;

  const originalSets = exercise.sets;

  const originalConfig = JSON.parse(JSON.stringify(exercise.config));

  // -----------------------------
  // 📊 METRICS
  // -----------------------------
  const totalSets = matchedExerciseHistory.sets.length;
  const expectedSets = exercise.sets;

  const completedAllSets = totalSets >= expectedSets;

  const avgReps =
    matchedExerciseHistory.sets.reduce((acc, s) => {
      if (s.repsCompleted != null) return acc + s.repsCompleted;
      if (s.repsLeft != null && s.repsRight != null) {
        return acc + (s.repsLeft + s.repsRight) / 2;
      }
      return acc;
    }, 0) / totalSets;

  const avgHold =
    matchedExerciseHistory.sets.reduce((acc, s) => {
      if (s.durationSeconds != null) return acc + s.durationSeconds;
      if (s.durationLeft != null && s.durationRight != null) {
        return acc + (s.durationLeft + s.durationRight) / 2;
      }
      return acc;
    }, 0) / totalSets;

  // -----------------------------
  // 🧠 FLAGS
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

    console.log("\n🔢 REPS ANALYSIS");

    if (!usingMB) {
      if (isTooEasy) {
        console.log("⬆️ Progression Triggered");
        config.minReps += 1;
        config.maxReps += 2;
      } else if (isTooHard) {
        console.log("⬇️ Regression Triggered");

        const newMin = Math.max(3, config.minReps - 1);
        const newMax = Math.max(newMin + 1, config.maxReps - 2);

        config.minReps = newMin;
        config.maxReps = newMax;
      } else if (badForm) {
        console.log("⚠️ Form Breakdown Triggered");

        config.maxReps = Math.max(config.minReps, config.maxReps - 1);
      }
    } else {
      console.log("🧠 MB ACTIVE → REPS PROGRESSION DISABLED");
    }
  }
  // -----------------------------
  // ⏱ TEMPO
  // -----------------------------
  if (exercise.type === "tempo") {
    const config = updated.config as TempoConfig;

    if (!usingMB) {
      if (isTooEasy) {
        config.minReps += 1;
        config.maxReps += 2;
        config.eccentric = Math.min(6, config.eccentric + 1);
      }

      if (isTooHard) {
        config.minReps = Math.max(3, config.minReps - 1);
        config.maxReps = Math.max(config.minReps + 1, config.maxReps - 2);
        config.eccentric = Math.max(1, config.eccentric - 1);
      }

      if (badForm) {
        config.maxReps = Math.max(config.minReps, config.maxReps - 1);
      }
    } else {
      console.log("🧠 MB ACTIVE → TEMPO PROGRESSION DISABLED");
    }
  }

  // -----------------------------
  // ⏳ HOLD
  // -----------------------------
  if (exercise.type === "hold") {
    const config = updated.config as any;

    console.log("\n⏳ HOLD ANALYSIS");

    if (!usingMB) {
      if (isTooEasy && avgHold >= config.durationSeconds) {
        console.log("⬆️ Progression Triggered");
        config.durationSeconds += 5;
      }

      if (isTooHard) {
        console.log("⬇️ Regression Triggered");

        const newDuration = Math.max(5, config.durationSeconds - 5);
        config.durationSeconds = newDuration;
      }

      if (badForm) {
        console.log("⚠️ Form Breakdown Triggered");

        const newDuration = Math.max(5, config.durationSeconds - 3);
        config.durationSeconds = newDuration;
      }
    } else {
      console.log("🧠 MB ACTIVE → HOLD PROGRESSION DISABLED");
    }
  }
  // -----------------------------
  // 📦 SETS
  // -----------------------------
  if (!usingMB) {
    if (isTooEasy && completedAllSets && exercise.sets < 5) {
      updated.sets += 1;
    }

    if (isTooHard && !completedAllSets && exercise.sets > 2) {
      updated.sets -= 1;
    }
  } else {
    console.log("🧠 MB ACTIVE → SET PROGRESSION DISABLED");
  }

  if (updated.sets !== originalSets) {
    console.log("\n📦 SET CHANGE");

    if (updated.sets > originalSets) {
      console.log("⬆️ Sets Increased");
      console.log("Reason: Workout too easy");
    } else {
      console.log("⬇️ Sets Reduced");
      console.log("Reason: Workout too hard");
    }

    console.log(`sets: ${originalSets} → ${updated.sets}`);
  } else {
    console.log("\n📦 Sets unchanged");
  }

  console.log("\n🧾 FINAL CONFIG DIFF");

  const configChanged =
    JSON.stringify(originalConfig) !== JSON.stringify(updated.config);

  if (configChanged) {
    updated.matchOrBeatTargets = [];
  }

  console.log("Before:", JSON.stringify(originalConfig));

  console.log("After:", JSON.stringify(updated.config));
  console.log("------ ✅ END ENGINE ------\n");

  return updated;
}

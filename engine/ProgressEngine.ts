//ProgressEngine.ts
import { CompletedSession } from "../models/WorkoutLog";
import { HydratedExercise, RepConfig, TempoConfig } from "../models/Exercise";
import { getMatchOrBeatTargets } from "./MatchOrBeatEngine";
import { buildExercisePerformanceProfile } from "./ProfileCalibrationEngine";

export function getNextExerciseConfig(
  exercise: HydratedExercise,
  workoutHistory: CompletedSession[],
): HydratedExercise {
  
  

  /**
   * A newly activated optional exercise gets one true baseline exposure.
   * Even if the same exerciseId exists elsewhere in historical training,
   * this day-specific adaptive introduction must not inherit an MB target.
   */
  if (exercise.adaptiveBaselineOnly) {
    

    return {
      ...exercise,
      matchOrBeatTargets: [],
    };
  }

  if (!workoutHistory || workoutHistory.length === 0) {
    
    return exercise;
  }

  // -----------------------------
  // 🔍 SEARCH FULL HISTORY (latest → oldest)
  // -----------------------------
  let matchedExerciseHistory = null;
  let matchedWorkout: CompletedSession | null = null;

  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    const match = workout.exercises.find((e) => e.exerciseId === exercise.id);

    if (match) {
      matchedExerciseHistory = match;
      matchedWorkout = workout;

      
      
      

      break;
    }
  }

  // -----------------------------
  // ❌ NO MATCH FOUND
  // -----------------------------
  if (!matchedExerciseHistory || matchedExerciseHistory.sets.length === 0) {
    
    return exercise;
  }

  matchedExerciseHistory = {
    ...matchedExerciseHistory,
    sets: matchedExerciseHistory.sets.filter(
      (set) => set.excludeFromProgression !== true,
    ),
  };

  if (matchedExerciseHistory.sets.length === 0) {
    return exercise;
  }

  // -----------------------------
  // 🧠 FEEDBACK FROM MATCHED WORKOUT
  // -----------------------------
  const feedback = (matchedWorkout as any)?.feedback;

  if (!feedback || feedback.rating == null) {
    
    return exercise;
  }

  const { rating, tags = [] } = feedback;

  // -----------------------------
  // 🧬 CLONE EXERCISE (avoid mutation bugs)
  // -----------------------------
  const updated: HydratedExercise = {
    ...exercise,
    config: { ...exercise.config },
  };

  // updated.performanceProfile =
  // buildExercisePerformanceProfile(
  //   exercise,
  //   workoutHistory,
  // ) || undefined;

  updated.performanceProfile =
    buildExercisePerformanceProfile(
      exercise,
      workoutHistory,
      exercise.performanceProfile,
    ) || undefined;

  updated.matchOrBeatTargets = getMatchOrBeatTargets(
    matchedExerciseHistory,
    workoutHistory,
    exercise.id,
  );

  const usingMB =
    updated.matchOrBeatTargets?.some(
      (target) => target.target !== null && target.target > 0,
    ) ?? false;

  const originalSets = exercise.sets;

  const originalConfig = JSON.parse(JSON.stringify(exercise.config));

  // -----------------------------
  // 📊 METRICS
  // -----------------------------

  const expectedSets = exercise.sets;

  const skippedSets = matchedExerciseHistory.sets.filter(
    (set) => set.status === "skipped",
  );

  const completedSets = matchedExerciseHistory.sets.filter(
    (set) => set.status !== "skipped",
  );

  const completedAllSets = completedSets.length >= expectedSets;

  // -----------------------------
  // REPS METRICS
  // -----------------------------
  const repSets = matchedExerciseHistory.sets.filter(
    (s) =>
      s.repsCompleted != null || (s.repsLeft != null && s.repsRight != null),
  );

  

  

  repSets.forEach((set, index) => {
    
  });

  const avgReps =
    repSets.length > 0
      ? repSets.reduce((acc, s, index) => {
          let value: number = 0;

          if (typeof s.repsCompleted === "number") {
            value = s.repsCompleted;
          } else if (typeof s.reps === "number") {
            value = s.reps;
          } else if (
            typeof s.repsLeft === "number" &&
            typeof s.repsRight === "number"
          ) {
            value = (s.repsLeft + s.repsRight) / 2;
          }

          if (!Number.isFinite(value)) {
            console.error("🚨 INVALID REP VALUE", {
              index,
              set: s,
              value,
            });
          }

          return acc + value;
        }, 0) / repSets.length
      : 0;

  // -----------------------------
  // HOLD METRICS
  // -----------------------------
  const holdSets = matchedExerciseHistory.sets.filter(
    (s) =>
      s.durationSeconds != null ||
      (s.durationLeft != null && s.durationRight != null),
  );

  const avgHold =
    holdSets.length > 0
      ? holdSets.reduce((acc, s) => {
          if (s.durationSeconds != null) {
            return acc + s.durationSeconds;
          }

          if (s.durationLeft != null && s.durationRight != null) {
            return acc + (s.durationLeft + s.durationRight) / 2;
          }

          return acc;
        }, 0) / holdSets.length
      : 0;

  // -----------------------------
  // 🧠 FLAGS
  // -----------------------------
  const maxReps =
    exercise.type === "reps" || exercise.type === "tempo"
      ? (exercise.config as RepConfig | TempoConfig).maxReps
      : undefined;

  // const isTooEasy =
  //   (rating >= 4 && completedAllSets) ||
  //   (maxReps !== undefined && avgReps >= maxReps);

  // const isTooHard = rating <= 2 || !completedAllSets;

  const isTooHard = rating <= 2 || !completedAllSets;

  const isTooEasy =
    !isTooHard &&
    ((rating >= 4 && completedAllSets) ||
      (maxReps !== undefined && avgReps >= maxReps));

  const badForm = tags.includes("Form broke down");

  

  

  // -----------------------------
  // 🔢 REPS
  // -----------------------------
  if (exercise.type === "reps") {
    const config = updated.config as RepConfig;

    

    if (!usingMB) {
      if (isTooEasy) {
        
        config.minReps += 1;
        config.maxReps += 2;
      } else if (isTooHard) {
        

        const newMin = Math.max(3, config.minReps - 1);
        const newMax = Math.max(newMin + 1, config.maxReps - 2);

        config.minReps = newMin;
        config.maxReps = newMax;
      } else if (badForm) {
        

        config.maxReps = Math.max(config.minReps, config.maxReps - 1);
      }
    } else {
      
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
      
    }
  }

  // -----------------------------
  // ⏳ HOLD
  // -----------------------------
  if (exercise.type === "hold") {
    const config = updated.config as any;

    

    if (!usingMB) {
      if (isTooEasy && avgHold >= config.durationSeconds) {
        
        config.durationSeconds += 5;
      }

      if (isTooHard) {
        

        const newDuration = Math.max(5, config.durationSeconds - 5);
        config.durationSeconds = newDuration;
      }

      if (badForm) {
        

        const newDuration = Math.max(5, config.durationSeconds - 3);
        config.durationSeconds = newDuration;
      }
    } else {
      
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
    
  }

  if (updated.sets !== originalSets) {
    

    if (updated.sets > originalSets) {
      
      
    } else {
      
      
    }

    
  } else {
    
  }

  

  const configChanged =
    JSON.stringify(originalConfig) !== JSON.stringify(updated.config);

  if (configChanged) {
    updated.matchOrBeatTargets = [];
  }

  

  
  

  return updated;
}

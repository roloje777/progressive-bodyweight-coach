import { HoldConfig, RepConfig, TempoConfig } from "../models/Exercise";
import { WorkoutDay } from "../models/Program";
import { exerciseRegistry } from "../data/exerciseRegistry";

export function estimateWorkoutDuration(
  day: WorkoutDay,
  restBetweenSets: number = 20,
  restBetweenExercises: number = 30,
): number {
  let totalSeconds = 0;

  day.exercises.forEach((exercise, index) => {
    const sets = exercise.sets;
    const type = exerciseRegistry[exercise.exerciseId]?.type;
    let secondsPerSet = 0;

    // HOLD EXERCISE
    if (type === "hold") {
      const cfg = exercise.config as HoldConfig;
      secondsPerSet = cfg.durationSeconds;
    }

    // TEMPO EXERCISE
    if (type === "tempo") {
      const cfg = exercise.config as TempoConfig;

      const repTime =
        cfg.eccentric +
        (cfg.pauseEccentric ?? 0) +
        cfg.concentric +
        (cfg.pauseConcentric ?? 0);

      const avgReps = Math.round((cfg.minReps + cfg.maxReps) / 2);

      secondsPerSet = repTime * avgReps;
    }

    // REPS EXERCISE
    if (type === "reps") {
      const cfg = exercise.config as RepConfig;

      const avgReps = Math.round((cfg.minReps + cfg.maxReps) / 2);
      const avgRepTime = 2; // seconds per rep estimate

      secondsPerSet = avgReps * avgRepTime;
    }

    totalSeconds += secondsPerSet * sets;

    // Rest between sets
    totalSeconds += restBetweenSets * (sets - 1);

    // Rest between exercises
    if (index < day.exercises.length - 1) {
      totalSeconds += restBetweenExercises;
    }
  });

  return Math.round(totalSeconds / 60);
}
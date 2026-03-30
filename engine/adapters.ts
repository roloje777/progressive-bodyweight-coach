import { Exercise } from "../models/Exercise";
import { WarmUpRoutine } from "../models/warmUp";
import { StretchRoutine } from "../models/stretchRoutine";

// 🔁 Warmup → Exercise
export function mapWarmupToExercises(routine: WarmUpRoutine): Exercise[] {
  return routine.exercises.map((ex) => {
    if (ex.type === "time") {
      return {
        id: ex.id,
        name: ex.name,
        type: "hold",
        sets: 1,
        config: {
          durationSeconds: ex.config.durationSeconds,
        },
      };
    }

    return {
      id: ex.id,
      name: ex.name,
      type: "reps",
      sets: 1,
      config: {
        minReps: ex.config.reps,
        maxReps: ex.config.reps,
      },
    };
  });
}

export function mapStretchToExercises(routine: StretchRoutine): Exercise[] {
  return routine.exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    type: "hold",
    sets: 1,
    config: {
      durationSeconds: ex.config.durationSeconds,
    },
  }));
}


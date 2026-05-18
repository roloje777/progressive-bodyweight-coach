import {
  ProgramExercise,
  HoldConfig,
  RepConfig,
} from "../models/Exercise";

import {
  WarmUpRoutine,
  WarmUpTimeConfig,
  WarmUpRepConfig,
} from "../models/warmUp";

import { StretchRoutine } from "../models/stretchRoutine";

// 🔁 Warmup → ProgramExercise
export function mapWarmupToExercises(
  routine: WarmUpRoutine,
): ProgramExercise[] {
  return routine.exercises.map((ex) => {
    // TIME-BASED WARMUP
    if ("durationSeconds" in ex.config) {
      const config: HoldConfig = {
        durationSeconds:
          (ex.config as WarmUpTimeConfig)
            .durationSeconds,
      };

      return {
        exerciseId: ex.exerciseId,
        sets: 1,
        config,
      };
    }

    // REP-BASED WARMUP
    const config: RepConfig = {
      minReps:
        (ex.config as WarmUpRepConfig).reps,

      maxReps:
        (ex.config as WarmUpRepConfig).reps,
    };

    return {
      exerciseId: ex.exerciseId,
      sets: 1,
      config,
    };
  });
}

// 🔁 Stretch → ProgramExercise
export function mapStretchToExercises(
  routine: StretchRoutine,
): ProgramExercise[] {
  return routine.exercises.map((ex) => ({
    exerciseId: ex.exerciseId,

    sets: 1,

    config: {
      durationSeconds:
        ex.config.durationSeconds,
    },
  }));
}
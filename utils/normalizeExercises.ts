// utils/normalizeExercises.ts

import { Exercise, HoldConfig, RepConfig, TempoConfig } from "../models/Exercise";
import { WarmUpExercise } from "../models/warmUp";

// 🔥 Unified runtime model
export type NormalizedExercise = {
  id: string;
  name: string;
  sets: number;
  secondsPerSet: number;
   category: "warmup" | "main" | "stretch";
};

// ------------------------
// MAIN WORKOUT
// ------------------------
export function normalizeWorkoutExercise(ex: Exercise): NormalizedExercise {
  let secondsPerSet = 0;

  if (ex.type === "hold") {
    secondsPerSet = (ex.config as HoldConfig)?.durationSeconds ?? 0;
  }

  if (ex.type === "tempo") {
    const cfg = ex.config as TempoConfig;

    const repTime =
      (cfg?.eccentric ?? 0) +
      (cfg?.pauseEccentric ?? 0) +
      (cfg?.concentric ?? 0) +
      (cfg?.pauseConcentric ?? 0);

    const avgReps = Math.round(((cfg?.minReps ?? 0) + (cfg?.maxReps ?? 0)) / 2);

    secondsPerSet = repTime * avgReps;
  }

  if (ex.type === "reps") {
    const cfg = ex.config as RepConfig;

    const avgReps = Math.round(((cfg?.minReps ?? 0) + (cfg?.maxReps ?? 0)) / 2);

    const avgRepTime = 3;

    secondsPerSet = avgReps * avgRepTime;
  }

  return {
    id: ex.id,
    name: ex.name,
    sets: ex.sets ?? 1,
    secondsPerSet,
    category: "main",
  };
}

// ------------------------
// WARMUP
// ------------------------
export function normalizeWarmupExercise(ex: any): NormalizedExercise {
  let secondsPerSet = 0;

  // 🔥 HOLD (this is your "time" warmups now)
  if (ex.type === "hold") {
    const duration = ex?.config?.durationSeconds ?? 0;
    secondsPerSet = duration;
  }

  // 🔥 REPS (now uses min/max like main workout)
  if (ex.type === "reps") {
    const cfg = ex.config ?? {};

    const avgReps = Math.round(
      ((cfg.minReps ?? 0) + (cfg.maxReps ?? 0)) / 2
    );

    const avgRepTime = 3;

    secondsPerSet = avgReps * avgRepTime;
  }

  // 🔥 TEMPO (just in case you ever add it)
  if (ex.type === "tempo") {
    const cfg = ex.config ?? {};

    const repTime =
      (cfg.eccentric ?? 0) +
      (cfg.pauseEccentric ?? 0) +
      (cfg.concentric ?? 0) +
      (cfg.pauseConcentric ?? 0);

    const avgReps = Math.round(
      ((cfg.minReps ?? 0) + (cfg.maxReps ?? 0)) / 2
    );

    secondsPerSet = repTime * avgReps;
  }

  // 🔥 Debug safety
  if (secondsPerSet === 0) {
    console.warn("⚠️ Warmup not parsed correctly:", ex);
  }

  return {
    id: ex.id,
    name: ex.name,
    sets: ex.sets ?? 1,
    secondsPerSet,
    category: "warmup",
  };
}

// ------------------------
// STRETCH
// ------------------------
export function normalizeStretchExercise(ex: any): NormalizedExercise {
  const duration =
    ex?.config?.durationSeconds ??
    ex?.config?.duration ??   // 👈 fallback (VERY LIKELY YOUR BUG)
    0;

  const multiplier = ex?.config?.perSide ? 2 : 1;

  return {
    id: ex.id,
    name: ex.name,
    sets: 1,
    secondsPerSet: duration * multiplier,
    category: "stretch",
  };
}
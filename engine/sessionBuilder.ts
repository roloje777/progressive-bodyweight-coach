import { Program } from "../models/Program";
import { dynamicWarmUp } from "../data/dynamicWarmUp";
import { staticStretches } from "../data/staticStretches";

import {
  mapWarmupToExercises,
  mapStretchToExercises,
} from "./adapters";

export type WorkoutBlockType = "warmup" | "main" | "stretch";

export type WorkoutBlock = {
  id: string;
  type: WorkoutBlockType;
  title: string;
  exercises: any[];
};

export type WorkoutSession = {
  dayIndex: number;
  blocks: WorkoutBlock[];

    // 🔥 NEW
  results?: {
    warmupCompleted?: boolean;
    workout?: CompletedWorkout;
    stretchCompleted?: boolean;
  };
};

export function buildSession(
  program: Program,
  dayIndex: number,
  options: {
    includeWarmup: boolean;
    includeStretch: boolean;
  }
): WorkoutSession {
  const day = program.days[dayIndex];

  if (!day) {
    throw new Error("Invalid dayIndex");
  }

  const blocks: WorkoutBlock[] = [];

if (options.includeWarmup) {
  blocks.push({
    id: "warmup",
    type: "warmup",
    title: dynamicWarmUp.title,
    exercises: mapWarmupToExercises(dynamicWarmUp),
  });
}

  blocks.push({
    id: "main",
    type: "main",
    title: day.title,
    exercises: day.exercises,
  });

if (options.includeStretch) {
  blocks.push({
    id: "stretch",
    type: "stretch",
    title: staticStretches.title,
    exercises: mapStretchToExercises(staticStretches),
  });
}

  return {
    dayIndex,
    blocks,
  };
}
//engine/sessionBuilder.ts
import { Program } from "../models/Program";
import { dynamicWarmUp } from "../data/dynamicWarmUp";
import { staticStretches } from "../data/staticStretches";
import { CompletedSession} from "../models/WorkoutLog";

import {
  mapWarmupToExercises,
  mapStretchToExercises,
} from "./adapters";
import { ItemStatus, WorkoutStatus } from "../models/WorkoutStatus";

export type WorkoutBlockType = "warmup" | "main" | "stretch";



export type WorkoutBlock = {
  id: string;
  type: WorkoutBlockType;
  title: string;

  status: ItemStatus;

   // NEW
  startedAt?: number;
  completedAt?: number;

  exercises: any[];
};

export type WorkoutSession = {
  dayIndex: number;
  status: WorkoutStatus;
  blocks: WorkoutBlock[];

    // 🔥 NEW
  results?: {
    warmupCompleted?: boolean;
    workout?: CompletedSession;
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
     status: ItemStatus.Pending,
    exercises: mapWarmupToExercises(dynamicWarmUp),
  });
}

  blocks.push({
    id: "main",
    type: "main",
    title: day.title,
      status: ItemStatus.Pending,
    exercises: day.exercises,
  });

if (options.includeStretch) {
  blocks.push({
    id: "stretch",
    type: "stretch",
    title: staticStretches.title,
     status: ItemStatus.Pending,
    exercises: mapStretchToExercises(staticStretches),
  });
}

  return {
    dayIndex,
    status: WorkoutStatus.InProgress,
    blocks,
  };
}


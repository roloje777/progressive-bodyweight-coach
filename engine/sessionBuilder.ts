//engine/sessionBuilder.ts
import { Program } from "../models/Program";
import { dynamicWarmUp } from "../data/dynamicWarmUp";
import { staticStretches } from "../data/staticStretches";
import { CompletedSession } from "../models/WorkoutLog";
import {
  AdaptiveProgramState,
  EMPTY_ADAPTIVE_PROGRAM_STATE,
  getAdaptiveExerciseKey,
} from "../models/AdaptiveVolume";

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
    adaptiveVolume?: AdaptiveProgramState;
    completedSessions?: CompletedSession[];
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

  const adaptiveVolume =
    options.adaptiveVolume ?? EMPTY_ADAPTIVE_PROGRAM_STATE;

  /**
   * The static program remains the source of the base prescription.
   * Adaptive state is user-specific and is layered on top only when it has
   * already been accepted/persisted.
   *
   * Optional exercises stay completely outside the live prescription until
   * their day-specific activation exists. Once active, they become ordinary
   * prescribed exercises for completion/readiness purposes.
   */
  const prescribedMainExercises = day.exercises
    .filter((exercise) => {
      if (!exercise.optional) {
        return true;
      }

      const key = getAdaptiveExerciseKey(
        program.id,
        day.id,
        exercise.exerciseId,
      );

      return adaptiveVolume.activatedOptionalExercises[key] != null;
    })
    .map((exercise) => {
      const key = getAdaptiveExerciseKey(
        program.id,
        day.id,
        exercise.exerciseId,
      );

      const override = adaptiveVolume.setOverrides[key];
      const activation = adaptiveVolume.activatedOptionalExercises[key];

      const hasPostActivationExposure =
        exercise.optional && activation
          ? (options.completedSessions ?? []).some(
              (session) =>
                session.programId === program.id &&
                session.dayId === day.id &&
                session.weekIndex != null &&
                session.weekIndex >= activation.activatedAtWeekIndex &&
                session.exercises.some(
                  (completedExercise) =>
                    completedExercise.exerciseId === exercise.exerciseId &&
                    (completedExercise.sets?.length ?? 0) > 0,
                ),
            )
          : true;

      return {
        ...exercise,
        ...(override ? { sets: override.sets } : {}),
        ...(exercise.optional && activation && !hasPostActivationExposure
          ? { adaptiveBaselineOnly: true }
          : {}),
      };
    });

  blocks.push({
    id: "main",
    type: "main",
    title: day.title,
    status: ItemStatus.Pending,
    exercises: prescribedMainExercises,
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


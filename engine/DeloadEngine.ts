// engine/DeloadEngine.ts

import {
  HydratedExercise,
  MatchOrBeatTarget,
} from "@/models/Exercise";
import {
  ActiveDeload,
  DeloadReason,
} from "@/models/ProgramProgress";
import {
  DeloadWorkoutMetadata,
  TrainingMode,
} from "@/models/WorkoutLog";

export const FATIGUE_DELOAD_TARGET_SCALE = 0.6;
export const VERIFICATION_TARGET_SCALE = 0.8;
export const FATIGUE_REST_MULTIPLIER = 1.5;


export type DeloadWorkoutContext = {
  trainingMode: TrainingMode;
  metadata: DeloadWorkoutMetadata;
  reason: DeloadReason;
  phase: "deload" | "verification";
  targetScale: number;
  restMultiplier: number;
  matchOrBeatEnabled: boolean;
};

/**
 * Resolve the persisted deload state into the training mode for
 * the program/week currently being opened.
 */
export function getDeloadWorkoutContext(
  activeDeload: ActiveDeload | null | undefined,
  programId: string,
  weekIndex: number,
): DeloadWorkoutContext | null {
  if (!activeDeload || activeDeload.programId !== programId) {
    return null;
  }

  if (
    activeDeload.phase === "deload" &&
    weekIndex === activeDeload.deloadWeekIndex
  ) {
    const trainingMode = `deload-${activeDeload.reason}` as TrainingMode;

    return {
      trainingMode,
      metadata: {
        reason: activeDeload.reason,
        phase: "deload",
        targetScale:
          activeDeload.reason === "pain"
            ? 0
            : activeDeload.deloadTargetScale,
      },
      reason: activeDeload.reason,
      phase: "deload",
      targetScale:
        activeDeload.reason === "pain"
          ? 0
          : activeDeload.deloadTargetScale,
      restMultiplier:
        activeDeload.reason === "pain"
          ? 1
          : FATIGUE_REST_MULTIPLIER,
      matchOrBeatEnabled: false,
    };
  }

  if (
    activeDeload.phase === "verification" &&
    activeDeload.verificationWeekIndex != null &&
    weekIndex === activeDeload.verificationWeekIndex
  ) {
    return {
      trainingMode: "verification",
      metadata: {
        reason: activeDeload.reason,
        phase: "verification",
        targetScale: activeDeload.verificationTargetScale,
      },
      reason: activeDeload.reason,
      phase: "verification",
      targetScale: activeDeload.verificationTargetScale,
      restMultiplier: 1,
      matchOrBeatEnabled: true,
    };
  }

  return null;
}

/**
 * Apply the temporary recovery/verification prescription to one
 * already-hydrated exercise. Historical MB data is never mutated.
 */
export function applyDeloadExercisePrescription(
  exercise: HydratedExercise,
  context: DeloadWorkoutContext | null,
): HydratedExercise | null {
  if (!context) {
    return exercise;
  }

  if (context.phase === "verification") {
    return applyVerificationTargets([exercise])[0] ?? exercise;
  }

  if (context.reason === "pain") {
    return null;
  }

  return (
    buildReducedLoadDeloadPrescription(
      [exercise],
      context.reason as Extract<DeloadReason, "fatigue" | "form" | "recovery">,
    ).exercises[0] ?? exercise
  );
}

export type DeloadPrescription = {
  reason: DeloadReason;

  /** Main exercises to perform. Pain recovery intentionally returns none. */
  exercises: HydratedExercise[];

  requireWarmup: boolean;
  requireStretch: boolean;

  restBetweenSetsMultiplier: number;
  restBetweenExercisesMultiplier: number;

  matchOrBeatEnabled: boolean;
  updatesMatchOrBeatBaseline: boolean;

  targetScale: number;
};

function scaleTarget(
  target: MatchOrBeatTarget,
  scale: number,
): MatchOrBeatTarget {
  if (target.target == null || target.target <= 0) {
    return target;
  }

  return {
    ...target,
    target: Math.max(1, Math.ceil(target.target * scale)),
  };
}

/**
 * Fatigue / form / general-recovery deload.
 *
 * Agreed prescription:
 * - same exercise selection
 * - one fewer set per exercise, minimum one
 * - 60% of the existing healthy MB target
 * - 1.5x rest
 * - warm-up and stretch required
 * - no MB challenge / no baseline update
 */
export function buildReducedLoadDeloadPrescription(
  exercises: HydratedExercise[],
  reason: Extract<DeloadReason, "fatigue" | "form" | "recovery"> = "fatigue",
): DeloadPrescription {
  return {
    reason,

    exercises: exercises.map((exercise) => ({
      ...exercise,
      sets: Math.max(1, exercise.sets - 1),
      config: { ...exercise.config } as HydratedExercise["config"],
      matchOrBeatTargets: (exercise.matchOrBeatTargets ?? []).map((target) =>
        scaleTarget(target, FATIGUE_DELOAD_TARGET_SCALE),
      ),
    })),

    requireWarmup: true,
    requireStretch: true,

    restBetweenSetsMultiplier: FATIGUE_REST_MULTIPLIER,
    restBetweenExercisesMultiplier: FATIGUE_REST_MULTIPLIER,

    matchOrBeatEnabled: false,
    updatesMatchOrBeatBaseline: false,

    targetScale: FATIGUE_DELOAD_TARGET_SCALE,
  };
}

/**
 * Pain recovery deliberately does not prescribe reduced
 * versions of the normal strength work.
 *
 * The later recovery UI can offer pain-free mobility /
 * warm-up work, appropriate stretching, or light active
 * recovery such as walking/cycling.
 */
export function buildPainDeloadPrescription(): DeloadPrescription {
  return {
    reason: "pain",
    exercises: [],

    requireWarmup: true,
    requireStretch: true,

    restBetweenSetsMultiplier: 1,
    restBetweenExercisesMultiplier: 1,

    matchOrBeatEnabled: false,
    updatesMatchOrBeatBaseline: false,

    targetScale: 0,
  };
}

/**
 * Verification is deliberately easier than the healthy
 * pre-deload baseline. It uses 80% of those targets.
 *
 * Unlike a deload workout, a healthy verification workout
 * may become useful future history after it is completed.
 */
export function applyVerificationTargets(
  exercises: HydratedExercise[],
): HydratedExercise[] {
  return exercises.map((exercise) => ({
    ...exercise,
    config: { ...exercise.config } as HydratedExercise["config"],
    matchOrBeatTargets: (exercise.matchOrBeatTargets ?? []).map((target) =>
      scaleTarget(target, VERIFICATION_TARGET_SCALE),
    ),
  }));
}

export function createActiveDeload(
  programId: string,
  triggeredAtWeekIndex: number,
  reason: DeloadReason,
): ActiveDeload {
  return {
    programId,
    reason,
    triggeredAtWeekIndex,
    deloadWeekIndex: triggeredAtWeekIndex + 1,
    phase: "deload",
    deloadTargetScale: FATIGUE_DELOAD_TARGET_SCALE,
    verificationTargetScale: VERIFICATION_TARGET_SCALE,
    createdAt: new Date().toISOString(),
  };
}

export function moveDeloadToVerification(
  activeDeload: ActiveDeload,
): ActiveDeload {
  return {
    ...activeDeload,
    phase: "verification",
    verificationWeekIndex: activeDeload.deloadWeekIndex + 1,
  };
}

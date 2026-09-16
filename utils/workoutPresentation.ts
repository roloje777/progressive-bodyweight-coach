import { CompletedSession } from "../models/WorkoutLog";

type ProgramLike = {
  weeks: number;
  progressionMode?: string;
};

export type WorkoutStatusTone =
  | "normal"
  | "repeat"
  | "deload"
  | "recovery"
  | "verification"
  | "maintenance";

export type WorkoutStatusPresentation = {
  label: string;
  tone: WorkoutStatusTone;
};

/**
 * Derives a user-facing lifecycle label from persisted workout metadata.
 * No display-only status is stored separately from the completed session.
 */
export function getWorkoutStatusPresentation(
  workout: CompletedSession,
  program?: ProgramLike,
): WorkoutStatusPresentation {
  const mode = workout.trainingMode ?? "normal";

  if (mode === "deload-pain") {
    return { label: "PAIN RECOVERY", tone: "recovery" };
  }

  if (mode === "verification") {
    return { label: "VERIFICATION", tone: "verification" };
  }

  if (mode === "deload-fatigue") {
    return { label: "DELOAD · FATIGUE", tone: "deload" };
  }

  if (mode === "deload-form") {
    return { label: "DELOAD · FORM", tone: "deload" };
  }

  if (mode === "deload-recovery") {
    return { label: "DELOAD · RECOVERY", tone: "deload" };
  }

  if (workout.workoutReason === "repeat") {
    return { label: "REPEAT", tone: "repeat" };
  }

  if (
    program?.progressionMode === "maintenance" &&
    workout.weekIndex != null &&
    workout.weekIndex >= program.weeks
  ) {
    return { label: "MAINTENANCE", tone: "maintenance" };
  }

  return { label: "NORMAL", tone: "normal" };
}

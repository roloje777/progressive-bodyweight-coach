import {
  CompletedExercise,
  RecoveryHistorySummary,
  RecoveryHistoryMethod,
} from "@/models/WorkoutLog";
import { RecoveryInterruptionKind } from "@/models/WorkoutRecovery";

export function buildRecoveryHistorySummary(input: {
  exercises: CompletedExercise[];
  recoveryRoute?: string | string[];
  interruptionKind?: RecoveryInterruptionKind;
}): RecoveryHistorySummary | undefined {
  const sets = input.exercises.flatMap((exercise) => exercise.sets ?? []);
  const manualSets = sets.filter((set) => set.entrySource === "manualRecovery");
  const manualSetCount = manualSets.length;
  const advisoryConfirmedCount = manualSets.filter(
    (set) => set.advisoryConfirmed === true,
  ).length;
  const excludedFromProgressionCount = manualSets.filter(
    (set) => set.excludeFromProgression === true,
  ).length;

  const routeValue = Array.isArray(input.recoveryRoute)
    ? input.recoveryRoute[0]
    : input.recoveryRoute;

  /**
   * The route marker is useful while navigating, but it is transient and can
   * be dropped as a resumed workout moves through workoutRunner/stretch/etc.
   *
   * A persisted processRestart interruption is therefore the fallback source
   * of truth for a live Resume Workout. An explicit "manual" route must remain
   * manual rather than being reclassified as mixed merely because the original
   * interruption was a process restart.
   */
  const hasExplicitRecoveryRoute =
    routeValue === "true" ||
    routeValue === "resumed" ||
    routeValue === "manual";

  const resumed =
    routeValue === "true" ||
    routeValue === "resumed" ||
    (!hasExplicitRecoveryRoute &&
      input.interruptionKind === "processRestart");

  const manual = routeValue === "manual" || manualSetCount > 0;

  if (!resumed && !manual) return undefined;

  let method: RecoveryHistoryMethod = "resumed";
  if (manual && resumed) method = "mixed";
  else if (manual) method = "manual";

  return {
    occurred: true,
    method,
    manualSetCount,
    advisoryConfirmedCount,
    excludedFromProgressionCount,
    interruptionKind: input.interruptionKind,
  };
}

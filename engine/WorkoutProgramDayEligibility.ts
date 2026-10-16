/** Historical compatibility: older records lack progressionResult.
 * Explicit Phase 3M failed attempts never count as completed program days.
 * Phase 3N retry outcomes are also excluded, even at 100% set completion. */
export function qualifiesAsCompletedProgramDay(workout: {
  trainingMode?: string | null;
  progressionResult?: { status?: string; advanceDay?: boolean; outcome?: string } | null;
}): boolean {
  if (workout.trainingMode && workout.trainingMode !== "normal") return false;
  const result = workout.progressionResult;
  if (result?.outcome === "mandatory_recovery_retry" || result?.outcome === "incomplete_retry" || result?.outcome === "deload_verification" || result?.outcome === "pain_coach") return false;
  if (result?.status === "unavailable") return false;
  if (result?.status === "available" && result.advanceDay !== true) return false;
  // Legacy workouts without explicit decision are retained for compatibility.
  return true;
}

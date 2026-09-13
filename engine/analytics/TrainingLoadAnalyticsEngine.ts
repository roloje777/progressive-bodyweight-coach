import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { TrainingLoadAnalytics } from "@/models/analytics/TrainingLoadAnalytics";
import { CompletedSession } from "@/models/WorkoutLog";
import { filterByAnalyticsTimeRange, getRawCompletedSetValue, round } from "./analyticsUtils";

export function buildTrainingLoadAnalytics(args: {
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): TrainingLoadAnalytics {
  const sessions = filterByAnalyticsTimeRange(
    args.completedSessions,
    (session) => session.completedAt,
    args.range ?? "all",
    args.now ?? new Date(),
  );

  let workingSetsCompleted = 0;
  let totalRepsCompleted = 0;
  let totalHoldSeconds = 0;

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (set.status === "skipped") continue;
        const value = getRawCompletedSetValue(set);
        if (value == null) continue;
        workingSetsCompleted += 1;

        if (set.repsCompleted != null) totalRepsCompleted += set.repsCompleted;
        else if (set.repsLeft != null && set.repsRight != null) totalRepsCompleted += set.repsLeft + set.repsRight;
        else if (set.durationSeconds != null) totalHoldSeconds += set.durationSeconds;
        else if (set.durationLeft != null && set.durationRight != null) totalHoldSeconds += set.durationLeft + set.durationRight;
      }
    }
  }

  return {
    workoutsCompleted: sessions.length,
    workingSetsCompleted,
    totalRepsCompleted: round(totalRepsCompleted),
    totalHoldSeconds: round(totalHoldSeconds),
    totalTimeUnderTensionSeconds: round(
      sessions.reduce((sum, session) => sum + (session.timeUnderTension ?? 0), 0),
    ),
  };
}

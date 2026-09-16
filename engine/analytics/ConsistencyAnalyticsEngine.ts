import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ConsistencyAnalytics } from "@/models/analytics/ConsistencyAnalytics";
import { ProgramEvaluation } from "@/models/ProgramEvaluation";
import { CompletedSession } from "@/models/WorkoutLog";
import { filterByAnalyticsTimeRange, isProgressionAnalyticsSession, round } from "./analyticsUtils";

export function buildConsistencyAnalytics(args: {
  completedSessions: CompletedSession[];
  programEvaluations: ProgramEvaluation[];
  expectedWorkoutsPerWeekByProgramId: Record<string, number>;
  range?: AnalyticsTimeRange;
  now?: Date;
}): ConsistencyAnalytics {
  const range = args.range ?? "all";
  const now = args.now ?? new Date();
  const sessions = filterByAnalyticsTimeRange(args.completedSessions, (session) => session.completedAt, range, now);
  const evaluations = filterByAnalyticsTimeRange(args.programEvaluations, (evaluation) => evaluation.createdAt, range, now);

  const closedWeeks = new Map<string, ProgramEvaluation>();
  for (const evaluation of evaluations) {
    closedWeeks.set(`${evaluation.programId}::${evaluation.weekIndex}`, evaluation);
  }

  let scheduledWorkouts = 0;
  let completedScheduledWorkouts = 0;

  for (const evaluation of closedWeeks.values()) {
    const expected = args.expectedWorkoutsPerWeekByProgramId[evaluation.programId];
    if (!expected || expected <= 0) continue;
    scheduledWorkouts += expected;

    const completedDays = new Set(
      sessions
        .filter(
          (session) =>
            isProgressionAnalyticsSession(session) &&
            session.programId === evaluation.programId &&
            session.weekIndex === evaluation.weekIndex &&
            session.dayIndex != null,
        )
        .map((session) => session.dayIndex as number),
    );

    completedScheduledWorkouts += Math.min(expected, completedDays.size);
  }

  return {
    scheduledWorkouts: scheduledWorkouts || null,
    completedScheduledWorkouts,
    adherenceRate: scheduledWorkouts ? round((completedScheduledWorkouts / scheduledWorkouts) * 100) : null,
    completedWorkoutCount: sessions.length,
  };
}

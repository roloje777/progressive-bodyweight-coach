import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ProgressOverviewAnalytics } from "@/models/analytics/ProgressOverviewAnalytics";
import { ProgramEvaluation } from "@/models/ProgramEvaluation";
import { CompletedSession } from "@/models/WorkoutLog";
import { average, calculateDirectionalTrend, filterByAnalyticsTimeRange, round } from "./analyticsUtils";
import { buildConsistencyAnalytics } from "./ConsistencyAnalyticsEngine";
import { buildMatchOrBeatAnalytics } from "./MatchOrBeatAnalyticsEngine";

export function buildProgressOverviewAnalytics(args: {
  completedSessions: CompletedSession[];
  programEvaluations: ProgramEvaluation[];
  expectedWorkoutsPerWeekByProgramId: Record<string, number>;
  currentProgramId: string;
  currentWeekIndex: number;
  range?: AnalyticsTimeRange;
  now?: Date;
}): ProgressOverviewAnalytics {
  const range = args.range ?? "all";
  const now = args.now ?? new Date();
  const sessions = filterByAnalyticsTimeRange(args.completedSessions, (session) => session.completedAt, range, now);
  const evaluations = filterByAnalyticsTimeRange(args.programEvaluations, (evaluation) => evaluation.createdAt, range, now)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const ratings = sessions
    .map((session) => session.feedback?.rating)
    .filter((value): value is number => value != null);
  const mb = buildMatchOrBeatAnalytics({ completedSessions: args.completedSessions, range, now });
  const consistency = buildConsistencyAnalytics({
    completedSessions: args.completedSessions,
    programEvaluations: args.programEvaluations,
    expectedWorkoutsPerWeekByProgramId: args.expectedWorkoutsPerWeekByProgramId,
    range,
    now,
  });

  const currentProgramEvaluations = evaluations.filter(
    (evaluation) => evaluation.programId === args.currentProgramId,
  );
  const readinessSeries = currentProgramEvaluations.map(
    (evaluation) => evaluation.readinessReport.readinessScore,
  );

  return {
    workoutsCompleted: sessions.length,
    currentProgramId: args.currentProgramId,
    currentWeekIndex: args.currentWeekIndex,
    averageWorkoutRating: ratings.length ? round(average(ratings) ?? 0) : null,
    matchOrBeatSuccessRate: mb.successRate,
    adherenceRate: consistency.adherenceRate,
    readiness: {
      current: readinessSeries.length ? readinessSeries[readinessSeries.length - 1] : null,
      trend: calculateDirectionalTrend(readinessSeries),
    },
  };
}

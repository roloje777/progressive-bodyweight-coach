import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ExerciseDetailAnalytics } from "@/models/analytics/ExerciseDetailAnalytics";
import { CompletedSession } from "@/models/WorkoutLog";
import { buildExerciseAnalytics } from "./ExerciseAnalyticsEngine";
import { buildMatchOrBeatAnalytics } from "./MatchOrBeatAnalyticsEngine";
import {
  average,
  calculateDirectionalTrend,
  filterByAnalyticsTimeRange,
  round,
} from "./analyticsUtils";

export function buildExerciseDetailAnalytics(args: {
  exerciseId: string;
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): ExerciseDetailAnalytics {
  const range = args.range ?? "all";
  const now = args.now ?? new Date();
  const base = buildExerciseAnalytics({ ...args, range, now });
  const mb = buildMatchOrBeatAnalytics({
    completedSessions: args.completedSessions,
    range,
    now,
  });
  const mbExercise = mb.exercises.find((item) => item.exerciseId === args.exerciseId);

  const inRangeSessions = filterByAnalyticsTimeRange(
    args.completedSessions,
    (session) => session.completedAt,
    range,
    now,
  )
    .filter((session) => session.exercises.some((exercise) => exercise.exerciseId === args.exerciseId))
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));

  const effortRatings = inRangeSessions
    .map((session) => session.exercises.find((exercise) => exercise.exerciseId === args.exerciseId)?.effortRating)
    .filter((value): value is 1 | 2 | 3 => value != null);

  const personalBests: ExerciseDetailAnalytics["personalBests"] = [];
  let runningBest: number | null = null;
  for (const point of base.history) {
    if (point.bestPerformance == null) continue;
    if (runningBest == null || point.bestPerformance > runningBest) {
      runningBest = point.bestPerformance;
      personalBests.push({ completedAt: point.completedAt, value: point.bestPerformance });
    }
  }

  let sessionsPerWeek: number | null = null;
  if (inRangeSessions.length >= 2) {
    const first = Date.parse(inRangeSessions[0].completedAt);
    const last = Date.parse(inRangeSessions[inRangeSessions.length - 1].completedAt);
    const spanWeeks = Math.max((last - first) / (7 * 24 * 60 * 60 * 1000), 1);
    sessionsPerWeek = round(inRangeSessions.length / spanWeeks);
  }

  return {
    exerciseId: args.exerciseId,
    unit: base.unit,
    sessionsPerformed: base.sessionsPerformed,
    bestPerformance: base.bestPerformance,
    averagePerformance: base.averagePerformance,
    totalPerformance: base.totalPerformance,
    averageSetDropoffPercent: base.averageSetDropoffPercent,
    performanceTrend: base.trend,
    sessionsPerWeek,
    personalBestCount: personalBests.length,
    personalBests,
    averageEffortRating: effortRatings.length ? round(average(effortRatings) ?? 0) : null,
    effortTrend: calculateDirectionalTrend(effortRatings, { lowerIsBetter: true }),
    matchOrBeat: {
      attempted: mbExercise?.attempted ?? 0,
      successful: mbExercise?.successful ?? 0,
      successRate: mbExercise?.successRate ?? null,
    },
  };
}

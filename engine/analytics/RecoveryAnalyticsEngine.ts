import type { AbortAttempt } from "@/models/AbortAttempt";
import type { PainTriageRecord } from "@/storage/painTriageHistoryStorage";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { RecoveryAnalytics } from "@/models/analytics/RecoveryAnalytics";
import { CompletedSession } from "@/models/WorkoutLog";
import { hasWorkoutFeedbackTag } from "@/models/WorkoutFeedback";
import { average, calculateDirectionalTrend, filterByAnalyticsTimeRange, round } from "./analyticsUtils";

export function buildRecoveryAnalytics(args: {
  completedSessions: CompletedSession[];
  abortAttempts?: AbortAttempt[];
  painTriages?: PainTriageRecord[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): RecoveryAnalytics {
  const sessions = filterByAnalyticsTimeRange(
    args.completedSessions,
    (session) => session.completedAt,
    args.range ?? "all",
    args.now ?? new Date(),
  ).sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  let painOccurrences = 0;
  let lowEnergyOccurrences = 0;
  let formBreakdownOccurrences = 0;
  let couldntFinishOccurrences = 0;
  const burdenSeries: number[] = [];
  const ratings: number[] = [];

  for (const session of sessions) {
    const tags = session.feedback?.tags;
    const pain = hasWorkoutFeedbackTag(tags, "joint-discomfort") ? 1 : 0;
    const lowEnergy = hasWorkoutFeedbackTag(tags, "low-energy") ? 1 : 0;
    const form = hasWorkoutFeedbackTag(tags, "form-breakdown") ? 1 : 0;
    const couldntFinish = hasWorkoutFeedbackTag(tags, "couldnt-finish") ? 1 : 0;

    painOccurrences += pain;
    lowEnergyOccurrences += lowEnergy;
    formBreakdownOccurrences += form;
    couldntFinishOccurrences += couldntFinish;
    burdenSeries.push(pain + lowEnergy + form + couldntFinish);

    if (session.feedback?.rating != null) ratings.push(session.feedback.rating);
  }

  // Distinct evidence sources: a Pain Coach triage is not an additional pain report.
  // Count pain aborts separately from post-workout feedback; avoid duplicates by session ID.
  const aborts = filterByAnalyticsTimeRange(args.abortAttempts ?? [], a => a.recordedAt, args.range ?? "all", args.now ?? new Date());
  const uniquePainAborts = new Set<string>();
  const uniqueFatigueAborts = new Set<string>();
  for (const abort of aborts) {
    const identity = abort.workoutSessionId || abort.attemptId;
    if (abort.reason === "pain") uniquePainAborts.add(identity);
    if (abort.reason === "fatigue") uniqueFatigueAborts.add(identity);
  }
  const triages = filterByAnalyticsTimeRange(args.painTriages ?? [], t => t.recordedAt, args.range ?? "all", args.now ?? new Date());
  const uniqueTriages = new Set(triages.map(t => t.id)).size;

  return {
    painAbortOccurrences: uniquePainAborts.size,
    fatigueAbortOccurrences: uniqueFatigueAborts.size,
    painCoachAssessments: uniqueTriages,
    workoutsConsidered: sessions.length,
    averageWorkoutRating: ratings.length ? round(average(ratings) ?? 0) : null,
    painOccurrences: painOccurrences + uniquePainAborts.size,
    lowEnergyOccurrences,
    formBreakdownOccurrences,
    couldntFinishOccurrences,
    deloadWorkoutCount: sessions.filter((session) => session.trainingMode?.startsWith("deload-")).length,
    verificationWorkoutCount: sessions.filter((session) => session.trainingMode === "verification").length,
    trend: calculateDirectionalTrend(burdenSeries, { lowerIsBetter: true, relativeTolerance: 0.1 }),
  };
}

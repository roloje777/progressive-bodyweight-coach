import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import {
  RecoveryDetailAnalytics,
  RecoveryModeBreakdown,
  RecoverySignalBreakdown,
  RecoverySignalKey,
} from "@/models/analytics/RecoveryDetailAnalytics";
import { CompletedSession, TrainingMode } from "@/models/WorkoutLog";
import { hasWorkoutFeedbackTag } from "@/models/WorkoutFeedback";
import {
  average,
  calculateDirectionalTrend,
  filterByAnalyticsTimeRange,
  round,
} from "./analyticsUtils";

const SIGNALS: RecoverySignalKey[] = [
  "joint-discomfort",
  "low-energy",
  "form-breakdown",
  "couldnt-finish",
];

const MODES: TrainingMode[] = [
  "normal",
  "deload-fatigue",
  "deload-pain",
  "deload-form",
  "deload-recovery",
  "verification",
];

function signalCount(session: CompletedSession): number {
  const tags = session.feedback?.tags;
  return SIGNALS.reduce(
    (sum, signal) => sum + (hasWorkoutFeedbackTag(tags, signal) ? 1 : 0),
    0,
  );
}

function mondayKey(value: string): { key: string; label: string } | null {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return {
    key: monday.toISOString().slice(0, 10),
    label: monday.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
  };
}

export function buildRecoveryDetailAnalytics(args: {
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): RecoveryDetailAnalytics {
  const sessions = filterByAnalyticsTimeRange(
    args.completedSessions,
    (session) => session.completedAt,
    args.range ?? "all",
    args.now ?? new Date(),
  ).sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));

  const ratings = sessions
    .map((session) => session.feedback?.rating)
    .filter((value): value is number => value != null);
  const burdens = sessions.map(signalCount);

  const signals: RecoverySignalBreakdown[] = SIGNALS.map((signal) => ({
    signal,
    count: sessions.filter((session) => hasWorkoutFeedbackTag(session.feedback?.tags, signal)).length,
  }));

  const modes: RecoveryModeBreakdown[] = MODES.map((mode) => ({
    mode,
    count: sessions.filter((session) => (session.trainingMode ?? "normal") === mode).length,
  })).filter((item) => item.count > 0);

  const weeklyMap = new Map<
    string,
    { label: string; workouts: number; ratings: number[]; signalBurden: number }
  >();

  for (const session of sessions) {
    const week = mondayKey(session.completedAt);
    if (!week) continue;
    const existing = weeklyMap.get(week.key) ?? {
      label: week.label,
      workouts: 0,
      ratings: [],
      signalBurden: 0,
    };
    existing.workouts += 1;
    existing.signalBurden += signalCount(session);
    if (session.feedback?.rating != null) existing.ratings.push(session.feedback.rating);
    weeklyMap.set(week.key, existing);
  }

  const weekly = [...weeklyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, item]) => ({
      weekKey,
      label: item.label,
      workouts: item.workouts,
      averageRating: item.ratings.length ? round(average(item.ratings) ?? 0) : null,
      signalBurden: item.signalBurden,
    }));

  return {
    workoutsConsidered: sessions.length,
    averageWorkoutRating: ratings.length ? round(average(ratings) ?? 0) : null,
    ratingTrend: calculateDirectionalTrend(ratings),
    recoveryTrend: calculateDirectionalTrend(burdens, {
      lowerIsBetter: true,
      relativeTolerance: 0.1,
    }),
    painOccurrences: signals.find((item) => item.signal === "joint-discomfort")?.count ?? 0,
    lowEnergyOccurrences: signals.find((item) => item.signal === "low-energy")?.count ?? 0,
    formBreakdownOccurrences: signals.find((item) => item.signal === "form-breakdown")?.count ?? 0,
    couldntFinishOccurrences: signals.find((item) => item.signal === "couldnt-finish")?.count ?? 0,
    totalSignalOccurrences: burdens.reduce((sum, value) => sum + value, 0),
    deloadWorkoutCount: sessions.filter((session) => session.trainingMode?.startsWith("deload-")).length,
    verificationWorkoutCount: sessions.filter((session) => session.trainingMode === "verification").length,
    weekly,
    signals,
    modes,
    recentWorkouts: [...sessions]
      .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
      .slice(0, 16)
      .map((session) => ({
        completedAt: session.completedAt,
        programId: session.programId,
        dayId: session.dayId,
        rating: session.feedback?.rating ?? null,
        tags: [...(session.feedback?.tags ?? [])],
        trainingMode: session.trainingMode ?? "normal",
        signalBurden: signalCount(session),
      })),
  };
}

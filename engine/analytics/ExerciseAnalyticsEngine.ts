import { exerciseRegistry } from "@/data/exerciseRegistry";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ExerciseAnalytics, ExercisePerformanceUnit } from "@/models/analytics/ExerciseAnalytics";
import { CompletedSession } from "@/models/WorkoutLog";
import {
  average,
  calculateDirectionalTrend,
  filterByAnalyticsTimeRange,
  getCompletedSetValue,
  isProgressionAnalyticsSession,
  round,
} from "./analyticsUtils";

function resolveUnit(exerciseId: string): ExercisePerformanceUnit | null {
  const type = exerciseRegistry[exerciseId]?.type;
  if (type === "hold" || type === "time") return "seconds";
  if (type === "reps" || type === "tempo") return "reps";
  return null;
}

export function buildExerciseAnalytics(args: {
  exerciseId: string;
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): ExerciseAnalytics {
  const { exerciseId, range = "all", now = new Date() } = args;
  const sessions = filterByAnalyticsTimeRange(
    args.completedSessions,
    (session) => session.completedAt,
    range,
    now,
  )
    .filter(isProgressionAnalyticsSession)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const history: ExerciseAnalytics["history"] = [];
  const allValues: number[] = [];
  const dropoffs: number[] = [];

  for (const session of sessions) {
    const exercise = session.exercises.find((item) => item.exerciseId === exerciseId);
    if (!exercise) continue;

    const values = exercise.sets
      .map(getCompletedSetValue)
      .filter((value): value is number => value != null && value >= 0);

    if (!values.length) continue;

    allValues.push(...values);

    if (values.length >= 2 && values[0] > 0) {
      dropoffs.push(((values[0] - values[values.length - 1]) / values[0]) * 100);
    }

    history.push({
      completedAt: session.completedAt,
      programId: session.programId,
      weekIndex: session.weekIndex ?? null,
      bestPerformance: Math.max(...values),
      averagePerformance: round(average(values) ?? 0),
      totalPerformance: round(values.reduce((sum, value) => sum + value, 0)),
    });
  }

  const bestSeries = history
    .map((point) => point.bestPerformance)
    .filter((value): value is number => value != null);

  return {
    exerciseId,
    unit: resolveUnit(exerciseId),
    sessionsPerformed: history.length,
    bestPerformance: allValues.length ? round(Math.max(...allValues)) : null,
    averagePerformance: allValues.length ? round(average(allValues) ?? 0) : null,
    totalPerformance: allValues.length ? round(allValues.reduce((sum, value) => sum + value, 0)) : null,
    averageSetDropoffPercent: dropoffs.length ? round(average(dropoffs) ?? 0) : null,
    trend: calculateDirectionalTrend(bestSeries),
    history,
  };
}

export function buildAllExerciseAnalytics(args: {
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): ExerciseAnalytics[] {
  const exerciseIds = new Set<string>();
  for (const session of args.completedSessions) {
    if (!isProgressionAnalyticsSession(session)) continue;
    for (const exercise of session.exercises) exerciseIds.add(exercise.exerciseId);
  }

  return [...exerciseIds]
    .map((exerciseId) => buildExerciseAnalytics({ ...args, exerciseId }))
    .sort((a, b) => b.sessionsPerformed - a.sessionsPerformed || a.exerciseId.localeCompare(b.exerciseId));
}

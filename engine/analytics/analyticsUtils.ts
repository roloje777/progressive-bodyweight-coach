import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { AnalyticsTrend } from "@/models/analytics/AnalyticsTrend";
import { CompletedSet } from "@/models/WorkoutLog";

export function filterByAnalyticsTimeRange<T>(
  items: T[],
  getDate: (item: T) => string,
  range: AnalyticsTimeRange,
  now: Date = new Date(),
): T[] {
  if (range === "all") return [...items];

  const cutoff = new Date(now);
  const days = range === "4w" ? 28 : range === "12w" ? 84 : range === "6m" ? 183 : 365;
  cutoff.setDate(cutoff.getDate() - days);

  return items.filter((item) => {
    const time = new Date(getDate(item)).getTime();
    return Number.isFinite(time) && time >= cutoff.getTime() && time <= now.getTime();
  });
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function getCompletedSetValue(set: CompletedSet): number | null {
  if (set.excludeFromProgression === true || set.status === "skipped") return null;
  if (set.repsCompleted != null) return set.repsCompleted;
  if (set.repsLeft != null && set.repsRight != null) return (set.repsLeft + set.repsRight) / 2;
  if (set.durationSeconds != null) return set.durationSeconds;
  if (set.durationLeft != null && set.durationRight != null) return (set.durationLeft + set.durationRight) / 2;
  return null;
}

export function getRawCompletedSetValue(set: CompletedSet): number | null {
  if (set.status === "skipped") return null;
  if (set.repsCompleted != null) return set.repsCompleted;
  if (set.repsLeft != null && set.repsRight != null) return (set.repsLeft + set.repsRight) / 2;
  if (set.durationSeconds != null) return set.durationSeconds;
  if (set.durationLeft != null && set.durationRight != null) return (set.durationLeft + set.durationRight) / 2;
  return null;
}

export function calculateDirectionalTrend(
  values: number[],
  options: { lowerIsBetter?: boolean; relativeTolerance?: number; minimumPoints?: number } = {},
): AnalyticsTrend {
  const minimumPoints = options.minimumPoints ?? 4;
  if (values.length < minimumPoints) return "insufficient-data";

  const split = Math.floor(values.length / 2);
  const earlier = average(values.slice(0, split));
  const later = average(values.slice(split));
  if (earlier == null || later == null) return "insufficient-data";

  const denominator = Math.max(Math.abs(earlier), 1);
  const relativeChange = (later - earlier) / denominator;
  const tolerance = options.relativeTolerance ?? 0.05;

  if (Math.abs(relativeChange) <= tolerance) return "stable";

  const laterIsBetter = options.lowerIsBetter ? later < earlier : later > earlier;
  return laterIsBetter ? "improving" : "declining";
}

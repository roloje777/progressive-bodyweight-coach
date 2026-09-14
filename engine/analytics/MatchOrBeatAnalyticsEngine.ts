import { getMatchOrBeatTargets } from "@/engine/MatchOrBeatEngine";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { MatchOrBeatAnalytics } from "@/models/analytics/MatchOrBeatAnalytics";
import { CompletedSession } from "@/models/WorkoutLog";
import { hasWorkoutFeedbackTag } from "@/models/WorkoutFeedback";
import { calculateDirectionalTrend, filterByAnalyticsTimeRange, getRawCompletedSetValue, round } from "./analyticsUtils";

function isEligibleWorkout(workout: CompletedSession): boolean {
  if (workout.trainingMode?.startsWith("deload-")) return false;
  if (workout.feedback?.rating != null && workout.feedback.rating <= 2) return false;
  const tags = workout.feedback?.tags;
  return !(
    hasWorkoutFeedbackTag(tags, "joint-discomfort") ||
    hasWorkoutFeedbackTag(tags, "form-breakdown") ||
    hasWorkoutFeedbackTag(tags, "low-energy")
  );
}

export function buildMatchOrBeatAnalytics(args: {
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): MatchOrBeatAnalytics {
  const allChronological = [...args.completedSessions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );
  const filtered = new Set(
    filterByAnalyticsTimeRange(
      allChronological,
      (session) => session.completedAt,
      args.range ?? "all",
      args.now ?? new Date(),
    ),
  );

  let matched = 0;
  let exceeded = 0;
  let missed = 0;
  let excluded = 0;
  const weeklyMap = new Map<string, { programId: string; weekIndex: number; attempted: number; successful: number }>();
  const exerciseMap = new Map<string, { attempted: number; successful: number }>();
  const priorSessions: CompletedSession[] = [];

  for (const session of allChronological) {
    const includeInOutput = filtered.has(session);

    if (includeInOutput) {
      const workoutEligible = isEligibleWorkout(session);
      for (const exercise of session.exercises) {
        const targets = getMatchOrBeatTargets(exercise, priorSessions, exercise.exerciseId);

        for (const target of targets) {
          if (target.target == null || target.target <= 0) continue;
          const set = exercise.sets.find((item) => item.setNumber === target.setNumber);
          if (!set) continue;
          const value = getRawCompletedSetValue(set);
          if (value == null) continue;

          if (!workoutEligible || set.excludeFromProgression) {
            excluded += 1;
            continue;
          }

          const successful = value >= target.target;
          if (value > target.target) exceeded += 1;
          else if (value === target.target) matched += 1;
          else missed += 1;

          if (session.weekIndex != null) {
            const key = `${session.programId}::${session.weekIndex}`;
            const current = weeklyMap.get(key) ?? {
              programId: session.programId,
              weekIndex: session.weekIndex,
              attempted: 0,
              successful: 0,
            };
            current.attempted += 1;
            if (successful) current.successful += 1;
            weeklyMap.set(key, current);
          }

          const exerciseCurrent = exerciseMap.get(exercise.exerciseId) ?? { attempted: 0, successful: 0 };
          exerciseCurrent.attempted += 1;
          if (successful) exerciseCurrent.successful += 1;
          exerciseMap.set(exercise.exerciseId, exerciseCurrent);
        }
      }
    }

    priorSessions.push(session);
  }

  const eligibleTargets = matched + exceeded + missed;
  const weekly = [...weeklyMap.values()]
    .sort((a, b) => a.weekIndex - b.weekIndex)
    .map((week) => ({
      ...week,
      successRate: week.attempted ? round((week.successful / week.attempted) * 100) : null,
    }));

  return {
    eligibleTargets,
    matched,
    exceeded,
    missed,
    excluded,
    successRate: eligibleTargets ? round(((matched + exceeded) / eligibleTargets) * 100) : null,
    trend: calculateDirectionalTrend(
      weekly.map((week) => week.successRate).filter((value): value is number => value != null),
    ),
    weekly,
    exercises: [...exerciseMap.entries()]
      .map(([exerciseId, value]) => ({
        exerciseId,
        attempted: value.attempted,
        successful: value.successful,
        successRate: value.attempted ? round((value.successful / value.attempted) * 100) : null,
      }))
      .sort((a, b) => b.attempted - a.attempted || a.exerciseId.localeCompare(b.exerciseId)),
  };
}

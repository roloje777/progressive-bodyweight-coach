import { getMatchOrBeatTargets } from "@/engine/MatchOrBeatEngine";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import {
  MatchOrBeatDetailAnalytics,
  MatchOrBeatExclusionReason,
} from "@/models/analytics/MatchOrBeatDetailAnalytics";
import { CompletedSession } from "@/models/WorkoutLog";
import { hasWorkoutFeedbackTag } from "@/models/WorkoutFeedback";
import {
  calculateDirectionalTrend,
  filterByAnalyticsTimeRange,
  getRawCompletedSetValue,
  round,
} from "./analyticsUtils";

type WorkoutEligibility =
  | { eligible: true }
  | { eligible: false; reason: MatchOrBeatExclusionReason };

function workoutEligibility(workout: CompletedSession): WorkoutEligibility {
  if (workout.trainingMode?.startsWith("deload-")) return { eligible: false, reason: "deload" };
  if (workout.feedback?.rating != null && workout.feedback.rating <= 2) {
    return { eligible: false, reason: "low-rating" };
  }
  const tags = workout.feedback?.tags;
  if (hasWorkoutFeedbackTag(tags, "joint-discomfort")) {
    return { eligible: false, reason: "joint-discomfort" };
  }
  if (hasWorkoutFeedbackTag(tags, "form-breakdown")) {
    return { eligible: false, reason: "form-breakdown" };
  }
  if (hasWorkoutFeedbackTag(tags, "low-energy")) {
    return { eligible: false, reason: "low-energy" };
  }
  return { eligible: true };
}

export function buildMatchOrBeatDetailAnalytics(args: {
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): MatchOrBeatDetailAnalytics {
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
  const exerciseMap = new Map<string, { attempted: number; successful: number; exceeded: number; matched: number; missed: number; excluded: number }>();
  const exclusionMap = new Map<MatchOrBeatExclusionReason, number>();
  const recentEvidence: MatchOrBeatDetailAnalytics["recentEvidence"] = [];
  const priorSessions: CompletedSession[] = [];

  for (const session of allChronological) {
    const includeInOutput = filtered.has(session);

    if (includeInOutput) {
      const eligibility = workoutEligibility(session);

      for (const exercise of session.exercises) {
        const targets = getMatchOrBeatTargets(exercise, priorSessions, exercise.exerciseId);
        const exerciseStats = exerciseMap.get(exercise.exerciseId) ?? {
          attempted: 0,
          successful: 0,
          exceeded: 0,
          matched: 0,
          missed: 0,
          excluded: 0,
        };

        for (const target of targets) {
          if (target.target == null || target.target <= 0) continue;
          const set = exercise.sets.find((item) => item.setNumber === target.setNumber);
          if (!set) continue;
          const value = getRawCompletedSetValue(set);
          if (value == null) continue;

          let exclusionReason: MatchOrBeatExclusionReason | undefined;
          if (!eligibility.eligible) exclusionReason = eligibility.reason;
          else if (set.excludeFromProgression) exclusionReason = "excluded-set";

          if (exclusionReason) {
            excluded += 1;
            exerciseStats.excluded += 1;
            exclusionMap.set(exclusionReason, (exclusionMap.get(exclusionReason) ?? 0) + 1);
            recentEvidence.push({
              completedAt: session.completedAt,
              programId: session.programId,
              dayId: session.dayId,
              weekIndex: session.weekIndex,
              exerciseId: exercise.exerciseId,
              setNumber: target.setNumber,
              target: target.target,
              actual: value,
              status: "excluded",
              exclusionReason,
            });
            continue;
          }

          const successful = value >= target.target;
          let status: "exceeded" | "matched" | "missed";
          if (value > target.target) {
            exceeded += 1;
            exerciseStats.exceeded += 1;
            status = "exceeded";
          } else if (value === target.target) {
            matched += 1;
            exerciseStats.matched += 1;
            status = "matched";
          } else {
            missed += 1;
            exerciseStats.missed += 1;
            status = "missed";
          }

          exerciseStats.attempted += 1;
          if (successful) exerciseStats.successful += 1;

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

          recentEvidence.push({
            completedAt: session.completedAt,
            programId: session.programId,
            dayId: session.dayId,
            weekIndex: session.weekIndex,
            exerciseId: exercise.exerciseId,
            setNumber: target.setNumber,
            target: target.target,
            actual: value,
            status,
          });
        }

        exerciseMap.set(exercise.exerciseId, exerciseStats);
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
    successfulTargets: matched + exceeded,
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
      .map(([exerciseId, stats]) => ({
        exerciseId,
        ...stats,
        successRate: stats.attempted ? round((stats.successful / stats.attempted) * 100) : null,
      }))
      .filter((item) => item.attempted > 0 || item.excluded > 0)
      .sort((a, b) => b.attempted - a.attempted || b.excluded - a.excluded || a.exerciseId.localeCompare(b.exerciseId)),
    recentEvidence: recentEvidence
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 40),
    exclusions: [...exclusionMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)),
  };
}

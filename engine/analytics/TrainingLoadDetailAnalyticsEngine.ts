import { exerciseRegistry } from "@/data/exerciseRegistry";
import { getAnalyticsBodyPartsForExercise } from "@/data/analytics/exerciseBodyParts";
import type { AnalyticsBodyPart } from "@/data/analytics/exerciseBodyParts";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { TrainingLoadDetailAnalytics } from "@/models/analytics/TrainingLoadDetailAnalytics";
import { CompletedSession, CompletedSet } from "@/models/WorkoutLog";
import { filterByAnalyticsTimeRange, getRawCompletedSetValue, round } from "./analyticsUtils";

function completedReps(set: CompletedSet): number {
  if (set.repsCompleted != null) return set.repsCompleted;
  if (set.repsLeft != null && set.repsRight != null) return set.repsLeft + set.repsRight;
  return 0;
}

function completedHoldSeconds(set: CompletedSet): number {
  if (set.durationSeconds != null) return set.durationSeconds;
  if (set.durationLeft != null && set.durationRight != null) return set.durationLeft + set.durationRight;
  return 0;
}

function mondayStartIso(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + delta);
  local.setHours(0, 0, 0, 0);
  return local.toISOString();
}

export function buildTrainingLoadDetailAnalytics(args: {
  completedSessions: CompletedSession[];
  range?: AnalyticsTimeRange;
  now?: Date;
}): TrainingLoadDetailAnalytics {
  const sessions = filterByAnalyticsTimeRange(
    args.completedSessions,
    (session) => session.completedAt,
    args.range ?? "all",
    args.now ?? new Date(),
  ).sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));

  let workingSetsCompleted = 0;
  let totalRepsCompleted = 0;
  let totalHoldSeconds = 0;
  let unmappedWorkingSets = 0;

  const weekly = new Map<string, {
    workouts: number;
    workingSets: number;
    reps: number;
    holdSeconds: number;
    timeUnderTensionSeconds: number;
  }>();

  const bodyPartSets = new Map<AnalyticsBodyPart, number>();
  const bodyPartSessions = new Map<AnalyticsBodyPart, Set<string>>();
  const bodyPartExercises = new Map<AnalyticsBodyPart, Set<string>>();
  const bodyPartExerciseSets = new Map<AnalyticsBodyPart, Map<string, number>>();
  const bodyPartExerciseSessions = new Map<AnalyticsBodyPart, Map<string, Set<string>>>();

  for (const session of sessions) {
    const weekStart = mondayStartIso(session.completedAt);
    const weeklyPoint = weekly.get(weekStart) ?? {
      workouts: 0,
      workingSets: 0,
      reps: 0,
      holdSeconds: 0,
      timeUnderTensionSeconds: 0,
    };
    weeklyPoint.workouts += 1;
    weeklyPoint.timeUnderTensionSeconds += session.timeUnderTension ?? 0;

    const sessionIdentity = `${session.programId}:${session.dayId}:${session.completedAt}`;

    for (const exercise of session.exercises) {
      const definition = exerciseRegistry[exercise.exerciseId];
      const bodyParts = getAnalyticsBodyPartsForExercise({
        exerciseId: exercise.exerciseId,
        family: definition?.family,
      });

      for (const set of exercise.sets) {
        if (set.status === "skipped" || getRawCompletedSetValue(set) == null) continue;

        const reps = completedReps(set);
        const holdSeconds = completedHoldSeconds(set);
        workingSetsCompleted += 1;
        totalRepsCompleted += reps;
        totalHoldSeconds += holdSeconds;
        weeklyPoint.workingSets += 1;
        weeklyPoint.reps += reps;
        weeklyPoint.holdSeconds += holdSeconds;

        if (!bodyParts.length) {
          unmappedWorkingSets += 1;
          continue;
        }

        for (const bodyPart of bodyParts) {
          bodyPartSets.set(bodyPart, (bodyPartSets.get(bodyPart) ?? 0) + 1);
          const sessionsForPart = bodyPartSessions.get(bodyPart) ?? new Set<string>();
          sessionsForPart.add(sessionIdentity);
          bodyPartSessions.set(bodyPart, sessionsForPart);
          const exercisesForPart = bodyPartExercises.get(bodyPart) ?? new Set<string>();
          exercisesForPart.add(exercise.exerciseId);
          bodyPartExercises.set(bodyPart, exercisesForPart);

          const exerciseSetsForPart = bodyPartExerciseSets.get(bodyPart) ?? new Map<string, number>();
          exerciseSetsForPart.set(
            exercise.exerciseId,
            (exerciseSetsForPart.get(exercise.exerciseId) ?? 0) + 1,
          );
          bodyPartExerciseSets.set(bodyPart, exerciseSetsForPart);

          const exerciseSessionsForPart =
            bodyPartExerciseSessions.get(bodyPart) ?? new Map<string, Set<string>>();
          const sessionsForExercise =
            exerciseSessionsForPart.get(exercise.exerciseId) ?? new Set<string>();
          sessionsForExercise.add(sessionIdentity);
          exerciseSessionsForPart.set(exercise.exerciseId, sessionsForExercise);
          bodyPartExerciseSessions.set(bodyPart, exerciseSessionsForPart);
        }
      }
    }

    weekly.set(weekStart, weeklyPoint);
  }

  const totalBodyPartSetExposures = [...bodyPartSets.values()].reduce((sum, value) => sum + value, 0);
  const bodyParts = [...bodyPartSets.entries()]
    .map(([bodyPart, setExposures]) => ({
      bodyPart,
      setExposures,
      sessions: bodyPartSessions.get(bodyPart)?.size ?? 0,
      exerciseCount: bodyPartExercises.get(bodyPart)?.size ?? 0,
      sharePercent: totalBodyPartSetExposures
        ? round((setExposures / totalBodyPartSetExposures) * 100)
        : 0,
      exercises: [...(bodyPartExerciseSets.get(bodyPart)?.entries() ?? [])]
        .map(([exerciseId, exerciseSetExposures]) => ({
          exerciseId,
          setExposures: exerciseSetExposures,
          sessions:
            bodyPartExerciseSessions.get(bodyPart)?.get(exerciseId)?.size ?? 0,
          sharePercent: setExposures
            ? round((exerciseSetExposures / setExposures) * 100)
            : 0,
        }))
        .sort(
          (a, b) =>
            b.setExposures - a.setExposures ||
            a.exerciseId.localeCompare(b.exerciseId),
        ),
    }))
    .sort((a, b) => b.setExposures - a.setExposures || a.bodyPart.localeCompare(b.bodyPart));

  const totalTimeUnderTensionSeconds = round(
    sessions.reduce((sum, session) => sum + (session.timeUnderTension ?? 0), 0),
  );

  return {
    workoutsCompleted: sessions.length,
    workingSetsCompleted,
    totalRepsCompleted: round(totalRepsCompleted),
    totalHoldSeconds: round(totalHoldSeconds),
    totalTimeUnderTensionSeconds,
    averageSetsPerWorkout: sessions.length ? round(workingSetsCompleted / sessions.length) : null,
    averageTimeUnderTensionPerWorkoutSeconds: sessions.length
      ? round(totalTimeUnderTensionSeconds / sessions.length)
      : null,
    weekly: [...weekly.entries()]
      .sort(([a], [b]) => Date.parse(a) - Date.parse(b))
      .map(([weekStart, point]) => ({
        weekStart,
        workouts: point.workouts,
        workingSets: point.workingSets,
        reps: round(point.reps),
        holdSeconds: round(point.holdSeconds),
        timeUnderTensionSeconds: round(point.timeUnderTensionSeconds),
      })),
    bodyParts,
    totalBodyPartSetExposures,
    unmappedWorkingSets,
  };
}

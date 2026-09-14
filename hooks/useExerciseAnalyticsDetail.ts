import { useMemo } from "react";

import { buildExerciseDetailAnalytics, filterByAnalyticsTimeRange } from "@/engine/analytics";
import { useProgress } from "@/hooks/useProgress";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";

export function useExerciseAnalyticsDetail(
  exerciseId: string,
  range: AnalyticsTimeRange,
) {
  const { completedSessions, isLoaded } = useProgress();

  const analytics = useMemo(
    () => buildExerciseDetailAnalytics({ exerciseId, completedSessions, range }),
    [completedSessions, exerciseId, range],
  );

  const recentSessions = useMemo(
    () =>
      filterByAnalyticsTimeRange(
        completedSessions,
        (session) => session.completedAt,
        range,
      )
        .filter((session) =>
          session.exercises.some((exercise) => exercise.exerciseId === exerciseId),
        )
        .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)),
    [completedSessions, exerciseId, range],
  );

  return { analytics, recentSessions, isLoaded };
}

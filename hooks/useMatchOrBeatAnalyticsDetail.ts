import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";

import { buildMatchOrBeatDetailAnalytics } from "@/engine/analytics";
import { useProgress } from "@/hooks/useProgress";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";

export function useMatchOrBeatAnalyticsDetail(range: AnalyticsTimeRange) {
  const { completedSessions, isLoaded, refreshWorkoutHistory } = useProgress();

  useFocusEffect(
    useCallback(() => {
      void refreshWorkoutHistory();
    }, [refreshWorkoutHistory]),
  );

  const analytics = useMemo(
    () => buildMatchOrBeatDetailAnalytics({ completedSessions, range }),
    [completedSessions, range],
  );

  return {
    analytics,
    isLoaded,
  };
}

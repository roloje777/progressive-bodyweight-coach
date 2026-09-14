import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";

import { buildRecoveryDetailAnalytics } from "@/engine/analytics";
import { useProgress } from "@/hooks/useProgress";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";

export function useRecoveryAnalyticsDetail(range: AnalyticsTimeRange) {
  const { completedSessions, isLoaded, refreshWorkoutHistory } = useProgress();

  useFocusEffect(
    useCallback(() => {
      void refreshWorkoutHistory();
    }, [refreshWorkoutHistory]),
  );

  const analytics = useMemo(
    () => buildRecoveryDetailAnalytics({ completedSessions, range }),
    [completedSessions, range],
  );

  const sessionByIdentity = useMemo(() => {
    const map = new Map<string, (typeof completedSessions)[number]>();
    for (const session of completedSessions) {
      map.set(`${session.completedAt}|${session.programId}|${session.dayId}`, session);
    }
    return map;
  }, [completedSessions]);

  return { analytics, sessionByIdentity, isLoaded };
}

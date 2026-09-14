import { useMemo } from "react";

import { buildTrainingLoadDetailAnalytics } from "@/engine/analytics/TrainingLoadDetailAnalyticsEngine";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { useProgress } from "@/hooks/useProgress";

export function useTrainingLoadAnalyticsDetail(range: AnalyticsTimeRange) {
  const { completedSessions, isLoaded } = useProgress();

  const analytics = useMemo(
    () => buildTrainingLoadDetailAnalytics({ completedSessions, range }),
    [completedSessions, range],
  );

  return { analytics, isLoaded };
}

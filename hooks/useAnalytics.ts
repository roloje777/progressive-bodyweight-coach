import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import { programs } from "@/data/programs";
import {
  buildAllExerciseAnalytics,
  buildConsistencyAnalytics,
  buildMatchOrBeatAnalytics,
  buildProgressOverviewAnalytics,
  buildRecoveryAnalytics,
  buildTrainingLoadAnalytics,
  filterByAnalyticsTimeRange,
} from "@/engine/analytics";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ProgramEvaluation } from "@/models/ProgramEvaluation";
import { ProgramLifecycleEvent } from "@/models/analytics/ProgramLifecycleEvent";
import { getProgramEvaluations } from "@/storage/programEvaluationStorage";
import { getProgramLifecycleEvents } from "@/storage/programLifecycleStorage";
import { useProgress } from "@/hooks/useProgress";

export type AnalyticsDashboard = {
  overview: ReturnType<typeof buildProgressOverviewAnalytics>;
  matchOrBeat: ReturnType<typeof buildMatchOrBeatAnalytics>;
  recovery: ReturnType<typeof buildRecoveryAnalytics>;
  consistency: ReturnType<typeof buildConsistencyAnalytics>;
  trainingLoad: ReturnType<typeof buildTrainingLoadAnalytics>;
  exercises: ReturnType<typeof buildAllExerciseAnalytics>;
  readinessHistory: Array<{
    programId: string;
    weekIndex: number;
    score: number;
    createdAt: string;
  }>;
  lifecycleEvents: ProgramLifecycleEvent[];
};

const expectedWorkoutsPerWeekByProgramId = Object.fromEntries(
  programs.map((program) => [program.id, program.days.length]),
);

export function useAnalytics(range: AnalyticsTimeRange) {
  const {
    completedSessions,
    program,
    week,
    isLoaded: isProgressLoaded,
    refreshWorkoutHistory,
  } = useProgress();

  const [programEvaluations, setProgramEvaluations] = useState<ProgramEvaluation[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<ProgramLifecycleEvent[]>([]);
  const [isAnalyticsLoaded, setIsAnalyticsLoaded] = useState(false);

  const refreshAnalyticsSources = useCallback(async () => {
    const [evaluations, events] = await Promise.all([
      getProgramEvaluations(),
      getProgramLifecycleEvents(),
      refreshWorkoutHistory(),
    ]);

    setProgramEvaluations(evaluations);
    setLifecycleEvents(events);
    setIsAnalyticsLoaded(true);
  }, [refreshWorkoutHistory]);

  useFocusEffect(
    useCallback(() => {
      void refreshAnalyticsSources();
    }, [refreshAnalyticsSources]),
  );

  const dashboard = useMemo<AnalyticsDashboard>(() => {
    const overview = buildProgressOverviewAnalytics({
      completedSessions,
      programEvaluations,
      expectedWorkoutsPerWeekByProgramId,
      currentProgramId: program.id,
      currentWeekIndex: week,
      range,
    });

    const matchOrBeat = buildMatchOrBeatAnalytics({
      completedSessions,
      range,
    });

    const recovery = buildRecoveryAnalytics({
      completedSessions,
      range,
    });

    const consistency = buildConsistencyAnalytics({
      completedSessions,
      programEvaluations,
      expectedWorkoutsPerWeekByProgramId,
      range,
    });

    const trainingLoad = buildTrainingLoadAnalytics({
      completedSessions,
      range,
    });

    const exercises = buildAllExerciseAnalytics({
      completedSessions,
      range,
    });

    const readinessHistory = filterByAnalyticsTimeRange(
      programEvaluations,
      (evaluation) => evaluation.createdAt,
      range,
    )
      .filter((evaluation) => evaluation.programId === program.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((evaluation) => ({
        programId: evaluation.programId,
        weekIndex: evaluation.weekIndex,
        score: evaluation.readinessReport.readinessScore,
        createdAt: evaluation.createdAt,
      }));

    return {
      overview,
      matchOrBeat,
      recovery,
      consistency,
      trainingLoad,
      exercises,
      readinessHistory,
      lifecycleEvents,
    };
  }, [completedSessions, lifecycleEvents, program.id, programEvaluations, range, week]);

  return {
    dashboard,
    isLoaded: isProgressLoaded && isAnalyticsLoaded,
    refresh: refreshAnalyticsSources,
  };
}

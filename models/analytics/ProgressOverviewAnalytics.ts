import { AnalyticsTrend } from "./AnalyticsTrend";

export type ProgressOverviewAnalytics = {
  workoutsCompleted: number;
  currentProgramId: string;
  currentWeekIndex: number;
  averageWorkoutRating: number | null;
  matchOrBeatSuccessRate: number | null;
  adherenceRate: number | null;
  readiness: {
    current: number | null;
    trend: AnalyticsTrend;
  };
};

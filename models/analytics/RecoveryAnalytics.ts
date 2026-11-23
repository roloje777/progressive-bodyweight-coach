import { AnalyticsTrend } from "./AnalyticsTrend";

export type RecoveryAnalytics = {
  workoutsConsidered: number;
  averageWorkoutRating: number | null;
  painOccurrences: number;
  painAbortOccurrences?: number;
  fatigueAbortOccurrences?: number;
  painCoachAssessments?: number;
  lowEnergyOccurrences: number;
  formBreakdownOccurrences: number;
  couldntFinishOccurrences: number;
  deloadWorkoutCount: number;
  verificationWorkoutCount: number;
  trend: AnalyticsTrend;
};

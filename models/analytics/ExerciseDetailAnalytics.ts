import { AnalyticsTrend } from "./AnalyticsTrend";
import { ExercisePerformanceUnit } from "./ExerciseAnalytics";

export type ExercisePersonalBest = {
  completedAt: string;
  value: number;
};

export type ExerciseDetailAnalytics = {
  exerciseId: string;
  unit: ExercisePerformanceUnit | null;
  sessionsPerformed: number;
  bestPerformance: number | null;
  averagePerformance: number | null;
  totalPerformance: number | null;
  averageSetDropoffPercent: number | null;
  performanceTrend: AnalyticsTrend;
  sessionsPerWeek: number | null;
  personalBestCount: number;
  personalBests: ExercisePersonalBest[];
  averageEffortRating: number | null;
  effortTrend: AnalyticsTrend;
  matchOrBeat: {
    attempted: number;
    successful: number;
    successRate: number | null;
  };
};

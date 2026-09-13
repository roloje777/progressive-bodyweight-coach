import { AnalyticsTrend } from "./AnalyticsTrend";

export type ExercisePerformanceUnit = "reps" | "seconds";

export type ExerciseAnalyticsPoint = {
  completedAt: string;
  programId: string;
  weekIndex: number | null;
  bestPerformance: number | null;
  averagePerformance: number | null;
  totalPerformance: number | null;
};

export type ExerciseAnalytics = {
  exerciseId: string;
  unit: ExercisePerformanceUnit | null;
  sessionsPerformed: number;
  bestPerformance: number | null;
  averagePerformance: number | null;
  totalPerformance: number | null;
  averageSetDropoffPercent: number | null;
  trend: AnalyticsTrend;
  history: ExerciseAnalyticsPoint[];
};

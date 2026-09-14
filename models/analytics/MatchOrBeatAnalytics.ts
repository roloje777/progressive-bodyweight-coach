import { AnalyticsTrend } from "./AnalyticsTrend";

export type MatchOrBeatAnalytics = {
  eligibleTargets: number;
  matched: number;
  exceeded: number;
  missed: number;
  excluded: number;
  successRate: number | null;
  trend: AnalyticsTrend;
  weekly: Array<{
    programId: string;
    weekIndex: number;
    attempted: number;
    successful: number;
    successRate: number | null;
  }>;
  exercises: Array<{
    exerciseId: string;
    attempted: number;
    successful: number;
    successRate: number | null;
  }>;
};

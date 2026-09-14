import { AnalyticsTrend } from "./AnalyticsTrend";

export type MatchOrBeatEvidenceStatus = "exceeded" | "matched" | "missed" | "excluded";

export type MatchOrBeatExclusionReason =
  | "deload"
  | "low-rating"
  | "joint-discomfort"
  | "form-breakdown"
  | "low-energy"
  | "excluded-set";

export type MatchOrBeatDetailAnalytics = {
  eligibleTargets: number;
  successfulTargets: number;
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
    exceeded: number;
    matched: number;
    missed: number;
    excluded: number;
    successRate: number | null;
  }>;
  recentEvidence: Array<{
    completedAt: string;
    programId: string;
    dayId: string;
    weekIndex?: number;
    exerciseId: string;
    setNumber: number;
    target: number;
    actual: number;
    status: MatchOrBeatEvidenceStatus;
    exclusionReason?: MatchOrBeatExclusionReason;
  }>;
  exclusions: Array<{
    reason: MatchOrBeatExclusionReason;
    count: number;
  }>;
};

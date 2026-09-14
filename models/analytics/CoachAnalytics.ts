export type CoachAnalyticsState =
  | "graduation-ready"
  | "sustainable-progress"
  | "progress-with-recovery-strain"
  | "recovery-priority"
  | "consistency-priority"
  | "performance-plateau"
  | "steady-progress"
  | "building-evidence";

export type CoachAnalyticsTone = "positive" | "neutral" | "caution";

export type CoachEvidenceSource =
  | "readiness"
  | "match-or-beat"
  | "recovery"
  | "consistency"
  | "exercise"
  | "training-load";

export type CoachAnalyticsEvidence = {
  source: CoachEvidenceSource;
  label: string;
  value: string;
  interpretation: string;
  tone: CoachAnalyticsTone;
};

export type CoachAnalytics = {
  state: CoachAnalyticsState;
  tone: CoachAnalyticsTone;
  headline: string;
  summary: string;
  action: string;
  evidence: CoachAnalyticsEvidence[];
};

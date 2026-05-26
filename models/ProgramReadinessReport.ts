export interface ProgramReadinessReport {
  // -----------------------------------
  // OVERALL READINESS
  // -----------------------------------

  readinessScore: number;

  // -----------------------------------
  // PERFORMANCE METRICS
  // -----------------------------------

  mbSuccessRate: number;

  completionRate: number;

  fatigueStability: number;

  // -----------------------------------
  // RECOVERY METRICS
  // -----------------------------------

  recoveryScore: number;

  sorenessScore: number;

  painScore: number;

  averageDifficulty: number;

  // -----------------------------------
  // ENGINE DECISION
  // -----------------------------------

  recommendation:
    | "advance"
    | "repeat"
    | "deload";

  reasons: string[];
}
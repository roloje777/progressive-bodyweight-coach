  //engine/ProgramReadinessReport.ts
export interface ProgramReadinessReport {
  readinessScore: number;

  mbSuccessRate: number;

  completionRate: number;

  fatigueOccurrences: number;

  painOccurrences: number;

  formBreakdownOccurrences: number;

  averageDifficulty: number;

  progressionBlocked: boolean;

  progressionCandidate: boolean;

  deloadCandidate: boolean;

  recommendation:
    | "advance"
    | "repeat"
    | "deload";

  reasons: string[];
}
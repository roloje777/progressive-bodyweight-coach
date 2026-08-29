import { DeloadReason } from "./ProgramProgress";

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

  /** Exact recurring signal that selected the deload style. */
  deloadReason: DeloadReason | null;

  recommendation:
    | "advance"
    | "repeat"
    | "deload";

  reasons: string[];
}
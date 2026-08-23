// models/ProgramEvaluation.ts

import { ProgramReadinessReport } from "./ProgramReadinessReport";

export interface ProgramEvaluation {
  programId: string;

  /**
   * Zero-based program week.
   *
   * Week 1 = 0
   * Week 2 = 1
   */
  weekIndex: number;

  /**
   * Human-readable program week.
   *
   * Week 1 = 1
   * Week 2 = 2
   */
  weekNumber: number;

  readinessReport: ProgramReadinessReport;

  createdAt: string;
}
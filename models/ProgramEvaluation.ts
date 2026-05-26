// models/ProgramEvaluation.ts

import { ProgramReadinessReport } from "./ProgramReadinessReport";

export interface ProgramEvaluation {
  programId: string;

  blockNumber: number;

  weekRange: {
    startWeek: number;
    endWeek: number;
  };

  readinessReport: ProgramReadinessReport;

  createdAt: string;
}
// models/ProgramGraduation.ts

export interface ProgramGraduationResult {
  graduate: boolean;

  nextProgramId?: string;

  recommendation:
    | "advance"
    | "repeat"
    | "deload";

  confidence: number;

  reasons: string[];
}
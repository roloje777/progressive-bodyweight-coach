// models/ProgramProgress.ts

export interface PendingGraduation {
  /**
   * Program from which the user has earned
   * progression eligibility.
   */
  programId: string;

  /**
   * Program that will become active if the
   * user accepts progression.
   */
  nextProgramId: string;

  /**
   * Zero-based week where graduation was earned.
   */
  earnedAtWeekIndex: number;

  /**
   * Immutable timestamp for future badges/history.
   */
  earnedAt: string;
}
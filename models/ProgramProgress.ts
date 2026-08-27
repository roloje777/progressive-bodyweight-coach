// models/ProgramProgress.ts

export interface PendingGraduation {
  programId: string;

  nextProgramId: string;

  /**
   * First week where the athlete earned
   * progression readiness.
   */
  earnedAtWeekIndex: number;

  earnedAt: string;

  /**
   * Most recent week where progression
   * readiness was confirmed.
   */
  confirmedAtWeekIndex: number;

  /**
   * Whether progression is currently allowed.
   *
   * false means the Coach is currently blocking
   * progression because of rating / MB / safety /
   * recovery / completion rules.
   */
  eligible: boolean;
}
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

export type DeloadReason =
  | "fatigue"
  | "pain"
  | "form"
  | "recovery";

export type DeloadPhase =
  | "deload"
  | "verification";

/**
 * Persisted recovery intervention state.
 *
 * The deload and verification phases are deliberately
 * separate:
 *
 * deload
 *   reduced/recovery prescription; no MB baseline update
 *
 * verification
 *   normal exercise structure with temporary 80% MB targets
 */
export interface ActiveDeload {
  programId: string;

  reason: DeloadReason;

  /** Week whose readiness evaluation triggered the deload. */
  triggeredAtWeekIndex: number;

  /** Week used for the recovery/deload prescription. */
  deloadWeekIndex: number;

  phase: DeloadPhase;

  /** Set when the deload phase has finished. */
  verificationWeekIndex?: number;

  /**
   * Temporary target scaling only. These values never
   * overwrite the historical healthy MB baseline.
   */
  deloadTargetScale: number;
  verificationTargetScale: number;

  createdAt: string;
}

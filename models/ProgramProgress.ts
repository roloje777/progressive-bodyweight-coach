// models/ProgramProgress.ts

export interface PendingGraduation {
  programId: string;
  nextProgramId: string;
  earnedAtWeekIndex: number;
  earnedAt: string;
  confirmedAtWeekIndex: number;
  eligible: boolean;
}



export interface ActiveRepeatWeek {
  /** Program whose optional repeat week is currently active. */
  programId: string;

  /** Zero-based week index selected by "Train Another Week". */
  weekIndex: number;

  /** When the user accepted the repeat-week recommendation. */
  createdAt: string;
}

export type DeloadReason =
  | "fatigue"
  | "pain"
  | "form"
  | "recovery";

export type DeloadPhase =
  | "deload"
  | "verification";

export interface ActiveDeload {
  programId: string;
  reason: DeloadReason;
  triggeredAtWeekIndex: number;
  deloadWeekIndex: number;
  phase: DeloadPhase;
  verificationWeekIndex?: number;
  deloadTargetScale: number;
  verificationTargetScale: number;

  /** When the Coach/deload intervention state was first created. */
  createdAt: string;



  /**
   * When the user explicitly accepted and started a pain-recovery cycle.
   *
   * The initial mandatory pain-rest interval is measured from this moment,
   * not from the earlier Coach recommendation. Optional for backward
   * compatibility with older stored deload records.
   */
  recoveryStartedAt?: string;
}

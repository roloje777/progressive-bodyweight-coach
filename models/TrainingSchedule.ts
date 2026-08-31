export type TrainingScheduleStatusType =
  | "training-available"
  | "rest-recommended"
  | "rest-required";

export type TrainingScheduleReason =
  | "normal-training"
  | "normal-rest-recommended"
  | "pain-initial-rest"
  | "pain-recovery-spacing";

export interface TrainingScheduleStatus {
  status: TrainingScheduleStatusType;
  canTrain: boolean;
  reason: TrainingScheduleReason;

  /**
   * Present for hard recovery restrictions while the session is still locked.
   * YYYY-MM-DD in the device's local calendar.
   */
  nextEligibleDate?: string;

  /**
   * Full calendar days between the relevant prior event and now.
   */
  restDaysCompleted: number;

  /**
   * Advisory for normal training, mandatory for pain recovery.
   */
  minimumRestDaysRequired?: number;

  consecutiveTrainingSessions: number;
  sessionsToday: number;
}

export interface TimestampedTrainingSession {
  completedAt: string;
  dayIndex?: number;
  trainingMode?: string;
}

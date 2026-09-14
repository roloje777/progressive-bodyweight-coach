import { AnalyticsTrend } from "./AnalyticsTrend";

export type RecoverySignalKey =
  | "joint-discomfort"
  | "low-energy"
  | "form-breakdown"
  | "couldnt-finish";

export type RecoveryWeeklyPoint = {
  weekKey: string;
  label: string;
  workouts: number;
  averageRating: number | null;
  signalBurden: number;
};

export type RecoverySignalBreakdown = {
  signal: RecoverySignalKey;
  count: number;
};

export type RecoveryModeBreakdown = {
  mode:
    | "normal"
    | "deload-fatigue"
    | "deload-pain"
    | "deload-form"
    | "deload-recovery"
    | "verification";
  count: number;
};

export type RecoveryRecentWorkout = {
  completedAt: string;
  programId: string;
  dayId: string;
  rating: number | null;
  tags: string[];
  trainingMode: string;
  signalBurden: number;
};

export type RecoveryDetailAnalytics = {
  workoutsConsidered: number;
  averageWorkoutRating: number | null;
  ratingTrend: AnalyticsTrend;
  recoveryTrend: AnalyticsTrend;
  painOccurrences: number;
  lowEnergyOccurrences: number;
  formBreakdownOccurrences: number;
  couldntFinishOccurrences: number;
  totalSignalOccurrences: number;
  deloadWorkoutCount: number;
  verificationWorkoutCount: number;
  weekly: RecoveryWeeklyPoint[];
  signals: RecoverySignalBreakdown[];
  modes: RecoveryModeBreakdown[];
  recentWorkouts: RecoveryRecentWorkout[];
};

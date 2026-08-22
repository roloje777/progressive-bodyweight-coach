// models/WorkoutCoachingSignals.ts

/**
 * Objective Match-or-Beat performance.
 *
 * Calculated from applicable MB targets only.
 */
export interface MatchOrBeatPerformance {
  /**
   * Number of sets with a valid MB target.
   *
   * Skipped / null targets are excluded.
   */
  applicableTargets: number;

  /**
   * Number of applicable targets that were met or beaten.
   */
  metTargets: number;

  /**
   * MB success rate.
   *
   * 0–1
   */
  successRate: number;

  /**
   * Whether enough historical MB data exists
   * to use MB as a progression signal.
   */
  sufficientHistory: boolean;

  /**
   * Reserved for future MB trend analysis / UI.
   *
   * At the moment this represents the current
   * workout success rate.
   */
  trend?: number;
}

/**
 * Subjective workout feedback supplied by the user.
 */
export interface WorkoutFeedbackSignals {
  /**
   * 1–5 subjective difficulty rating.
   *
   * 1 = Too Hard
   * 2 = Challenging
   * 3 = Just Right
   * 4 = Felt Good
   * 5 = Too Easy
   */
  difficultyRating: number | null;

  /**
   * Whether the user reported fatigue / low energy.
   */
  fatigue: boolean;

  /**
   * Whether the user reported pain or joint discomfort.
   *
   * Pain is an immediate progression blocker
   * when interpreted by ProgramReadinessEngine.
   */
  pain: boolean;

  /**
   * Whether form breakdown was reported.
   *
   * Form is an immediate progression blocker
   * when interpreted by ProgramReadinessEngine.
   */
  formBreakdown: boolean;

  /**
   * Original feedback tags.
   */
  tags: string[];

  /**
   * Optional free-text workout notes.
   */
  comment?: string;
}

/**
 * Workout completion signals.
 */
export interface WorkoutCompletionSignals {
  warmupCompletion: number; // 0–1
  mainCompletion: number; // 0–1
  stretchCompletion: number; // 0–1

  /**
   * Weighted overall completion.
   *
   * warmup  = 5%
   * main    = 90%
   * stretch = 5%
   */
  completionScore: number; // 0–1
}

/**
 * Historical context used by ProgramReadinessEngine.
 */
export interface CoachingHistorySignals {
  /**
   * Total historical occurrences, excluding
   * the current workout.
   */
  fatigueOccurrences: number;
  painOccurrences: number;
  formBreakdownOccurrences: number;

  /**
   * Occurrences in the two most recent
   * previous feedback workouts.
   *
   * Used for recurring-fatigue progression blocking.
   */
  recentFatigueOccurrences: number;
  recentPainOccurrences: number;
  recentFormBreakdownOccurrences: number;

  /**
   * MB history requirement supplied by the
   * active program.
   */
  validMBWeeks: number;
  requiredMBWeeks: number;
}

/**
 * Final coaching signals produced for a completed workout.
 *
 * IMPORTANT:
 *
 * This model intentionally contains SIGNALS only.
 *
 * It does NOT contain:
 *
 * - readiness
 * - progressionBlocked
 * - progressionCandidate
 * - deloadCandidate
 *
 * Those are decisions made by ProgramReadinessEngine.
 */
export interface WorkoutCoachingSignals {
  feedback: WorkoutFeedbackSignals;

  matchOrBeat: MatchOrBeatPerformance;

  completion: WorkoutCompletionSignals;

  history: CoachingHistorySignals;
}

// engine/ProgramReadinessEngine.ts

import { CompletedSession } from "../models/WorkoutLog";
import { ProgramReadinessReport } from "../models/ProgramReadinessReport";
import {
  MatchOrBeatTarget,
  ProgramExercise,
} from "../models/Exercise";
import { Program } from "../models/Program";
import {
  MatchOrBeatPerformance,
  WorkoutCoachingSignals,
} from "../models/WorkoutCoachingSignals";

import {
  calculateMatchOrBeatPerformance,
  calculateWorkoutCompletion,
  buildCoachingHistorySignals,
  interpretWorkoutFeedback,
} from "./WorkoutFeedbackEngine";

import { getMatchOrBeatTargets } from "./MatchOrBeatEngine";

/**
 * Only historically-derived targets count as
 * progression evidence.
 *
 * configuredFallback:
 *   useful for guiding the first exposure,
 *   but NOT progression evidence.
 *
 * currentWorkoutPreviousSet:
 *   useful for guiding later sets in the same workout,
 *   but NOT historical progression evidence.
 */
function isProgressionTarget(
  target: MatchOrBeatTarget,
): boolean {
  return (
    target.target != null &&
    target.target > 0 &&
    (
      target.source ===
        "historicalSameSet" ||
      target.source ===
        "historicalPreviousSet"
    )
  );
}

/**
 * -------------------------------------------------------
 * PROGRAM READINESS
 * -------------------------------------------------------
 */
export function evaluateProgramReadiness(
  workoutHistory: CompletedSession[],
  program: Program,
): ProgramReadinessReport {
  // -----------------------------------
  // PROGRAM CONFIGURATION
  // -----------------------------------

  const requiredProgramWeeks =
    program.weeks;

  /**
   * Week 1 establishes the baseline.
   *
   * Therefore:
   *
   * 4-week program
   * → baseline Week 1
   * → comparison Weeks 2, 3, 4
   * → 3 required comparison weeks
   */
  const requiredComparisonWeeks =
    Math.max(
      0,
      requiredProgramWeeks - 1,
    );

  // -----------------------------------
  // NO HISTORY
  // -----------------------------------

  if (!workoutHistory.length) {
    return {
      readinessScore: 0,

      mbSuccessRate: 0,

      completionRate: 0,

      fatigueOccurrences: 0,

      painOccurrences: 0,

      formBreakdownOccurrences: 0,

      averageDifficulty: 0,

      progressionBlocked: true,

      progressionCandidate: false,

      deloadCandidate: false,

      recommendation: "repeat",

      reasons: ["No workout history"],
    };
  }

  // -----------------------------------
  // CURRENT WORKOUT
  // -----------------------------------

  const currentWorkout =
    workoutHistory[
      workoutHistory.length - 1
    ];

  const previousWorkouts =
    workoutHistory.slice(
      0,
      -1,
    );

  // -----------------------------------
  // VALID COMPARISON WEEKS
  // -----------------------------------
  //
  // TEMPORARY WEEK INFERENCE:
  //
  // program.days.length tells us how many workouts
  // make up one program week.
  //
  // Example:
  //
  // 4 days:
  //
  // workouts 1–4  = Week 1
  // workouts 5–8  = Week 2
  // workouts 9–12 = Week 3
  //
  // This will later be replaced by persisted
  // week/day lifecycle identity.
  // -----------------------------------

  const validComparisonWeeks =
    calculateValidComparisonWeeks(
      workoutHistory,
      program,
    );

  // -----------------------------------
  // CURRENT PROGRESSION MB PERFORMANCE
  // -----------------------------------
  //
  // Only historically-derived targets count here.
  //
  // Week 1 configured fallback targets therefore
  // do NOT lower progression readiness.
  // -----------------------------------

  const currentMatchOrBeat =
    calculateWorkoutProgressionMB(
      currentWorkout,
      previousWorkouts,
      program,
      validComparisonWeeks,
      requiredComparisonWeeks,
    );

  // -----------------------------------
  // CURRENT FEEDBACK
  // -----------------------------------

  const feedbackSignals =
    interpretWorkoutFeedback(
      currentWorkout.feedback ?? {
        rating: null,
        tags: [],
      },
    );

  // -----------------------------------
  // COMPLETION
  // -----------------------------------

  const currentCompletion =
    calculateWorkoutCompletion(
      currentWorkout,
    );

  const completionRate =
    calculateAverageCompletionRate(
      workoutHistory,
    );

  // -----------------------------------
  // HISTORY SIGNALS
  // -----------------------------------
  //
  // The existing model still uses the names:
  //
  // validMBWeeks
  // requiredMBWeeks
  //
  // For now these values represent valid historical
  // comparison weeks.
  //
  // We can rename that model later if desired.
  // -----------------------------------

  const history =
    buildCoachingHistorySignals(
      workoutHistory,
      currentWorkout,
      validComparisonWeeks,
      requiredComparisonWeeks,
    );

  // -----------------------------------
  // CURRENT COACHING SIGNALS
  // -----------------------------------

  const currentSignals:
    WorkoutCoachingSignals = {
      feedback: feedbackSignals,
      matchOrBeat:
        currentMatchOrBeat,
      completion:
        currentCompletion,
      history,
    };

  // -----------------------------------
  // DIFFICULTY HISTORY
  // -----------------------------------

  const averageDifficulty =
    calculateAverageDifficulty(
      workoutHistory,
    );

  // -----------------------------------
  // MATCH-OR-BEAT
  // -----------------------------------

  const mbSuccessRate =
    currentSignals
      .matchOrBeat
      .successRate;

  const mbApplicableTargets =
    currentSignals
      .matchOrBeat
      .applicableTargets;

  const sufficientMBHistory =
    currentSignals
      .matchOrBeat
      .sufficientHistory;

  /**
   * Has this workout reached the historical
   * comparison phase at all?
   */
  const hasHistoricalMBEvidence =
    mbApplicableTargets > 0;

  // -----------------------------------
  // MB STATE
  // -----------------------------------

  const mbBlocked =
    hasHistoricalMBEvidence &&
    mbSuccessRate < 0.6;

  const mbHold =
    hasHistoricalMBEvidence &&
    mbSuccessRate >= 0.6 &&
    mbSuccessRate < 0.8;

  const mbCandidate =
    hasHistoricalMBEvidence &&
    mbSuccessRate >= 0.8 &&
    sufficientMBHistory;

  // -----------------------------------
  // CURRENT SAFETY SIGNALS
  // -----------------------------------

  const currentPain =
    currentSignals.feedback.pain;

  const currentFormBreakdown =
    currentSignals.feedback
      .formBreakdown;

  const currentFatigue =
    currentSignals.feedback.fatigue;

  // -----------------------------------
  // RECENT HISTORY
  // -----------------------------------

  const recentFatigue =
    currentSignals.history
      .recentFatigueOccurrences;

  const recentPain =
    currentSignals.history
      .recentPainOccurrences;

  const recentForm =
    currentSignals.history
      .recentFormBreakdownOccurrences;

  // -----------------------------------
  // RECURRING COUNTS
  // -----------------------------------

  const recurringFatigueCount =
    currentFatigue
      ? recentFatigue + 1
      : recentFatigue;

  const recurringPainCount =
    currentPain
      ? recentPain + 1
      : recentPain;

  const recurringFormCount =
    currentFormBreakdown
      ? recentForm + 1
      : recentForm;

  // -----------------------------------
  // SAFETY / RECOVERY BLOCKS
  // -----------------------------------

  const painBlock =
    currentPain;

  const formBlock =
    currentFormBreakdown;

  const fatigueBlock =
    currentFatigue ||
    recentFatigue >= 2;

  // -----------------------------------
  // DELOAD
  // -----------------------------------

  const deloadCandidate =
    recurringPainCount >= 2 ||
    recurringFatigueCount >= 3 ||
    recurringFormCount >= 3;

  // -----------------------------------
  // DIFFICULTY
  // -----------------------------------

  const difficultyRating =
    currentSignals.feedback
      .difficultyRating;

  const difficultyBlocksProgression =
    difficultyRating != null &&
    difficultyRating <= 2;

  // -----------------------------------
  // COMPLETION
  // -----------------------------------

  const completionBlocksProgression =
    currentSignals.completion
      .completionScore < 0.9;

  // -----------------------------------
  // PROGRESSION BLOCK
  // -----------------------------------

  const progressionBlocked =
    painBlock ||
    formBlock ||
    fatigueBlock ||
    !hasHistoricalMBEvidence ||
    !sufficientMBHistory ||
    mbBlocked ||
    mbHold ||
    difficultyBlocksProgression ||
    completionBlocksProgression;

  // -----------------------------------
  // PROGRESSION CANDIDATE
  // -----------------------------------

  const progressionCandidate =
    !progressionBlocked &&
    mbCandidate;

  // -----------------------------------
  // FINAL RECOMMENDATION
  // -----------------------------------

  let recommendation:
    | "advance"
    | "repeat"
    | "deload" = "repeat";

  const reasons: string[] = [];

  // -----------------------------------
  // 1. DELOAD
  // -----------------------------------

  if (deloadCandidate) {
    recommendation = "deload";

    if (
      recurringPainCount >= 2
    ) {
      reasons.push(
        "Recurring joint discomfort",
      );
    }

    if (
      recurringFatigueCount >= 3
    ) {
      reasons.push(
        "Recurring fatigue",
      );
    }

    if (
      recurringFormCount >= 3
    ) {
      reasons.push(
        "Recurring form breakdown",
      );
    }
  }

  // -----------------------------------
  // 2. SAFETY / RECOVERY HOLD
  // -----------------------------------

  else if (
    painBlock ||
    formBlock ||
    fatigueBlock
  ) {
    recommendation = "repeat";

    if (painBlock) {
      reasons.push(
        "Current joint discomfort blocks progression",
      );
    }

    if (formBlock) {
      reasons.push(
        "Current form breakdown blocks progression",
      );
    }

    if (fatigueBlock) {
      reasons.push(
        "Current or recurring fatigue blocks progression",
      );
    }
  }

  // -----------------------------------
  // 3. BASELINE / NO HISTORICAL MB
  // -----------------------------------
  //
  // IMPORTANT:
  //
  // This comes BEFORE MB <60%.
  //
  // Week 1 should therefore never be described as
  // poor MB performance simply because it is
  // establishing a baseline.
  // -----------------------------------

  else if (
    !hasHistoricalMBEvidence
  ) {
    recommendation = "repeat";

    reasons.push(
      "Baseline Match-or-Beat performance established; historical comparison begins on the next exposure",
    );
  }

  // -----------------------------------
  // 4. INSUFFICIENT COMPARISON HISTORY
  // -----------------------------------

  else if (
    !sufficientMBHistory
  ) {
    recommendation = "repeat";

    reasons.push(
      `More historical Match-or-Beat comparison required (${validComparisonWeeks}/${requiredComparisonWeeks} comparison weeks)`,
    );
  }

  // -----------------------------------
  // 5. MB BLOCK
  // -----------------------------------

  else if (mbBlocked) {
    recommendation = "repeat";

    reasons.push(
      "Match-or-Beat performance is below 60%",
    );
  }

  // -----------------------------------
  // 6. MB HOLD
  // -----------------------------------

  else if (mbHold) {
    recommendation = "repeat";

    reasons.push(
      "Match-or-Beat performance is in the 60–79% hold range",
    );
  }

  // -----------------------------------
  // 7. DIFFICULTY HOLD
  // -----------------------------------

  else if (
    difficultyBlocksProgression
  ) {
    recommendation = "repeat";

    reasons.push(
      "Difficulty rating 1–2 blocks progression",
    );
  }

  // -----------------------------------
  // 8. COMPLETION HOLD
  // -----------------------------------

  else if (
    completionBlocksProgression
  ) {
    recommendation = "repeat";

    reasons.push(
      "Workout completion is below the progression requirement",
    );
  }

  // -----------------------------------
  // 9. ADVANCE
  // -----------------------------------

  else if (
    progressionCandidate
  ) {
    recommendation = "advance";

    reasons.push(
      "Historical Match-or-Beat performance is at least 80%",
    );

    reasons.push(
      "Required comparison history completed",
    );

    if (
      difficultyRating === 3
    ) {
      reasons.push(
        "Difficulty rating 3 is compatible with strong objective performance",
      );
    }

    if (
      difficultyRating != null &&
      difficultyRating >= 4
    ) {
      reasons.push(
        "Difficulty rating supports progression",
      );
    }

    reasons.push(
      "Completion requirement satisfied",
    );

    reasons.push(
      "No safety or recovery blockers",
    );
  }

  // -----------------------------------
  // DEFAULT HOLD
  // -----------------------------------

  else {
    recommendation = "repeat";

    reasons.push(
      "Progression conditions are not yet fully satisfied",
    );
  }

  // -----------------------------------
  // READINESS SCORE
  // -----------------------------------
  //
  // Presentation only.
  // -----------------------------------

  let readinessScore = 50;

  if (
    recommendation === "advance"
  ) {
    readinessScore = 100;
  } else if (
    recommendation === "deload"
  ) {
    readinessScore = 0;
  } else if (
    !hasHistoricalMBEvidence
  ) {
    readinessScore = 50;
  } else if (
    progressionBlocked
  ) {
    readinessScore = 25;
  } else if (
    mbHold
  ) {
    readinessScore = 60;
  }



  // -----------------------------------
  // FINAL REPORT
  // -----------------------------------

  return {
    readinessScore,

    mbSuccessRate,

    completionRate,

    fatigueOccurrences:
      currentSignals.history
        .fatigueOccurrences,

    painOccurrences:
      currentSignals.history
        .painOccurrences,

    formBreakdownOccurrences:
      currentSignals.history
        .formBreakdownOccurrences,

    averageDifficulty,

    progressionBlocked,

    progressionCandidate,

    deloadCandidate,

    recommendation,

    reasons,
  };
}

/**
 * -------------------------------------------------------
 * CONFIGURED EXERCISE LOOKUP
 * -------------------------------------------------------
 */
function findConfiguredExercise(
  program: Program,
  exerciseId: string,
): ProgramExercise | undefined {
  for (const day of program.days) {
    const exercise =
      day.exercises.find(
        (programExercise) =>
          programExercise.exerciseId ===
          exerciseId,
      );

    if (exercise) {
      return exercise;
    }
  }

  return undefined;
}

/**
 * -------------------------------------------------------
 * WORKOUT PROGRESSION MB
 * -------------------------------------------------------
 *
 * All Match-or-Beat targets may be useful to the
 * workout UI.
 *
 * But only targets derived from HISTORICAL
 * performance count as progression evidence.
 */
function calculateWorkoutProgressionMB(
  workout: CompletedSession,
  historyBeforeWorkout: CompletedSession[],
  program: Program,
  validComparisonWeeks: number,
  requiredComparisonWeeks: number,
): MatchOrBeatPerformance {
  let applicableTargets = 0;
  let metTargets = 0;

  for (
    const exercise of
    workout.exercises
  ) {
    const configuredExercise =
      findConfiguredExercise(
        program,
        exercise.exerciseId,
      );

    const allTargets =
      getMatchOrBeatTargets(
        exercise,
        historyBeforeWorkout,
        exercise.exerciseId,
        configuredExercise,
      );

    /**
     * configuredFallback and
     * currentWorkoutPreviousSet are guidance targets,
     * not historical progression evidence.
     */
    const progressionTargets =
      allTargets.filter(
        isProgressionTarget,
      );

    if (
      !progressionTargets.length
    ) {
      continue;
    }

    const performance =
      calculateMatchOrBeatPerformance(
        progressionTargets,
        exercise.sets,
        validComparisonWeeks,
        requiredComparisonWeeks,
      );

    applicableTargets +=
      performance.applicableTargets;

    metTargets +=
      performance.metTargets;
  }

  const successRate =
    applicableTargets > 0
      ? Number(
          (
            metTargets /
            applicableTargets
          ).toFixed(2),
        )
      : 0;

  return {
    applicableTargets,

    metTargets,

    successRate,

    sufficientHistory:
      requiredComparisonWeeks === 0 ||
      validComparisonWeeks >=
        requiredComparisonWeeks,

    trend:
      successRate,
  };
}

/**
 * -------------------------------------------------------
 * VALID COMPARISON WEEKS
 * -------------------------------------------------------
 *
 * TEMPORARY week reconstruction.
 *
 * We know:
 *
 * program.days.length
 * = number of workouts in one program week.
 *
 * Week 1 is baseline and is never counted as a
 * historical comparison week.
 *
 * Only COMPLETE inferred weeks can count.
 *
 * This is temporary until CompletedSession stores
 * explicit program-week identity.
 */
function calculateValidComparisonWeeks(
  workoutHistory: CompletedSession[],
  program: Program,
): number {
  const workoutsPerWeek =
    program.days.length;

  if (
    workoutsPerWeek <= 0
  ) {
    return 0;
  }

  const completedWeeks =
    Math.floor(
      workoutHistory.length /
        workoutsPerWeek,
    );

  /**
   * Week 1 = baseline.
   *
   * Therefore no comparison week can exist until
   * at least Week 2 has been completed.
   */
  if (
    completedWeeks <= 1
  ) {
    return 0;
  }

  let validComparisonWeeks = 0;

  /**
   * weekIndex 0 = baseline week
   *
   * Start at 1 = Week 2.
   */
  for (
    let weekIndex = 1;
    weekIndex < completedWeeks;
    weekIndex++
  ) {
    const weekStart =
      weekIndex *
      workoutsPerWeek;

    const weekEnd =
      weekStart +
      workoutsPerWeek;

    const weekWorkouts =
      workoutHistory.slice(
        weekStart,
        weekEnd,
      );

    /**
     * A comparison week is valid only if every
     * workout in that completed week has at least
     * one genuine historical MB target.
     */
    const weekIsValid =
      weekWorkouts.every(
        (
          workout,
          workoutOffset,
        ) => {
          const absoluteWorkoutIndex =
            weekStart +
            workoutOffset;

          const historyBeforeWorkout =
            workoutHistory.slice(
              0,
              absoluteWorkoutIndex,
            );

          return hasProgressionTargets(
            workout,
            historyBeforeWorkout,
            program,
          );
        },
      );

    if (weekIsValid) {
      validComparisonWeeks++;
    }
  }

  return validComparisonWeeks;
}

/**
 * Determine whether a workout has any genuine
 * historical Match-or-Beat comparison target.
 */
function hasProgressionTargets(
  workout: CompletedSession,
  historyBeforeWorkout: CompletedSession[],
  program: Program,
): boolean {
  for (
    const exercise of
    workout.exercises
  ) {
    const configuredExercise =
      findConfiguredExercise(
        program,
        exercise.exerciseId,
      );

    const targets =
      getMatchOrBeatTargets(
        exercise,
        historyBeforeWorkout,
        exercise.exerciseId,
        configuredExercise,
      );

    if (
      targets.some(
        isProgressionTarget,
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * -------------------------------------------------------
 * COMPLETION HISTORY
 * -------------------------------------------------------
 */
function calculateAverageCompletionRate(
  workoutHistory: CompletedSession[],
): number {
  if (!workoutHistory.length) {
    return 0;
  }

  const total =
    workoutHistory.reduce(
      (sum, workout) =>
        sum +
        calculateWorkoutCompletion(
          workout,
        ).completionScore,
      0,
    );

  return Number(
    (
      total /
      workoutHistory.length
    ).toFixed(2),
  );
}

/**
 * -------------------------------------------------------
 * AVERAGE DIFFICULTY
 * -------------------------------------------------------
 */
function calculateAverageDifficulty(
  workoutHistory: CompletedSession[],
): number {
  const feedbackWorkouts =
    workoutHistory.filter(
      (workout) =>
        workout.feedback?.rating !=
        null,
    );

  if (!feedbackWorkouts.length) {
    return 0;
  }

  const total =
    feedbackWorkouts.reduce(
      (sum, workout) =>
        sum +
        (
          workout.feedback?.rating ??
          0
        ),
      0,
    );

  return Number(
    (
      total /
      feedbackWorkouts.length
    ).toFixed(2),
  );
}
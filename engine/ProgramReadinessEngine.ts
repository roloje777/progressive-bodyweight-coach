// engine/ProgramReadinessEngine.ts

import { CompletedSession } from "../models/WorkoutLog";
import { ProgramReadinessReport } from "../models/ProgramReadinessReport";
import { MatchOrBeatTarget, ProgramExercise } from "../models/Exercise";
import { Program } from "../models/Program";
import { DeloadReason } from "../models/ProgramProgress";
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
function isProgressionTarget(target: MatchOrBeatTarget): boolean {
  return (
    target.target != null &&
    target.target > 0 &&
    (target.source === "historicalSameSet" ||
      target.source === "historicalPreviousSet")
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

  const requiredProgramWeeks = program.weeks;

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
  const requiredComparisonWeeks = Math.max(0, requiredProgramWeeks - 1);

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

      deloadReason: null,

      recommendation: "repeat",

      reasons: ["No workout history"],
    };
  }

  // -----------------------------------
  // CURRENT WORKOUT
  // -----------------------------------

  const currentWorkout = workoutHistory[workoutHistory.length - 1];

  const previousWorkouts = getHistoryBeforeWorkout(
    workoutHistory,
    currentWorkout,
  );

  // -----------------------------------
  // EVALUATION WINDOW
  // -----------------------------------
  //
  // During the configured program:
  //
  // Week 1 → baseline
  // Weeks 2..N → structured historical
  //              graduation assessment
  //
  // After the configured program:
  //
  // Week N+1
  // Week N+2
  // ...
  //
  // each optional week becomes its own fresh
  // readiness-reconfirmation window.
  //
  // Historical workout data is STILL retained for
  // Match-or-Beat target generation.
  // -----------------------------------

  const currentWeekIndex = currentWorkout.weekIndex;

  const isOptionalReconfirmation =
    currentWeekIndex != null && currentWeekIndex >= program.weeks;

  const currentWeekWorkouts =
    currentWeekIndex == null
      ? [currentWorkout]
      : workoutHistory
          .filter((workout) => workout.weekIndex === currentWeekIndex)
          .sort((a, b) => (a.dayIndex ?? 0) - (b.dayIndex ?? 0));

  /**
   * Readiness statistics use:
   *
   * structured program:
   *   existing program history
   *
   * optional week:
   *   current week only
   */
  const evaluationWorkouts = (isOptionalReconfirmation
    ? currentWeekWorkouts
    : workoutHistory
  ).filter((workout) => !workout.trainingMode?.startsWith("deload-"));

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

  const validComparisonWeeks = calculateValidComparisonWeeks(
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

  const currentMatchOrBeat = isOptionalReconfirmation
    ? calculateOptionalWeekProgressionMB(
        currentWeekWorkouts,
        workoutHistory,
        program,
      )
    : calculateWorkoutProgressionMB(
        currentWorkout,
        previousWorkouts,
        program,
        validComparisonWeeks,
        requiredComparisonWeeks,
      );

  // -----------------------------------
  // CURRENT FEEDBACK
  // -----------------------------------

  const feedbackSignals = interpretWorkoutFeedback(
    currentWorkout.feedback ?? {
      rating: null,
      tags: [],
    },
  );

  // -----------------------------------
  // COMPLETION
  // -----------------------------------

  const currentCompletion = calculateWorkoutCompletion(currentWorkout);

  const completionRate = calculateAverageCompletionRate(evaluationWorkouts);

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

  const history = buildCoachingHistorySignals(
    evaluationWorkouts,
    currentWorkout,

    isOptionalReconfirmation ? 0 : validComparisonWeeks,

    isOptionalReconfirmation ? 0 : requiredComparisonWeeks,
  );
  // -----------------------------------
  // CURRENT COACHING SIGNALS
  // -----------------------------------

  const currentSignals: WorkoutCoachingSignals = {
    feedback: feedbackSignals,
    matchOrBeat: currentMatchOrBeat,
    completion: currentCompletion,
    history,
  };

  // -----------------------------------
  // DIFFICULTY HISTORY
  // -----------------------------------

  const averageDifficulty = calculateAverageDifficulty(evaluationWorkouts);

  // -----------------------------------
  // MATCH-OR-BEAT
  // -----------------------------------

  const mbSuccessRate = currentSignals.matchOrBeat.successRate;

  const mbApplicableTargets = currentSignals.matchOrBeat.applicableTargets;

  const sufficientMBHistory = currentSignals.matchOrBeat.sufficientHistory;

  /**
   * Has this workout reached the historical
   * comparison phase at all?
   */
  const hasHistoricalMBEvidence = mbApplicableTargets > 0;

  // -----------------------------------
  // MB STATE
  // -----------------------------------

  const mbBlocked = hasHistoricalMBEvidence && mbSuccessRate < 0.6;

  const mbHold =
    hasHistoricalMBEvidence && mbSuccessRate >= 0.6 && mbSuccessRate < 0.8;

  const mbCandidate =
    hasHistoricalMBEvidence && mbSuccessRate >= 0.8 && sufficientMBHistory;

  // -----------------------------------
  // CURRENT SAFETY SIGNALS
  // -----------------------------------

  const currentPain = currentSignals.feedback.pain;

  const currentFormBreakdown = currentSignals.feedback.formBreakdown;

  const currentFatigue = currentSignals.feedback.fatigue;

  // -----------------------------------
  // RECENT HISTORY
  // -----------------------------------

  const recentFatigue = currentSignals.history.recentFatigueOccurrences;

  const recentPain = currentSignals.history.recentPainOccurrences;

  const recentForm = currentSignals.history.recentFormBreakdownOccurrences;

  // -----------------------------------
  // RECURRING COUNTS
  // -----------------------------------

  const recurringFatigueCount = currentFatigue
    ? recentFatigue + 1
    : recentFatigue;

  const recurringPainCount = currentPain ? recentPain + 1 : recentPain;

  const recurringFormCount = currentFormBreakdown ? recentForm + 1 : recentForm;

  // -----------------------------------
  // SAFETY / RECOVERY BLOCKS
  // -----------------------------------

  const painBlock = currentPain;

  const formBlock = currentFormBreakdown;

  const fatigueBlock = currentFatigue || recentFatigue >= 2;

  // -----------------------------------
  // DELOAD
  // -----------------------------------

  const deloadCandidate =
    recurringPainCount >= 2 ||
    recurringFatigueCount >= 3 ||
    recurringFormCount >= 3;

  let deloadReason: DeloadReason | null = null;

  // Pain takes priority because its recovery prescription
  // deliberately excludes normal strength work.
  if (recurringPainCount >= 2) {
    deloadReason = "pain";
  } else if (recurringFormCount >= 3) {
    deloadReason = "form";
  } else if (recurringFatigueCount >= 3) {
    deloadReason = "fatigue";
  } else if (deloadCandidate) {
    deloadReason = "recovery";
  }

  // -----------------------------------
  // DIFFICULTY
  // -----------------------------------

  const difficultyRating = isOptionalReconfirmation
    ? averageDifficulty
    : currentSignals.feedback.difficultyRating;

  const difficultyBlocksProgression =
    difficultyRating != null && difficultyRating <= 2;

  // -----------------------------------
  // COMPLETION
  // -----------------------------------

  const progressionCompletionScore = isOptionalReconfirmation
    ? completionRate
    : currentSignals.completion.completionScore;

  const completionBlocksProgression = progressionCompletionScore < 0.9;

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

  const progressionCandidate = !progressionBlocked && mbCandidate;

  // -----------------------------------
  // FINAL RECOMMENDATION
  // -----------------------------------

  let recommendation: "advance" | "repeat" | "deload" = "repeat";

  const reasons: string[] = [];

  // -----------------------------------
  // 1. DELOAD
  // -----------------------------------

  if (deloadCandidate) {
    recommendation = "deload";

    if (recurringPainCount >= 2) {
      reasons.push("Recurring joint discomfort");
    }

    if (recurringFatigueCount >= 3) {
      reasons.push("Recurring fatigue");
    }

    if (recurringFormCount >= 3) {
      reasons.push("Recurring form breakdown");
    }
  }

  // -----------------------------------
  // 2. SAFETY / RECOVERY HOLD
  // -----------------------------------
  else if (painBlock || formBlock || fatigueBlock) {
    recommendation = "repeat";

    if (painBlock) {
      reasons.push("Current joint discomfort blocks progression");
    }

    if (formBlock) {
      reasons.push("Current form breakdown blocks progression");
    }

    if (fatigueBlock) {
      reasons.push("Current or recurring fatigue blocks progression");
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
  else if (!hasHistoricalMBEvidence) {
    recommendation = "repeat";

    reasons.push(
      "Baseline Match-or-Beat performance established; historical comparison begins on the next exposure",
    );
  }

  // -----------------------------------
  // 4. INSUFFICIENT COMPARISON HISTORY
  // -----------------------------------
  else if (!sufficientMBHistory) {
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

    reasons.push("Match-or-Beat performance is below 60%");
  }

  // -----------------------------------
  // 6. MB HOLD
  // -----------------------------------
  else if (mbHold) {
    recommendation = "repeat";

    reasons.push("Match-or-Beat performance is in the 60–79% hold range");
  }

  // -----------------------------------
  // 7. DIFFICULTY HOLD
  // -----------------------------------
  else if (difficultyBlocksProgression) {
    recommendation = "repeat";

    reasons.push("Difficulty rating 1–2 blocks progression");
  }

  // -----------------------------------
  // 8. COMPLETION HOLD
  // -----------------------------------
  else if (completionBlocksProgression) {
    recommendation = "repeat";

    reasons.push("Workout completion is below the progression requirement");
  }

  // -----------------------------------
  // 9. ADVANCE
  // -----------------------------------
  else if (progressionCandidate) {
    recommendation = "advance";

    if (isOptionalReconfirmation) {
      reasons.push("Current week Match-or-Beat performance is at least 80%");

      reasons.push("Progression readiness reconfirmed");
    } else {
      reasons.push("Historical Match-or-Beat performance is at least 80%");

      reasons.push("Required comparison history completed");
    }

    if (difficultyRating === 3) {
      reasons.push(
        "Difficulty rating 3 is compatible with strong objective performance",
      );
    }

    if (difficultyRating != null && difficultyRating >= 4) {
      reasons.push("Difficulty rating supports progression");
    }

    reasons.push("Completion requirement satisfied");

    reasons.push("No safety or recovery blockers");
  }

  // -----------------------------------
  // DEFAULT HOLD
  // -----------------------------------
  else {
    recommendation = "repeat";

    reasons.push("Progression conditions are not yet fully satisfied");
  }

  // -----------------------------------
  // READINESS SCORE
  // -----------------------------------
  //
  // Presentation only.
  // -----------------------------------

  let readinessScore = 50;

  if (recommendation === "advance") {
    readinessScore = 100;
  } else if (recommendation === "deload") {
    readinessScore = 0;
  } else if (!hasHistoricalMBEvidence) {
    readinessScore = 50;
  } else if (progressionBlocked) {
    readinessScore = 25;
  } else if (mbHold) {
    readinessScore = 60;
  }

  // -----------------------------------
  // DEBUG
  // -----------------------------------

  logProgramReadinessDebug({
    program,

    currentWorkout,

    evaluationMode: isOptionalReconfirmation
      ? "optional-week-reconfirmation"
      : "structured-program",

      

    evaluationWorkoutCount: evaluationWorkouts.length,

    requiredComparisonWeeks,
    validComparisonWeeks,

    mbSuccessRate,
    mbApplicableTargets,
    hasHistoricalMBEvidence,

    completionRate,

    currentCompletion: currentCompletion.completionScore,

    difficultyRating,

    currentPain,
    currentFormBreakdown,
    currentFatigue,

    recentFatigue,
    recentPain,
    recentForm,

    progressionBlocked,
    progressionCandidate,
    deloadCandidate,

    deloadReason,

    recommendation,

    reasons,
  });

  // -----------------------------------
  // FINAL REPORT
  // -----------------------------------

  return {
    readinessScore,

    mbSuccessRate,

    completionRate,

    fatigueOccurrences: currentSignals.history.fatigueOccurrences,

    painOccurrences: currentSignals.history.painOccurrences,

    formBreakdownOccurrences: currentSignals.history.formBreakdownOccurrences,

    averageDifficulty,

    progressionBlocked,

    progressionCandidate,

    deloadCandidate,

    deloadReason,

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
    const exercise = day.exercises.find(
      (programExercise) => programExercise.exerciseId === exerciseId,
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

  for (const exercise of workout.exercises) {
    const configuredExercise = findConfiguredExercise(
      program,
      exercise.exerciseId,
    );

    const targetHistory =
      workout.trainingMode === "verification"
        ? historyBeforeWorkout.filter(
            (historicalWorkout) =>
              historicalWorkout.trainingMode !== "verification" &&
              !historicalWorkout.trainingMode?.startsWith("deload-"),
          )
        : historyBeforeWorkout;

    const allTargets = getMatchOrBeatTargets(
      exercise,
      targetHistory,
      exercise.exerciseId,
      configuredExercise,
    );

    /**
     * configuredFallback and
     * currentWorkoutPreviousSet are guidance targets,
     * not historical progression evidence.
     */
    const verificationScale =
      workout.trainingMode === "verification"
        ? workout.deload?.targetScale ?? 0.8
        : 1;

    const progressionTargets = allTargets
      .filter(isProgressionTarget)
      .map((target) =>
        verificationScale === 1 || target.target == null
          ? target
          : {
              ...target,
              target: Math.max(1, Math.ceil(target.target * verificationScale)),
            },
      );

    if (!progressionTargets.length) {
      continue;
    }

    const performance = calculateMatchOrBeatPerformance(
      progressionTargets,
      exercise.sets,
      validComparisonWeeks,
      requiredComparisonWeeks,
    );

    applicableTargets += performance.applicableTargets;

    metTargets += performance.metTargets;
  }

  const successRate =
    applicableTargets > 0
      ? Number((metTargets / applicableTargets).toFixed(2))
      : 0;

  return {
    applicableTargets,

    metTargets,

    successRate,

    sufficientHistory:
      requiredComparisonWeeks === 0 ||
      validComparisonWeeks >= requiredComparisonWeeks,

    trend: successRate,
  };
}

/**
 * -------------------------------------------------------
 * OPTIONAL-WEEK PROGRESSION MB
 * -------------------------------------------------------
 *
 * Once graduation has already been earned, every
 * additional week becomes a fresh reconfirmation
 * window.
 *
 * MB SUCCESS RATE:
 *
 *   calculated from THIS WEEK only.
 *
 * MB TARGET VALUES:
 *
 *   still reconstructed from FULL valid historical
 *   performance.
 *
 * Example:
 *
 * Week 6 Day 3:
 *
 * Week 5 Day 3 had joint discomfort
 *     ↓
 * MatchOrBeatEngine ignores Week 5 Day 3 as a
 * future target source
 *     ↓
 * target falls back to the latest valid healthy
 * Day 3 exposure.
 */
function calculateOptionalWeekProgressionMB(
  weekWorkouts: CompletedSession[],

  fullWorkoutHistory: CompletedSession[],

  program: Program,
): MatchOrBeatPerformance {
  let applicableTargets = 0;

  let metTargets = 0;

  const orderedWorkouts = [...weekWorkouts].sort(
    (a, b) => (a.dayIndex ?? 0) - (b.dayIndex ?? 0),
  );

  for (const workout of orderedWorkouts) {
    /**
     * Full historical state before this
     * particular workout.
     *
     * This preserves MB lineage across every
     * previous healthy exposure.
     */
    const historyBeforeWorkout = getHistoryBeforeWorkout(
      fullWorkoutHistory,
      workout,
    );

    /**
     * Optional reconfirmation does NOT need to
     * re-earn the original comparison-history
     * requirement.
     *
     * Graduation was already earned.
     *
     * We therefore pass:
     *
     * validComparisonWeeks    = 0
     * requiredComparisonWeeks = 0
     *
     * so sufficientHistory is true.
     */
    const performance = calculateWorkoutProgressionMB(
      workout,
      historyBeforeWorkout,
      program,
      0,
      0,
    );

    applicableTargets += performance.applicableTargets;

    metTargets += performance.metTargets;
  }

  const successRate =
    applicableTargets > 0
      ? Number((metTargets / applicableTargets).toFixed(2))
      : 0;

  return {
    applicableTargets,

    metTargets,

    successRate,

    /**
     * The athlete already completed the
     * structured historical requirement.
     *
     * Optional weeks only reconfirm current
     * readiness.
     */
    sufficientHistory: true,

    trend: successRate,
  };
}

/**
 * -------------------------------------------------------
 * VALID COMPARISON WEEKS
 * -------------------------------------------------------
 *
 * Week identity now comes directly from
 * CompletedSession.weekIndex / dayIndex.
 *
 * Week 1:
 *   weekIndex = 0
 *   establishes the baseline
 *
 * Week 2+:
 *   comparison weeks
 *
 * A comparison week counts only when:
 *
 * 1. every configured program day exists
 * 2. every workout has a valid persisted dayIndex
 * 3. every workout has genuine historical MB targets
 *
 * No workout-count inference is performed here.
 */
function calculateValidComparisonWeeks(
  workoutHistory: CompletedSession[],
  program: Program,
): number {
  let validComparisonWeeks = 0;

  /**
   * weekIndex 0 is the baseline week.
   *
   * Therefore comparison history begins at:
   *
   * weekIndex 1 = displayed Week 2
   */
  for (let weekIndex = 1; weekIndex < program.weeks; weekIndex++) {
    const weekWorkouts = workoutHistory.filter(
      (workout) =>
        workout.weekIndex === weekIndex &&
        !workout.trainingMode?.startsWith("deload-"),
    );

    // -----------------------------------
    // COMPLETE WEEK CHECK
    // -----------------------------------

    const completedDayIndexes = new Set(
      weekWorkouts
        .filter((workout) => workout.dayIndex != null)
        .map((workout) => workout.dayIndex as number),
    );

    const weekComplete = program.days.every((_, dayIndex) =>
      completedDayIndexes.has(dayIndex),
    );

    if (!weekComplete) {
      continue;
    }

    // -----------------------------------
    // MB COMPARISON VALIDITY
    // -----------------------------------
    //
    // Every workout in this completed week must have
    // at least one genuine historical MB target.
    // -----------------------------------

    const weekIsValid = program.days.every((_, dayIndex) => {
      const workout = weekWorkouts.find((item) => item.dayIndex === dayIndex);

      if (!workout) {
        return false;
      }

      const historyBeforeWorkout = getHistoryBeforeWorkout(
        workoutHistory,
        workout,
      );

      return hasProgressionTargets(workout, historyBeforeWorkout, program);
    });

    if (weekIsValid) {
      validComparisonWeeks++;
    }
  }

  return validComparisonWeeks;
}

/**
 * -------------------------------------------------------
 * HISTORY BEFORE WORKOUT
 * -------------------------------------------------------
 *
 * Determine historical state using persisted lifecycle
 * identity rather than array position.
 *
 * Example:
 *
 * Current workout:
 *
 * Week 3 Day 2
 *
 * History contains:
 *
 * all Week 1
 * all Week 2
 * Week 3 Day 1
 *
 * but NOT Week 3 Day 2+.
 */
function getHistoryBeforeWorkout(
  workoutHistory: CompletedSession[],
  currentWorkout: CompletedSession,
): CompletedSession[] {
  const currentWeekIndex = currentWorkout.weekIndex;

  const currentDayIndex = currentWorkout.dayIndex;

  /**
   * Backward compatibility for older workout data
   * without lifecycle identity.
   *
   * This is not used by newly stored sessions.
   */
  if (currentWeekIndex == null || currentDayIndex == null) {
    const currentIndex = workoutHistory.indexOf(currentWorkout);

    return currentIndex >= 0 ? workoutHistory.slice(0, currentIndex) : [];
  }

  return workoutHistory.filter((workout) => {
    if (workout.weekIndex == null || workout.dayIndex == null) {
      return false;
    }

    // Earlier week
    if (workout.weekIndex < currentWeekIndex) {
      return true;
    }

    // Later week
    if (workout.weekIndex > currentWeekIndex) {
      return false;
    }

    // Same week → only earlier day
    return workout.dayIndex < currentDayIndex;
  });
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
  for (const exercise of workout.exercises) {
    const configuredExercise = findConfiguredExercise(
      program,
      exercise.exerciseId,
    );

    const targets = getMatchOrBeatTargets(
      exercise,
      historyBeforeWorkout,
      exercise.exerciseId,
      configuredExercise,
    );

    if (targets.some(isProgressionTarget)) {
      return true;
    }
  }

  return false;
}

/**
 * -------------------------------------------------------
 * READINESS DEBUG LOG
 * -------------------------------------------------------
 *
 * Temporary diagnostic helper for validating the
 * program lifecycle / readiness integration.
 *
 * Keeps diagnostic logging out of the main readiness
 * decision logic.
 */
function logProgramReadinessDebug({
  program,
  currentWorkout,

  evaluationMode,
  evaluationWorkoutCount,

  requiredComparisonWeeks,
  validComparisonWeeks,

  mbSuccessRate,
  mbApplicableTargets,
  hasHistoricalMBEvidence,

  completionRate,
  currentCompletion,

  difficultyRating,

  currentPain,
  currentFormBreakdown,
  currentFatigue,

  recentFatigue,
  recentPain,
  recentForm,

  progressionBlocked,
  progressionCandidate,
  deloadCandidate,
  deloadReason,

  recommendation,

  reasons,
}: {
  program: Program;

  currentWorkout: CompletedSession;

  evaluationMode:
    | "structured-program"
    | "optional-week-reconfirmation";

  evaluationWorkoutCount: number;

  requiredComparisonWeeks: number;
  validComparisonWeeks: number;

  mbSuccessRate: number;
  mbApplicableTargets: number;
  hasHistoricalMBEvidence: boolean;

  completionRate: number;
  currentCompletion: number;

  difficultyRating: number | null;

  currentPain: boolean;
  currentFormBreakdown: boolean;
  currentFatigue: boolean;

  recentFatigue: number;
  recentPain: number;
  recentForm: number;

  progressionBlocked: boolean;
  progressionCandidate: boolean;
  deloadCandidate: boolean;
  deloadReason: DeloadReason | null;

  recommendation:
    | "advance"
    | "repeat"
    | "deload";

  reasons: string[];
}) {
  console.log("🧠 PROGRAM READINESS", {
    programId: program.id,

    currentWeekIndex: currentWorkout.weekIndex,

    currentDayIndex: currentWorkout.dayIndex,

       evaluationMode,

    evaluationWorkoutCount,

    programWeeks: program.weeks,

    requiredComparisonWeeks,

    validComparisonWeeks,

    mbSuccessRate,

    mbApplicableTargets,

    hasHistoricalMBEvidence,

    completionRate,

    currentCompletion,

    difficultyRating,

    currentPain,

    currentFormBreakdown,

    currentFatigue,

    recentFatigue,

    recentPain,

    recentForm,

    progressionBlocked,

    progressionCandidate,

    deloadCandidate,

    deloadReason,

    recommendation,

    reasons,
  });
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

  const total = workoutHistory.reduce(
    (sum, workout) => sum + calculateWorkoutCompletion(workout).completionScore,
    0,
  );

  return Number((total / workoutHistory.length).toFixed(2));
}

/**
 * -------------------------------------------------------
 * AVERAGE DIFFICULTY
 * -------------------------------------------------------
 */
function calculateAverageDifficulty(
  workoutHistory: CompletedSession[],
): number {
  const feedbackWorkouts = workoutHistory.filter(
    (workout) => workout.feedback?.rating != null,
  );

  if (!feedbackWorkouts.length) {
    return 0;
  }

  const total = feedbackWorkouts.reduce(
    (sum, workout) => sum + (workout.feedback?.rating ?? 0),
    0,
  );

  return Number((total / feedbackWorkouts.length).toFixed(2));
}

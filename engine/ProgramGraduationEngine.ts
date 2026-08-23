// engine/ProgramGraduationEngine.ts

import { ProgramEvaluation } from "../models/ProgramEvaluation";
import { ProgramGraduationResult } from "../models/ProgramGraduation";
import { Program } from "../models/Program";
import { programs } from "../data/programs";

export function evaluateProgramGraduation(
  evaluations: ProgramEvaluation[],
  program: Program,
): ProgramGraduationResult {
  // -----------------------------------
  // NO EVALUATIONS
  // -----------------------------------

  if (!evaluations.length) {
    return {
      graduate: false,

      recommendation: "repeat",

      confidence: 0,

      reasons: [
        "No evaluations available",
      ],
    };
  }

  // -----------------------------------
  // SORT BY PROGRAM WEEK
  // -----------------------------------

  const sortedEvaluations =
    [...evaluations].sort(
      (a, b) =>
        a.weekIndex -
        b.weekIndex,
    );

  const latestEvaluation =
    sortedEvaluations[
      sortedEvaluations.length - 1
    ];

  // -----------------------------------
  // FINAL PROGRAM WEEK
  // -----------------------------------

  const finalWeekIndex =
    program.weeks - 1;

  const programComplete =
    latestEvaluation.weekIndex >=
    finalWeekIndex;

  // -----------------------------------
  // PROGRAM NOT COMPLETE
  // -----------------------------------
  //
  // Readiness may be evaluated each week,
  // but graduation can only happen after
  // the configured final program week.
  // -----------------------------------

  if (!programComplete) {
    return {
      graduate: false,

      recommendation: "repeat",

      confidence: 1,

      reasons: [
        `Program still in progress (${latestEvaluation.weekNumber}/${program.weeks} weeks completed)`,
      ],
    };
  }

  // -----------------------------------
  // FINAL READINESS DECISION
  // -----------------------------------
  //
  // ProgramReadinessEngine has already considered:
  //
  // - historical MB evidence
  // - MB success rate
  // - comparison weeks
  // - completion
  // - difficulty
  // - pain
  // - form
  // - fatigue
  //
  // Graduation therefore consumes the readiness
  // decision rather than recalculating it.
  // -----------------------------------

  const finalReadiness =
    latestEvaluation.readinessReport;

  // -----------------------------------
  // ADVANCE
  // -----------------------------------

  if (
    finalReadiness.recommendation ===
      "advance" &&
    finalReadiness.progressionCandidate &&
    !finalReadiness.progressionBlocked &&
    !finalReadiness.deloadCandidate
  ) {
    return {
      graduate: true,

      recommendation: "advance",

      nextProgramId:
        getNextProgramId(
          program.id,
        ),

      confidence: 0.95,

      reasons: [
        "Program completed",
        "Progression requirements satisfied",
        ...finalReadiness.reasons,
      ],
    };
  }

  // -----------------------------------
  // DELOAD
  // -----------------------------------

  if (
    finalReadiness.recommendation ===
      "deload" ||
    finalReadiness.deloadCandidate
  ) {
    return {
      graduate: false,

      recommendation: "deload",

      confidence: 0.9,

      reasons: [
        "Program completed but recovery intervention is recommended",
        ...finalReadiness.reasons,
      ],
    };
  }

  // -----------------------------------
  // REPEAT
  // -----------------------------------

  return {
    graduate: false,

    recommendation: "repeat",

    confidence: 0.8,

    reasons: [
      "Program completed but progression requirements are not yet satisfied",
      ...finalReadiness.reasons,
    ],
  };
}

/**
 * -------------------------------------------------------
 * NEXT PROGRAM
 * -------------------------------------------------------
 *
 * Avoid hard-coding IDs such as:
 *
 * level1 → growth-program
 *
 * Instead use the configured program order.
 */
function getNextProgramId(
  currentProgramId: string,
): string | undefined {
  const currentIndex =
    programs.findIndex(
      (program) =>
        program.id ===
        currentProgramId,
    );

  if (
    currentIndex < 0 ||
    currentIndex >=
      programs.length - 1
  ) {
    return undefined;
  }

  return programs[
    currentIndex + 1
  ].id;
}
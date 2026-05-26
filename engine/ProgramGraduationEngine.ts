// engine/ProgramGraduationEngine.ts

import { ProgramEvaluation } from "../models/ProgramEvaluation";
import { ProgramGraduationResult } from "../models/ProgramGraduation";

export function evaluateProgramGraduation(
  evaluations: ProgramEvaluation[],
): ProgramGraduationResult {
  // -----------------------------------
  // NO EVALUATIONS
  // -----------------------------------

  if (!evaluations.length) {
    return {
      graduate: false,

      recommendation: "repeat",

      confidence: 0,

      reasons: ["No evaluations available"],
    };
  }

  // -----------------------------------
  // RECENT EVALUATIONS
  // -----------------------------------

  const recent = evaluations.slice(-3);

  const advanceCount = recent.filter(
    (e) =>
      e.readinessReport.recommendation ===
      "advance",
  ).length;

  const repeatCount = recent.filter(
    (e) =>
      e.readinessReport.recommendation ===
      "repeat",
  ).length;

  const deloadCount = recent.filter(
    (e) =>
      e.readinessReport.recommendation ===
      "deload",
  ).length;

  // -----------------------------------
  // AVERAGE READINESS
  // -----------------------------------

  const avgReadiness =
    recent.reduce(
      (acc, e) =>
        acc +
        e.readinessReport.readinessScore,
      0,
    ) / recent.length;

  // -----------------------------------
  // FATIGUE STABILITY
  // -----------------------------------

  const avgFatigueStability =
    recent.reduce(
      (acc, e) =>
        acc +
        e.readinessReport.fatigueStability,
      0,
    ) / recent.length;

  // -----------------------------------
  // PAIN
  // -----------------------------------

  const avgPain =
    recent.reduce(
      (acc, e) =>
        acc +
        e.readinessReport.painScore,
      0,
    ) / recent.length;

  // -----------------------------------
  // ADVANCEMENT LOGIC
  // -----------------------------------

  const sustainedReadiness =
    advanceCount >= 2 &&
    avgReadiness >= 80 &&
    avgFatigueStability >= 0.75 &&
    avgPain <= 2;

  // -----------------------------------
  // DELOAD LOGIC
  // -----------------------------------

  const needsDeload =
    deloadCount >= 2 ||
    avgReadiness < 50 ||
    avgPain >= 4;

  // -----------------------------------
  // ADVANCE
  // -----------------------------------

  if (sustainedReadiness) {
    return {
      graduate: true,

      recommendation: "advance",

      nextProgramId: getNextProgram(
        evaluations[0].programId,
      ),

      confidence: 0.95,

      reasons: [
        "Sustained readiness achieved",
        "Fatigue stable",
        "Recovery indicators strong",
        "Low pain accumulation",
      ],
    };
  }

  // -----------------------------------
  // DELOAD
  // -----------------------------------

  if (needsDeload) {
    return {
      graduate: false,

      recommendation: "deload",

      confidence: 0.9,

      reasons: [
        "Recovery instability detected",
        "High fatigue accumulation",
        "Pain trend elevated",
      ],
    };
  }

  // -----------------------------------
  // REPEAT
  // -----------------------------------

  return {
    graduate: false,

    recommendation: "repeat",

    confidence: 0.7,

    reasons: [
      "Adaptation still developing",
      "Additional exposure recommended",
    ],
  };
}

function getNextProgram(
  id: string,
): string | undefined {
  switch (id) {
    case "beginner-program":
      return "growth-program";

    case "growth-program":
      return "max-hypertrophy-program";

    default:
      return undefined;
  }
}
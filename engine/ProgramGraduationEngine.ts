import { Program } from "../models/Program";

export function shouldGraduateProgram(
  currentProgram: Program,
  consistencyScore: number,
  masteryScore: number,
  completedWeeks: number,
) {
  const ready =
    completedWeeks >= currentProgram.weeks &&
    consistencyScore >= 0.8 &&
    masteryScore >= 75;

  return {
    graduate: ready,

    nextProgramId: ready
      ? getNextProgram(currentProgram.id)
      : undefined,
  };
}

function getNextProgram(id: string) {
  switch (id) {
    case "beginner-program":
      return "growth-program";

    case "growth-program":
      return "max-hypertrophy-program";

    default:
      return undefined;
  }
}
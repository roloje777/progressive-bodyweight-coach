export interface ExerciseGraduationState {
  exerciseId: string;

  currentNodeId: string;

  successfulSessions: number;

  failedSessions: number;

  plateauCount: number;

  deloadCount: number;

  lastGraduationDate?: string;

  lastRegressionDate?: string;

  masteryScore: number;

  consistencyScore: number;

  skillTier: number;
}
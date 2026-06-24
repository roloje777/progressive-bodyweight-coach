//ExercisePerformanceProfile.ts
export interface ExercisePerformanceProfile {
  exerciseId: string;

  calibrated: boolean;

  baseline: {
    avgReps?: number;
    bestReps?: number;
    lowestReps?: number;

    avgHold?: number;
    bestHold?: number;
    lowestHold?: number;
  };

  recommendedRange: {
    min: number;
    max: number;
  };

  progressionMetrics: {
    consistencyScore: number;
    fatigueDropoff: number;
    completionRate: number;
  };

  readinessScore: number;

  // -----------------------------
  // 🆕 BLOCK TRACKING
  // -----------------------------

  currentBlockWeek: number;

  weeksAtCurrentLevel: number;

  graduationEligible: boolean;

  // -----------------------------
  // 🆕 TREND DATA
  // -----------------------------

  trend: {
    avgHistory: number[];
    readinessHistory: number[];
  };

  updatedAt: string;
}
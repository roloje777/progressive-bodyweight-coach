import {
  buildConsistencyAnalytics,
  buildExerciseAnalytics,
  buildMatchOrBeatAnalytics,
  buildProgressOverviewAnalytics,
  buildRecoveryAnalytics,
  buildTrainingLoadAnalytics,
} from "@/engine/analytics";
import { ProgramEvaluation } from "@/models/ProgramEvaluation";
import { CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Analytics Phase 1B assertion failed: ${message}`);
}

function session(args: {
  at: string;
  week: number;
  day: number;
  values: number[];
  rating?: number;
  tags?: string[];
  mode?: CompletedSession["trainingMode"];
  excludedSetIndexes?: number[];
}): CompletedSession {
  return {
    programId: "foundation",
    dayId: `day-${args.day}`,
    weekIndex: args.week,
    dayIndex: args.day,
    completedAt: args.at,
    startWorkoutTime: 0,
    endWorkoutTime: 1000,
    workoutDuration: 600,
    timeUnderTension: args.values.reduce((sum, value) => sum + value, 0),
    trainingMode: args.mode ?? "normal",
    feedback:
      args.rating != null
        ? { rating: args.rating, tags: args.tags ?? ["good-pump"] }
        : undefined,
    exercises: [
      {
        exerciseId: "standard-push-ups",
        sets: args.values.map((value, index) => ({
          setNumber: index + 1,
          status: ItemStatus.Completed,
          repsCompleted: value,
          excludeFromProgression: args.excludedSetIndexes?.includes(index),
        })),
      },
    ],
  };
}

function evaluation(week: number, createdAt: string, readinessScore: number): ProgramEvaluation {
  return {
    programId: "foundation",
    weekIndex: week,
    weekNumber: week + 1,
    createdAt,
    readinessReport: {
      readinessScore,
      mbSuccessRate: 1,
      completionRate: 1,
      fatigueOccurrences: 0,
      painOccurrences: 0,
      formBreakdownOccurrences: 0,
      averageDifficulty: 4,
      progressionBlocked: false,
      progressionCandidate: readinessScore >= 100,
      deloadCandidate: false,
      deloadReason: null,
      recommendation: readinessScore >= 100 ? "advance" : "repeat",
      reasons: [],
    },
  };
}

export function runAnalyticsPhase1BAssertions(): void {
  const history: CompletedSession[] = [
    session({ at: "2026-01-01T10:00:00Z", week: 0, day: 0, values: [8, 8, 8], rating: 4 }),
    session({ at: "2026-01-08T10:00:00Z", week: 1, day: 0, values: [9, 9, 9], rating: 4 }),
    session({ at: "2026-01-15T10:00:00Z", week: 2, day: 0, values: [10, 10, 10], rating: 4 }),
    session({ at: "2026-01-22T10:00:00Z", week: 3, day: 0, values: [12, 12, 12], rating: 5 }),
  ];

  const exercise = buildExerciseAnalytics({
    exerciseId: "standard-push-ups",
    completedSessions: history,
  });
  assert(exercise.sessionsPerformed === 4, "exercise sessions should be counted");
  assert(exercise.bestPerformance === 12, "exercise best should be 12 reps");
  assert(exercise.trend === "improving", "exercise best-set trend should improve");
  assert(exercise.averageSetDropoffPercent != null, "set drop-off should be calculated");

  const mb = buildMatchOrBeatAnalytics({ completedSessions: history });
  assert(mb.eligibleTargets > 0, "MB should find eligible targets");
  assert(mb.successRate === 100, "improving history should have 100% MB success");

  const noEligible = buildMatchOrBeatAnalytics({
    completedSessions: [
      session({
        at: "2026-01-01T10:00:00Z",
        week: 0,
        day: 0,
        values: [8],
        rating: 1,
        tags: ["low-energy"],
      }),
    ],
  });
  assert(noEligible.successRate === null, "no eligible MB attempts must return null, not 0%");

  const excludedHistory = [
    session({ at: "2026-02-01T10:00:00Z", week: 0, day: 0, values: [10, 10], rating: 4 }),
    session({
      at: "2026-02-08T10:00:00Z",
      week: 1,
      day: 0,
      values: [1, 10],
      rating: 4,
      excludedSetIndexes: [0],
    }),
  ];
  const excludedMb = buildMatchOrBeatAnalytics({ completedSessions: excludedHistory });
  assert(excludedMb.missed === 0, "progression-excluded sets must not create MB misses");
  assert(excludedMb.excluded > 0, "progression-excluded targets should be visible as excluded evidence");

  const recovery = buildRecoveryAnalytics({
    completedSessions: [
      session({ at: "2026-03-01T10:00:00Z", week: 0, day: 0, values: [8], rating: 2, tags: ["low-energy"] }),
      session({ at: "2026-03-08T10:00:00Z", week: 1, day: 0, values: [8], rating: 2, tags: ["form-breakdown"] }),
      session({ at: "2026-03-15T10:00:00Z", week: 2, day: 0, values: [9], rating: 4, tags: ["good-pump"], mode: "deload-fatigue" }),
      session({ at: "2026-03-22T10:00:00Z", week: 3, day: 0, values: [10], rating: 4, tags: ["great-focus"], mode: "verification" }),
    ],
  });
  assert(recovery.lowEnergyOccurrences === 1, "low-energy occurrence should be counted");
  assert(recovery.formBreakdownOccurrences === 1, "form-breakdown occurrence should be counted");
  assert(recovery.deloadWorkoutCount === 1, "deload workout should be counted");
  assert(recovery.verificationWorkoutCount === 1, "verification workout should be counted");
  assert(recovery.trend === "improving", "falling recovery burden should be improving");

  const load = buildTrainingLoadAnalytics({ completedSessions: history });
  assert(load.workoutsCompleted === 4, "training load should count workouts");
  assert(load.workingSetsCompleted === 12, "training load should count completed working sets");
  assert(load.totalRepsCompleted === 117, "training load should sum reps");

  const holdHistory: CompletedSession[] = [
    {
      ...session({ at: "2026-03-25T10:00:00Z", week: 4, day: 0, values: [8], rating: 4 }),
      exercises: [
        {
          exerciseId: "plank",
          sets: [
            { setNumber: 1, status: ItemStatus.Completed, durationSeconds: 30 },
            { setNumber: 2, status: ItemStatus.Completed, durationSeconds: 35 },
          ],
        },
      ],
    },
  ];
  const holdLoad = buildTrainingLoadAnalytics({ completedSessions: holdHistory });
  assert(holdLoad.totalHoldSeconds === 65, "training load should sum hold duration");

  const adherenceSessions: CompletedSession[] = [
    session({ at: "2026-04-01T10:00:00Z", week: 0, day: 0, values: [8], rating: 4 }),
    session({ at: "2026-04-02T10:00:00Z", week: 0, day: 1, values: [8], rating: 4 }),
    session({ at: "2026-04-03T10:00:00Z", week: 0, day: 2, values: [8], rating: 4 }),
    session({ at: "2026-04-04T10:00:00Z", week: 0, day: 3, values: [8], rating: 4 }),
    session({ at: "2026-04-08T10:00:00Z", week: 1, day: 0, values: [8], rating: 4 }),
    session({ at: "2026-04-09T10:00:00Z", week: 1, day: 1, values: [8], rating: 4 }),
    session({ at: "2026-04-10T10:00:00Z", week: 1, day: 2, values: [8], rating: 4 }),
  ];
  const evaluations = [
    evaluation(0, "2026-04-05T10:00:00Z", 50),
    evaluation(1, "2026-04-12T10:00:00Z", 60),
  ];
  const consistency = buildConsistencyAnalytics({
    completedSessions: adherenceSessions,
    programEvaluations: evaluations,
    expectedWorkoutsPerWeekByProgramId: { foundation: 4 },
  });
  assert(consistency.scheduledWorkouts === 8, "two closed four-workout weeks should schedule 8 workouts");
  assert(consistency.completedScheduledWorkouts === 7, "7 unique scheduled workouts should be counted");
  assert(consistency.adherenceRate === 87.5, "adherence should be 87.5%");

  const readinessEvaluations = [
    evaluation(0, "2026-05-01T10:00:00Z", 25),
    evaluation(1, "2026-05-08T10:00:00Z", 50),
    evaluation(2, "2026-05-15T10:00:00Z", 60),
    evaluation(3, "2026-05-22T10:00:00Z", 100),
  ];
  const overview = buildProgressOverviewAnalytics({
    completedSessions: history,
    programEvaluations: readinessEvaluations,
    expectedWorkoutsPerWeekByProgramId: { foundation: 4 },
    currentProgramId: "foundation",
    currentWeekIndex: 4,
  });
  assert(overview.readiness.current === 100, "overview should expose latest readiness");
  assert(overview.readiness.trend === "improving", "readiness trend should improve");

  const oneSessionExercise = buildExerciseAnalytics({
    exerciseId: "standard-push-ups",
    completedSessions: [history[0]],
  });
  assert(oneSessionExercise.trend === "insufficient-data", "one exercise session must not claim a trend");
}

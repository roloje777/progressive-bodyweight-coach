import { buildRecoveryAnalytics } from "@/engine/analytics/RecoveryAnalyticsEngine";
import { buildRecoveryDetailAnalytics } from "@/engine/analytics/RecoveryDetailAnalyticsEngine";
import { CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(`Phase 2C assertion failed: ${message}`);
}

function session(args: {
  completedAt: string;
  rating: number;
  tags: string[];
  mode?: CompletedSession["trainingMode"];
}): CompletedSession {
  return {
    programId: "foundation",
    dayId: "day-1",
    weekIndex: 0,
    dayIndex: 0,
    completedAt: args.completedAt,
    startWorkoutTime: Date.parse(args.completedAt) - 1800000,
    endWorkoutTime: Date.parse(args.completedAt),
    workoutDuration: 1800,
    timeUnderTension: 120,
    trainingMode: args.mode ?? "normal",
    feedback: { rating: args.rating, tags: args.tags },
    exercises: [
      {
        exerciseId: "push-ups",
        sets: [{ setNumber: 1, status: ItemStatus.Completed, repsCompleted: 8 }],
      },
    ],
  };
}

export function runPhase2CAssertions() {
  const history: CompletedSession[] = [
    session({ completedAt: "2026-08-01T10:00:00.000Z", rating: 2, tags: ["low-energy", "form-breakdown"] }),
    session({ completedAt: "2026-08-08T10:00:00.000Z", rating: 2, tags: ["joint-discomfort"] }),
    session({ completedAt: "2026-08-15T10:00:00.000Z", rating: 3, tags: ["couldnt-finish"], mode: "deload-fatigue" }),
    session({ completedAt: "2026-08-22T10:00:00.000Z", rating: 4, tags: ["good-pump"], mode: "deload-recovery" }),
    session({ completedAt: "2026-08-29T10:00:00.000Z", rating: 4, tags: ["great-focus"], mode: "verification" }),
    session({ completedAt: "2026-09-05T10:00:00.000Z", rating: 5, tags: ["could-do-more"] }),
  ];

  const result = buildRecoveryDetailAnalytics({
    completedSessions: history,
    range: "all",
    now: new Date("2026-09-10T12:00:00.000Z"),
  });

  expect(result.workoutsConsidered === 6, "all workouts should be considered");
  expect(result.painOccurrences === 1, "pain should be counted");
  expect(result.lowEnergyOccurrences === 1, "low energy should be counted");
  expect(result.formBreakdownOccurrences === 1, "form breakdown should be counted");
  expect(result.couldntFinishOccurrences === 1, "couldn't-finish should be counted");
  expect(result.totalSignalOccurrences === 4, "all negative feedback signals should contribute to burden");
  expect(result.deloadWorkoutCount === 2, "all deload workout modes should be counted");
  expect(result.verificationWorkoutCount === 1, "verification should be counted");
  expect(result.ratingTrend === "improving", "rising workout ratings should be improving");
  expect(result.recoveryTrend === "improving", "falling signal burden should be improving");
  expect(result.weekly.length === 6, "weekly history should retain each test week");
  expect(result.recentWorkouts[0]?.rating === 5, "recent workouts should be newest first");
  expect(result.modes.some((item) => item.mode === "verification" && item.count === 1), "mode breakdown should expose verification");

  const overview = buildRecoveryAnalytics({
    completedSessions: history,
    range: "all",
    now: new Date("2026-09-10T12:00:00.000Z"),
  });
  expect(overview.painOccurrences === result.painOccurrences, "overview and detail pain counts should agree");
  expect(overview.lowEnergyOccurrences === result.lowEnergyOccurrences, "overview and detail low-energy counts should agree");
  expect(overview.formBreakdownOccurrences === result.formBreakdownOccurrences, "overview and detail form counts should agree");
  expect(overview.deloadWorkoutCount === result.deloadWorkoutCount, "overview and detail deload counts should agree");
  expect(overview.trend === result.recoveryTrend, "overview and detail recovery trend should agree");

  const empty = buildRecoveryDetailAnalytics({
    completedSessions: [],
    range: "all",
    now: new Date("2026-09-10T12:00:00.000Z"),
  });
  expect(empty.averageWorkoutRating === null, "empty history should not produce a fake rating");
  expect(empty.recoveryTrend === "insufficient-data", "empty history should not produce a recovery trend");

  return true;
}

import { buildMatchOrBeatDetailAnalytics } from "@/engine/analytics/MatchOrBeatDetailAnalyticsEngine";
import { buildMatchOrBeatAnalytics } from "@/engine/analytics/MatchOrBeatAnalyticsEngine";
import { CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(`Phase 2B assertion failed: ${message}`);
}

function session(args: {
  completedAt: string;
  weekIndex: number;
  values: number[];
  rating?: number;
  tags?: string[];
  excludedSet?: number;
}): CompletedSession {
  return {
    programId: "foundation",
    dayId: "day-1",
    weekIndex: args.weekIndex,
    dayIndex: 0,
    completedAt: args.completedAt,
    startWorkoutTime: new Date(args.completedAt).getTime() - 1800000,
    endWorkoutTime: new Date(args.completedAt).getTime(),
    workoutDuration: 1800,
    timeUnderTension: 120,
    feedback: { rating: args.rating ?? 4, tags: args.tags ?? [] },
    exercises: [
      {
        exerciseId: "push-ups",
        sets: args.values.map((value, index) => ({
          setNumber: index + 1,
          status: ItemStatus.Completed,
          repsCompleted: value,
          excludeFromProgression: args.excludedSet === index + 1,
        })),
      },
    ],
  };
}

export function runPhase2BAssertions() {
  const history: CompletedSession[] = [
    session({ completedAt: "2026-08-01T10:00:00.000Z", weekIndex: 0, values: [8, 7, 6] }),
    session({ completedAt: "2026-08-08T10:00:00.000Z", weekIndex: 1, values: [9, 7, 5] }),
    session({ completedAt: "2026-08-15T10:00:00.000Z", weekIndex: 2, values: [10, 8, 7], excludedSet: 2 }),
    session({ completedAt: "2026-08-22T10:00:00.000Z", weekIndex: 3, values: [11, 9, 8], tags: ["low-energy"] }),
  ];

  const result = buildMatchOrBeatDetailAnalytics({
    completedSessions: history,
    range: "all",
    now: new Date("2026-09-01T12:00:00.000Z"),
  });

  expect(result.eligibleTargets > 0, "eligible targets should be counted");
  expect(result.successfulTargets === result.exceeded + result.matched, "successful total should equal exceeded + matched");
  expect(result.excluded > 0, "excluded evidence should be visible");
  expect(result.exclusions.some((item) => item.reason === "excluded-set"), "set-level exclusions should be classified");
  expect(result.exclusions.some((item) => item.reason === "low-energy"), "workout-level exclusions should be classified");
  expect(result.exercises.some((item) => item.exerciseId === "push-ups"), "per-exercise evidence should be available");
  expect(result.recentEvidence.some((item) => item.status === "excluded"), "recent evidence should retain excluded entries");

  const overview = buildMatchOrBeatAnalytics({
    completedSessions: history,
    range: "all",
    now: new Date("2026-09-01T12:00:00.000Z"),
  });
  expect(overview.excluded === result.excluded, "overview and detail exclusion counts should agree");
  expect(overview.successRate === result.successRate, "overview and detail success rates should agree");

  return true;
}

import { buildExerciseDetailAnalytics } from "@/engine/analytics";
import { CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Analytics Phase 2A assertion failed: ${message}`);
}

function session(at: string, weekIndex: number, values: number[], effortRating: 1 | 2 | 3): CompletedSession {
  return {
    programId: "foundation",
    dayId: "day-1",
    weekIndex,
    dayIndex: 0,
    completedAt: at,
    startWorkoutTime: Date.parse(at),
    endWorkoutTime: Date.parse(at) + 1_800_000,
    workoutDuration: 1800,
    timeUnderTension: 100,
    trainingMode: "normal",
    feedback: { rating: 4, tags: ["good-pump"] },
    exercises: [
      {
        exerciseId: "standard-push-ups",
        effortRating,
        sets: values.map((value, index) => ({
          setNumber: index + 1,
          status: ItemStatus.Completed,
          repsCompleted: value,
        })),
      },
    ],
  };
}

export function runAnalyticsPhase2AAssertions(): void {
  const history = [
    session("2026-06-01T10:00:00Z", 0, [8, 7, 6], 3),
    session("2026-06-08T10:00:00Z", 1, [9, 8, 7], 3),
    session("2026-06-15T10:00:00Z", 2, [10, 9, 8], 2),
    session("2026-06-22T10:00:00Z", 3, [12, 11, 10], 1),
  ];

  const detail = buildExerciseDetailAnalytics({
    exerciseId: "standard-push-ups",
    completedSessions: history,
    range: "all",
    now: new Date("2026-06-30T10:00:00Z"),
  });

  assert(detail.sessionsPerformed === 4, "sessions should be counted");
  assert(detail.bestPerformance === 12, "best performance should be 12 reps");
  assert(detail.performanceTrend === "improving", "performance should be improving");
  assert(detail.personalBestCount === 4, "each improving session should establish a new best");
  assert(detail.personalBests[detail.personalBests.length - 1]?.value === 12, "latest personal best should be 12");
  assert(detail.sessionsPerWeek != null && detail.sessionsPerWeek > 1, "frequency should be calculated");
  assert(detail.averageSetDropoffPercent != null && detail.averageSetDropoffPercent > 0, "set drop-off should be calculated");
  assert(detail.averageEffortRating === 2.3, "average effort should be calculated from exercise ratings");
  assert(detail.effortTrend === "improving", "falling effort should be interpreted as improving");
  assert(detail.matchOrBeat.attempted > 0, "exercise Match-or-Beat attempts should be available");
  assert(detail.matchOrBeat.successRate === 100, "improving exercise should succeed against Match-or-Beat targets");
}

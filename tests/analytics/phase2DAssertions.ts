import { buildTrainingLoadDetailAnalytics } from "@/engine/analytics/TrainingLoadDetailAnalyticsEngine";
import { CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";
import { formatAnalyticsDuration } from "@/utils/analyticsFormatting";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 2D assertion failed: ${message}`);
}

function session(args: {
  completedAt: string;
  exerciseId: string;
  values: number[];
  hold?: boolean;
  timeUnderTension?: number;
}): CompletedSession {
  const completedAtMs = Date.parse(args.completedAt);
  return {
    programId: "foundation",
    dayId: "day-1",
    weekIndex: 0,
    dayIndex: 0,
    completedAt: args.completedAt,
    startWorkoutTime: completedAtMs - 1800000,
    endWorkoutTime: completedAtMs,
    workoutDuration: 1800,
    timeUnderTension: args.timeUnderTension ?? 120,
    exercises: [
      {
        exerciseId: args.exerciseId,
        sets: args.values.map((value, index) => ({
          setNumber: index + 1,
          status: ItemStatus.Completed,
          ...(args.hold ? { durationSeconds: value } : { repsCompleted: value }),
        })),
      },
    ],
  } as CompletedSession;
}

export function runPhase2DAssertions() {
  const completedSessions = [
    session({ completedAt: "2026-09-01T10:00:00.000Z", exerciseId: "standard-push-ups", values: [10, 9, 8], timeUnderTension: 150 }),
    session({ completedAt: "2026-09-08T10:00:00.000Z", exerciseId: "inverted-rows-bent-knees", values: [8, 8, 7], timeUnderTension: 160 }),
    session({ completedAt: "2026-09-09T10:00:00.000Z", exerciseId: "hollow-body-hold", values: [30, 30, 25], hold: true, timeUnderTension: 100 }),
  ];

  const analytics = buildTrainingLoadDetailAnalytics({
    completedSessions,
    range: "all",
    now: new Date("2026-09-14T12:00:00.000Z"),
  });

  assert(analytics.workoutsCompleted === 3, "workout total should be derived from sessions");
  assert(analytics.workingSetsCompleted === 9, "all nine completed sets should count");
  assert(analytics.totalRepsCompleted === 50, "rep load should total completed rep values");
  assert(analytics.totalHoldSeconds === 85, "hold load should total completed hold seconds");
  assert(analytics.weekly.length === 2, "sessions should bucket into two Monday-based weeks");
  assert(analytics.bodyParts.some((item) => item.bodyPart === "Chest" && item.setExposures === 3), "push-up sets should expose chest");
  assert(analytics.bodyParts.some((item) => item.bodyPart === "Back" && item.setExposures === 3), "row sets should expose back");
  assert(analytics.bodyParts.some((item) => item.bodyPart === "Core" && item.setExposures === 3), "hollow holds should expose core");

  const chest = analytics.bodyParts.find((item) => item.bodyPart === "Chest");
  assert(chest?.exerciseCount === 1, "chest should report one contributing exercise");
  assert(chest?.exercises[0]?.exerciseId === "standard-push-ups", "chest detail should identify the contributing exercise");
  assert(chest?.exercises[0]?.setExposures === 3, "chest exercise detail should preserve set exposure count");
  assert(chest?.exercises[0]?.sessions === 1, "chest exercise detail should preserve session count");
  assert(chest?.exercises[0]?.sharePercent === 100, "single contributing exercise should represent 100% of that body-part exposure");

  assert(formatAnalyticsDuration(45) === "45s", "sub-minute duration should stay in seconds");
  assert(formatAnalyticsDuration(2040) === "34m 0s", "overview/detail formatter should render 2040 seconds consistently");
  assert(formatAnalyticsDuration(3912) === "1h 5m 12s", "hour-scale duration should remain human readable");
  assert(analytics.unmappedWorkingSets === 0, "known registry exercises should be mapped");

  const empty = buildTrainingLoadDetailAnalytics({ completedSessions: [], range: "all" });
  assert(empty.averageSetsPerWorkout == null, "fresh history must not invent an average");
  assert(empty.bodyParts.length === 0, "fresh history must not invent body-part exposure");

  return true;
}

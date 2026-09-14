import { buildCoachAnalytics, CoachAnalyticsInput } from "@/engine/analytics/CoachAnalyticsEngine";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function base(overrides: Partial<CoachAnalyticsInput> = {}): CoachAnalyticsInput {
  return {
    overview: {
      workoutsCompleted: 8,
      averageWorkoutRating: 4.2,
      matchOrBeatSuccessRate: 80,
      adherenceRate: 100,
      readiness: { current: 60, trend: "improving" },
    },
    matchOrBeat: { eligibleTargets: 20, successRate: 80, trend: "improving" },
    recovery: {
      workoutsConsidered: 8,
      averageWorkoutRating: 4.2,
      painOccurrences: 0,
      lowEnergyOccurrences: 0,
      formBreakdownOccurrences: 0,
      couldntFinishOccurrences: 0,
      deloadWorkoutCount: 0,
      verificationWorkoutCount: 0,
      trend: "stable",
    },
    consistency: {
      scheduledWorkouts: 8,
      completedScheduledWorkouts: 8,
      adherenceRate: 100,
      completedWorkoutCount: 8,
    },
    trainingLoad: {
      workoutsCompleted: 8,
      workingSetsCompleted: 64,
      totalRepsCompleted: 520,
      totalHoldSeconds: 360,
      totalTimeUnderTensionSeconds: 1800,
    },
    exercises: [
      { sessionsPerformed: 6, trend: "improving" },
      { sessionsPerformed: 5, trend: "stable" },
    ],
    ...overrides,
  };
}

export function runPhase2EAssertions() {
  const sustainable = buildCoachAnalytics(base());
  assert(sustainable.state === "sustainable-progress", "Expected sustainable progress interpretation");

  const ready = buildCoachAnalytics(base({
    overview: {
      ...base().overview,
      readiness: { current: 100, trend: "improving" },
    },
  }));
  assert(ready.state === "graduation-ready", "Expected graduation-ready interpretation");

  const strainBase = base();
  const strain = buildCoachAnalytics(base({
    recovery: {
      ...strainBase.recovery,
      lowEnergyOccurrences: 2,
      formBreakdownOccurrences: 1,
      trend: "declining",
    },
  }));
  assert(strain.state === "progress-with-recovery-strain", "Expected progress-with-recovery-strain interpretation");

  const recoveryBase = base();
  const recoveryPriority = buildCoachAnalytics(base({
    matchOrBeat: { ...recoveryBase.matchOrBeat, successRate: 52, trend: "declining" },
    recovery: {
      ...recoveryBase.recovery,
      painOccurrences: 1,
      lowEnergyOccurrences: 2,
      trend: "declining",
    },
  }));
  assert(recoveryPriority.state === "recovery-priority", "Expected recovery-priority interpretation");

  const consistencyBase = base();
  const consistency = buildCoachAnalytics(base({
    consistency: { ...consistencyBase.consistency, adherenceRate: 50 },
    overview: { ...consistencyBase.overview, adherenceRate: 50 },
    matchOrBeat: { ...consistencyBase.matchOrBeat, trend: "stable" },
  }));
  assert(consistency.state === "consistency-priority", "Expected consistency-priority interpretation");

  const plateauBase = base();
  const plateau = buildCoachAnalytics(base({
    matchOrBeat: { ...plateauBase.matchOrBeat, trend: "declining" },
    recovery: { ...plateauBase.recovery, trend: "stable" },
  }));
  assert(plateau.state === "performance-plateau", "Expected performance plateau interpretation");

  const empty = buildCoachAnalytics({
    overview: {
      workoutsCompleted: 0,
      averageWorkoutRating: null,
      matchOrBeatSuccessRate: null,
      adherenceRate: null,
      readiness: { current: null, trend: "insufficient-data" },
    },
    matchOrBeat: { eligibleTargets: 0, successRate: null, trend: "insufficient-data" },
    recovery: {
      workoutsConsidered: 0,
      averageWorkoutRating: null,
      painOccurrences: 0,
      lowEnergyOccurrences: 0,
      formBreakdownOccurrences: 0,
      couldntFinishOccurrences: 0,
      deloadWorkoutCount: 0,
      verificationWorkoutCount: 0,
      trend: "insufficient-data",
    },
    consistency: {
      scheduledWorkouts: null,
      completedScheduledWorkouts: 0,
      adherenceRate: null,
      completedWorkoutCount: 0,
    },
    trainingLoad: {
      workoutsCompleted: 0,
      workingSetsCompleted: 0,
      totalRepsCompleted: 0,
      totalHoldSeconds: 0,
      totalTimeUnderTensionSeconds: 0,
    },
    exercises: [],
  });
  assert(empty.state === "building-evidence", "Expected building-evidence interpretation");

  assert(sustainable.evidence.length === 6, "Expected six evidence areas");
  assert(sustainable.evidence.some((item) => item.source === "recovery"), "Expected recovery evidence");
  assert(sustainable.evidence.some((item) => item.source === "training-load"), "Expected training-load evidence");

  return true;
}

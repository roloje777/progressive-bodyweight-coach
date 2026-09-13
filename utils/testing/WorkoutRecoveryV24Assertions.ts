import {
  migrateRecoveryV1Snapshot,
  validateRecoveryV2Snapshot,
} from "@/storage/activeWorkoutStorage";
import { buildRecoveryHistorySummary } from "@/utils/workoutRecoveryHistory";
import { ItemStatus } from "@/models/WorkoutStatus";

export type V24AssertionResult = {
  name: string;
  passed: boolean;
  detail: string;
};

function assert(name: string, condition: boolean, detail: string): V24AssertionResult {
  return { name, passed: condition, detail };
}

function baseSession() {
  return {
    programId: "level-1",
    weekIndex: 0,
    dayIndex: 0,
    blocks: [
      {
        id: "day-1",
        type: "main",
        title: "Main Workout",
        exercises: [{ exerciseId: "push-ups", sets: 3 }],
      },
    ],
    results: {},
  } as any;
}

function v2Snapshot() {
  const now = Date.now();
  return {
    version: 2,
    schemaVersion: 2,
    sessionId: "level-1:0:0:test",
    createdAt: now - 5000,
    updatedAt: now,
    lastCheckpointAt: now,
    programId: "level-1",
    weekIndex: 0,
    dayIndex: 0,
    startWorkoutTime: now - 5000,
    screen: "workout",
    blockIndex: 0,
    session: baseSession(),
    screenState: {
      engineState: { currentExerciseIndex: 0, workoutLog: null },
    },
    accumulatedActiveDurationMs: 5000,
    activeTimingSegment: null,
    blockActiveDurationMs: { "day-1": 5000 },
    activeBlockId: "day-1",
    runtimeId: "test-runtime",
    lastAppState: "active",
  } as any;
}

export function runWorkoutRecoveryV24Assertions(): V24AssertionResult[] {
  const validV2 = validateRecoveryV2Snapshot(v2Snapshot());

  const legacy = v2Snapshot() as any;
  legacy.version = 1;
  delete legacy.schemaVersion;
  delete legacy.runtimeId;
  delete legacy.lastAppState;
  delete legacy.updatedAt;

  const migrated = migrateRecoveryV1Snapshot(legacy);

  const preserved = migrated.snapshot;
  const migrationPreserved =
    migrated.status === "ready"
    && migrated.migratedFromVersion === 1
    && preserved?.programId === legacy.programId
    && preserved?.dayIndex === legacy.dayIndex
    && preserved?.screen === legacy.screen
    && preserved?.accumulatedActiveDurationMs === legacy.accumulatedActiveDurationMs;

  const manualExercises: any[] = [
    {
      exerciseId: "push-ups",
      sets: [
        { setNumber: 1, status: ItemStatus.Completed, repsCompleted: 10, entrySource: "live" },
        { setNumber: 2, status: ItemStatus.Completed, repsCompleted: 9, entrySource: "manualRecovery", advisoryConfirmed: true },
        { setNumber: 3, status: ItemStatus.Completed, repsCompleted: 8, entrySource: "manualRecovery", excludeFromProgression: true },
      ],
    },
  ];

  const manualSummary = buildRecoveryHistorySummary({
    exercises: manualExercises,
    recoveryRoute: "manual",
    interruptionKind: "processRestart",
  });
  const resumedSummary = buildRecoveryHistorySummary({
    exercises: [],
    recoveryRoute: "true",
    interruptionKind: "processRestart",
  });
  const normalSummary = buildRecoveryHistorySummary({ exercises: [] });
  const mixedSummary = buildRecoveryHistorySummary({
    exercises: manualExercises,
    recoveryRoute: "true",
    interruptionKind: "processRestart",
  });

  return [
    assert("Valid V2 snapshot", validV2.status === "ready", `status=${validV2.status}`),
    assert("V1 migrates to V2", migrated.status === "ready" && migrated.snapshot?.schemaVersion === 2, `status=${migrated.status}`),
    assert("Migration preserves core workout state", migrationPreserved, JSON.stringify({ programId: preserved?.programId, dayIndex: preserved?.dayIndex, screen: preserved?.screen })),
    assert("Manual provenance counts recovered sets", manualSummary?.manualSetCount === 2, JSON.stringify(manualSummary)),
    assert("Manual provenance counts confirmations", manualSummary?.advisoryConfirmedCount === 1, JSON.stringify(manualSummary)),
    assert("Manual provenance counts progression exclusions", manualSummary?.excludedFromProgressionCount === 1, JSON.stringify(manualSummary)),
    assert("Resume provenance is recorded", resumedSummary?.method === "resumed", JSON.stringify(resumedSummary)),
    assert("Ordinary workout gets no recovery history", normalSummary === undefined, String(normalSummary)),
    assert("Mixed provenance remains distinguishable", mixedSummary?.method === "mixed", JSON.stringify(mixedSummary)),
  ];
}

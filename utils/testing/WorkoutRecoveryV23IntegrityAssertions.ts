import { ActiveWorkoutSnapshot } from "@/models/WorkoutRecovery";
import {
  analyzeRecoverySnapshotIntegrity,
  clearActiveWorkout,
  clearActiveWorkoutIfSession,
  createActiveWorkout,
  loadActiveWorkout,
} from "@/storage/activeWorkoutStorage";
import { ItemStatus, WorkoutStatus } from "@/models/WorkoutStatus";
import { assert } from "@/utils/assert";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeSnapshot(now: number): ActiveWorkoutSnapshot {
  return {
    version: 2,
    schemaVersion: 2,
    sessionId: "v23:test-session",
    createdAt: now - 10 * 60 * 1000,
    updatedAt: now - 5 * 60 * 1000,
    lastCheckpointAt: now - 5 * 60 * 1000,
    programId: "level1",
    weekIndex: 0,
    dayIndex: 0,
    startWorkoutTime: now - 10 * 60 * 1000,
    screen: "workout",
    blockIndex: 0,
    session: {
      dayIndex: 0,
      status: WorkoutStatus.InProgress,
      blocks: [
        {
          id: "main",
          type: "main",
          title: "Day 1",
          status: ItemStatus.Pending,
          exercises: [
            {
              exerciseId: "push-ups",
              name: "Push Ups",
              sets: 3,
            },
          ],
        },
      ],
    },
    screenState: {
      started: true,
      phase: "active",
      sets: [{ reps: 10 }],
      timerState: null,
      engineState: {
        currentExerciseIndex: 0,
        workoutLog: {
          programId: "level1",
          dayId: "day1",
          exercises: [],
        },
      },
    },
    accumulatedActiveDurationMs: 5 * 60 * 1000,
    activeTimingSegment: null,
    blockActiveDurationMs: { main: 5 * 60 * 1000 },
    activeBlockId: "main",
    runtimeId: "runtime:test",
    lastAppState: "active",
    lastForegroundedAt: now - 5 * 60 * 1000,
  };
}

export type V23AssertionResult = {
  name: string;
  passed: boolean;
  detail: string;
};

async function runCase(
  name: string,
  fn: () => void | Promise<void>,
): Promise<V23AssertionResult> {
  try {
    await fn();
    return { name, passed: true, detail: "PASSED" };
  } catch (error) {
    return {
      name,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runWorkoutRecoveryV23IntegrityAssertions(): Promise<
  V23AssertionResult[]
> {
  const now = Date.now();
  const results: V23AssertionResult[] = [];

  results.push(
    await runCase("Recent valid snapshot", () => {
      const result = analyzeRecoverySnapshotIntegrity(makeSnapshot(now), now);
      assert(!result.issue, `Unexpected issue: ${result.issue}`);
      assert(result.integrity.age === "recent", "Expected recent age classification");
      assert(
        result.integrity.context.exerciseId === "push-ups",
        "Expected current exercise context",
      );
      assert(result.integrity.context.setNumber === 2, "Expected Set 2 context");
    }),
  );

  results.push(
    await runCase("Stale snapshot remains recoverable", () => {
      const snapshot = makeSnapshot(now);
      snapshot.updatedAt = now - 25 * HOUR;
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!result.issue, `Stale snapshot should remain recoverable: ${result.issue}`);
      assert(result.integrity.age === "stale", "Expected stale classification");
      assert(result.integrity.warnings.length > 0, "Expected stale warning");
    }),
  );

  results.push(
    await runCase("Very stale snapshot remains recoverable", () => {
      const snapshot = makeSnapshot(now);
      snapshot.updatedAt = now - 8 * DAY;
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!result.issue, `Very stale snapshot should remain recoverable: ${result.issue}`);
      assert(result.integrity.age === "veryStale", "Expected veryStale classification");
    }),
  );

  results.push(
    await runCase("Wrong day is rejected", () => {
      const snapshot = makeSnapshot(now);
      snapshot.session.dayIndex = 1;
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!!result.issue, "Expected day mismatch to be rejected");
    }),
  );

  results.push(
    await runCase("Screen/block mismatch is rejected", () => {
      const snapshot = makeSnapshot(now);
      snapshot.screen = "dynamicWarmUp";
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!!result.issue, "Expected screen/block mismatch to be rejected");
    }),
  );

  results.push(
    await runCase("Invalid exercise index is rejected", () => {
      const snapshot = makeSnapshot(now);
      if (!snapshot.screenState?.engineState) throw new Error("Fixture missing engine state");
      snapshot.screenState.engineState.currentExerciseIndex = 99;
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!!result.issue, "Expected invalid exercise index to be rejected");
    }),
  );

  results.push(
    await runCase("Wrong program workout log is rejected", () => {
      const snapshot = makeSnapshot(now);
      if (!snapshot.screenState?.engineState?.workoutLog) {
        throw new Error("Fixture missing workout log");
      }
      snapshot.screenState.engineState.workoutLog.programId = "different-program";
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!!result.issue, "Expected program mismatch to be rejected");
    }),
  );

  results.push(
    await runCase("Timer/exercise mismatch is rejected", () => {
      const snapshot = makeSnapshot(now);
      if (!snapshot.screenState) throw new Error("Fixture missing screen state");
      snapshot.screenState.timerState = {
        kind: "rest-set",
        startedAt: now - 10_000,
        durationSeconds: 60,
        exerciseId: "different-exercise",
        setNumber: 2,
      };
      const result = analyzeRecoverySnapshotIntegrity(snapshot, now);
      assert(!!result.issue, "Expected timer/exercise mismatch to be rejected");
    }),
  );

  results.push(
    await runCase("Session-aware cleanup cannot delete a newer/different workout", async () => {
      await clearActiveWorkout();

      const created = await createActiveWorkout({
        programId: "level1",
        weekIndex: 0,
        dayIndex: 0,
        startWorkoutTime: now,
        session: makeSnapshot(now).session,
      });

      const wrongClear = await clearActiveWorkoutIfSession("different-session");
      assert(wrongClear === false, "Wrong session id must not clear active recovery");
      assert(!!(await loadActiveWorkout()), "Snapshot should still exist after rejected clear");

      const correctClear = await clearActiveWorkoutIfSession(created.sessionId);
      assert(correctClear === true, "Expected matching session cleanup to succeed");
      assert((await loadActiveWorkout()) === null, "Snapshot should be removed after matching cleanup");

      const secondClear = await clearActiveWorkoutIfSession(created.sessionId);
      assert(secondClear === false, "Cleanup must be idempotent after snapshot is already gone");
    }),
  );

  await clearActiveWorkout();
  return results;
}

import {
  appendUniqueProgramLifecycleEvent,
  getProgramLifecycleEventDedupKey,
} from "@/engine/analytics/ProgramLifecycleEventEngine";
import { ProgramLifecycleEventInput } from "@/models/analytics/ProgramLifecycleEvent";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Analytics Phase 1A assertion failed: ${message}`);
  }
}

export function runAnalyticsPhase1AAssertions(): void {
  const graduation: ProgramLifecycleEventInput = {
    type: "graduation-earned",
    programId: "foundation",
    nextProgramId: "growth",
    weekIndex: 3,
    occurredAt: "2026-09-01T10:00:00.000Z",
  };

  const first = appendUniqueProgramLifecycleEvent([], graduation);

  assert(first.inserted, "first lifecycle event should be inserted");
  assert(first.events.length === 1, "one event should exist after first insert");
  assert(
    first.event.type === "graduation-earned",
    "stored event should preserve its type",
  );

  const duplicate = appendUniqueProgramLifecycleEvent(first.events, {
    ...graduation,
    occurredAt: "2026-09-01T10:05:00.000Z",
  });

  assert(!duplicate.inserted, "semantic duplicate should be ignored");
  assert(
    duplicate.events.length === 1,
    "duplicate lifecycle transition must not add another milestone",
  );

  const repeatWeek = appendUniqueProgramLifecycleEvent(duplicate.events, {
    type: "repeat-week-started",
    programId: "foundation",
    weekIndex: 4,
    occurredAt: "2026-09-01T10:10:00.000Z",
  });

  assert(repeatWeek.inserted, "different lifecycle transition should be stored");
  assert(repeatWeek.events.length === 2, "repeat week should add a milestone");

  const sameTypeDifferentWeek = appendUniqueProgramLifecycleEvent(
    repeatWeek.events,
    {
      type: "deload-started",
      programId: "foundation",
      weekIndex: 5,
      deloadReason: "fatigue",
      occurredAt: "2026-09-02T10:00:00.000Z",
    },
  );

  const secondDeload = appendUniqueProgramLifecycleEvent(
    sameTypeDifferentWeek.events,
    {
      type: "deload-started",
      programId: "foundation",
      weekIndex: 8,
      deloadReason: "fatigue",
      occurredAt: "2026-10-02T10:00:00.000Z",
    },
  );

  assert(
    secondDeload.events.length === 4,
    "same transition type in a different week should remain historical",
  );

  assert(
    getProgramLifecycleEventDedupKey(graduation) !==
      getProgramLifecycleEventDedupKey({
        ...graduation,
        weekIndex: 4,
      }),
    "week index must participate in lifecycle event identity",
  );

  const outOfOrder = appendUniqueProgramLifecycleEvent(secondDeload.events, {
    type: "program-started",
    programId: "foundation",
    weekIndex: 0,
    occurredAt: "2026-08-01T10:00:00.000Z",
  });

  assert(
    outOfOrder.events[0]?.type === "program-started",
    "events should remain chronologically ordered",
  );
}

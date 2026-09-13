import {
  ProgramLifecycleEvent,
  ProgramLifecycleEventInput,
} from "@/models/analytics/ProgramLifecycleEvent";

function sanitizeIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function createProgramLifecycleEvent(
  input: ProgramLifecycleEventInput,
): ProgramLifecycleEvent {
  const uniquePart = Math.random().toString(36).slice(2, 10);

  return {
    ...input,
    id: [
      "lifecycle",
      sanitizeIdPart(input.type),
      sanitizeIdPart(input.programId),
      Date.parse(input.occurredAt) || Date.now(),
      uniquePart,
    ].join("-"),
  };
}

/**
 * Semantic identity used to make lifecycle writes idempotent.
 * Timestamps are deliberately ignored: retrying the same transition should
 * not create another Journey milestone.
 */
export function getProgramLifecycleEventDedupKey(
  event: ProgramLifecycleEvent | ProgramLifecycleEventInput,
): string {
  return [
    event.type,
    event.programId,
    event.weekIndex ?? "",
    event.nextProgramId ?? "",
    event.deloadReason ?? "",
  ].join("|");
}

export function appendUniqueProgramLifecycleEvent(
  existing: ProgramLifecycleEvent[],
  input: ProgramLifecycleEventInput,
): {
  events: ProgramLifecycleEvent[];
  event: ProgramLifecycleEvent;
  inserted: boolean;
} {
  const key = getProgramLifecycleEventDedupKey(input);
  const duplicate = existing.find(
    (event) => getProgramLifecycleEventDedupKey(event) === key,
  );

  if (duplicate) {
    return {
      events: existing,
      event: duplicate,
      inserted: false,
    };
  }

  const event = createProgramLifecycleEvent(input);
  const events = [...existing, event].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
  );

  return { events, event, inserted: true };
}

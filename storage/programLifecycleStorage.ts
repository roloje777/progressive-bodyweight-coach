import AsyncStorage from "@react-native-async-storage/async-storage";

import { appendUniqueProgramLifecycleEvent } from "@/engine/analytics/ProgramLifecycleEventEngine";
import {
  ProgramLifecycleEvent,
  ProgramLifecycleEventInput,
} from "@/models/analytics/ProgramLifecycleEvent";

const STORAGE_KEY = "program_lifecycle_events_v1";

let writeQueue: Promise<unknown> = Promise.resolve();

function isLifecycleEvent(value: unknown): value is ProgramLifecycleEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ProgramLifecycleEvent>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.programId === "string" &&
    typeof candidate.occurredAt === "string"
  );
}

export async function getProgramLifecycleEvents(): Promise<
  ProgramLifecycleEvent[]
> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isLifecycleEvent)
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  } catch (error) {
    console.error("Failed to load program lifecycle events", error);
    return [];
  }
}

export function recordProgramLifecycleEvent(
  input: ProgramLifecycleEventInput,
): Promise<ProgramLifecycleEvent> {
  const operation = writeQueue.then(async () => {
    const existing = await getProgramLifecycleEvents();
    const result = appendUniqueProgramLifecycleEvent(existing, input);

    if (result.inserted) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result.events));
    }

    return result.event;
  });

  writeQueue = operation.catch(() => undefined);

  return operation;
}

/** DEV/test helper. Keep out of production flows. */
export async function clearProgramLifecycleEvents(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const RECOVERY_DIAGNOSTICS_KEY = "WORKOUT_RECOVERY_DIAGNOSTICS_V1";
const MAX_EVENTS = 100;

export type RecoveryDiagnosticEventName =
  | "snapshot_created"
  | "snapshot_checkpointed"
  | "snapshot_paused"
  | "snapshot_resumed"
  | "process_restart_detected"
  | "snapshot_migrated"
  | "snapshot_invalid"
  | "snapshot_cleared"
  | "snapshot_clear_skipped"
  | "rest_reconstructed"
  | "hold_interrupted";

export type RecoveryDiagnosticEvent = {
  id: string;
  event: RecoveryDiagnosticEventName;
  at: number;
  data?: Record<string, unknown>;
};

function sanitize(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.slice(0, 20).map(sanitize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 30)
        .map(([key, item]) => [key, sanitize(item)]),
    );
  }
  return String(value);
}

export async function logRecoveryEvent(
  event: RecoveryDiagnosticEventName,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RECOVERY_DIAGNOSTICS_KEY);
    const existing: RecoveryDiagnosticEvent[] = raw ? JSON.parse(raw) : [];
    const next: RecoveryDiagnosticEvent = {
      id: `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      event,
      at: Date.now(),
      data: data ? (sanitize(data) as Record<string, unknown>) : undefined,
    };

    await AsyncStorage.setItem(
      RECOVERY_DIAGNOSTICS_KEY,
      JSON.stringify([next, ...existing].slice(0, MAX_EVENTS)),
    );
  } catch (error) {
    console.warn("Recovery diagnostics could not be persisted", error);
  }
}

export async function getRecoveryDiagnosticEvents(): Promise<RecoveryDiagnosticEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(RECOVERY_DIAGNOSTICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function clearRecoveryDiagnosticEvents(): Promise<void> {
  await AsyncStorage.removeItem(RECOVERY_DIAGNOSTICS_KEY);
}

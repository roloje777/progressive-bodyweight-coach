import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RetryRecoveryLock } from "@/engine/RetryRecoveryPolicy";
export const RETRY_RECOVERY_KEY = "PBH_RETRY_RECOVERY_V1";
export async function loadRetryRecoveryLock(): Promise<RetryRecoveryLock | null> {
  const raw = await AsyncStorage.getItem(RETRY_RECOVERY_KEY);
  if (!raw) return null;
  try {
    const lock = JSON.parse(raw);
    if (typeof lock.programId !== "string" || !Number.isSafeInteger(lock.weekIndex) ||
      !Number.isSafeInteger(lock.dayIndex) || !Number.isFinite(lock.startedAt) ||
      !Number.isFinite(lock.unlockAt) || lock.unlockAt <= lock.startedAt) return null;
    return lock as RetryRecoveryLock;
  } catch { return null; }
}
export async function saveRetryRecoveryLock(lock: RetryRecoveryLock): Promise<void> {
  await AsyncStorage.setItem(RETRY_RECOVERY_KEY, JSON.stringify(lock));
}
export async function clearRetryRecoveryLock(): Promise<void> {
  await AsyncStorage.removeItem(RETRY_RECOVERY_KEY);
}

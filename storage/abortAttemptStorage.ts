import AsyncStorage from "@react-native-async-storage/async-storage";
import { AbortAttempt } from "@/models/AbortAttempt";
const KEY = "workout_aborted_attempts_v1";
export async function getAbortAttempts(): Promise<AbortAttempt[]> {
  const value = await AsyncStorage.getItem(KEY);
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed as AbortAttempt[] : [];
}
export async function saveAbortAttempt(attempt: AbortAttempt): Promise<void> {
  const existing = await getAbortAttempts();
  if (existing.some(a => a.attemptId === attempt.attemptId)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([...existing, attempt]));
}

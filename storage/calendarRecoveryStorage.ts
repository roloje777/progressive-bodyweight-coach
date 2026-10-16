import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalendarRecovery, parseLocalDateKey } from "@/engine/CalendarRecoveryPolicy";
const KEY = "PBH_CALENDAR_RECOVERY_V1";
export async function loadCalendarRecovery(): Promise<CalendarRecovery | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as CalendarRecovery;
    if (!value || typeof value.programId !== "string" || !Number.isSafeInteger(value.weekIndex) || !Number.isSafeInteger(value.dayIndex) || !parseLocalDateKey(value.sourceDay) || !Number.isSafeInteger(value.recoveryDays) || value.recoveryDays < 0 || !["retry","extra"].includes(value.kind)) return null;
    return value;
  } catch { return null; }
}
export async function saveCalendarRecovery(value: CalendarRecovery): Promise<void> { await AsyncStorage.setItem(KEY, JSON.stringify(value)); }
export async function clearCalendarRecovery(): Promise<void> { await AsyncStorage.removeItem(KEY); }

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "PBH_PAIN_TRIAGE_HISTORY_V1";
export type PainTriageRecord = {
  id: string;
  recordedAt: string;
  programId: string;
  weekIndex: number;
  dayIndex: number;
  painStillPresent: boolean | null;
  affectedGoodForm: boolean | null;
  severePain: boolean | null;
  worseningPain: boolean | null;
  warningSigns: boolean | null;
  outcome: "medical-recovery" | "pain-week" | "continue";
};
let pending: Promise<void> = Promise.resolve();
export async function loadPainTriageHistory(): Promise<PainTriageRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as PainTriageRecord[] : [];
  } catch { return []; }
}
export function savePainTriageRecord(value: PainTriageRecord): Promise<void> {
  const write = pending.catch(() => undefined).then(async () => {
    const all = await loadPainTriageHistory();
    if (all.some(a => a.id === value.id)) return;
    await AsyncStorage.setItem(KEY, JSON.stringify([...all, value]));
  });
  pending = write;
  return write;
}

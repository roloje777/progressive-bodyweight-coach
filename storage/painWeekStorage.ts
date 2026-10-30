import AsyncStorage from "@react-native-async-storage/async-storage";
import { isPainWeekAssessment, PainWeekAssessment, PainWeekFinalAssessment } from "@/engine/PainWeekPolicy";

const KEY = "PBH_PAIN_WEEK_EPISODES_V1";
export type PainWeekEpisode = {
  id: string;
  startedLocalDate: string;
  recommendedDays: number;
  originalProgramId: string;
  originalWeekIndex: number;
  originalDayIndex: number;
  status: "active" | "completed" | "medical-recovery";
  dailyAssessments: PainWeekAssessment[];
  finalAssessment?: PainWeekFinalAssessment;
  actualDays?: number;
  completedAt?: string;
};
const isEpisode = (v: unknown): v is PainWeekEpisode => {
  if (!v || typeof v !== "object") return false;
  const e = v as Partial<PainWeekEpisode>;
  return typeof e.id === "string" && !!e.id && /^\d{4}-\d{2}-\d{2}$/.test(e.startedLocalDate ?? "") &&
    Number.isInteger(e.recommendedDays) && (e.recommendedDays ?? 0) > 0 &&
    typeof e.originalProgramId === "string" && Number.isInteger(e.originalWeekIndex) && Number.isInteger(e.originalDayIndex) &&
    ["active", "completed", "medical-recovery"].includes(e.status ?? "") &&
    Array.isArray(e.dailyAssessments) && e.dailyAssessments.every(isPainWeekAssessment);
};
export async function loadPainWeekEpisodes(): Promise<PainWeekEpisode[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEpisode) : [];
  } catch { return []; }
}
export async function getActivePainWeek(): Promise<PainWeekEpisode | null> {
  return (await loadPainWeekEpisodes()).find(e => e.status === "active") ?? null;
}
export async function savePainWeekEpisode(episode: PainWeekEpisode): Promise<void> {
  if (!isEpisode(episode)) throw new Error("Invalid Pain Week episode");
  const all = await loadPainWeekEpisodes();
  if (episode.status === "active" && all.some(e => e.id !== episode.id && e.status === "active"))
    throw new Error("Another Pain Week is already active");
  await AsyncStorage.setItem(KEY, JSON.stringify([...all.filter(e => e.id !== episode.id), episode]));
}
/** One dated check-in per episode per local day; repeat saves update, never add a recovery day. */
export async function savePainWeekDailyAssessment(episodeId: string, assessment: PainWeekAssessment): Promise<void> {
  if (!isPainWeekAssessment(assessment) || assessment.episodeId !== episodeId) throw new Error("Invalid daily assessment");
  const episode = (await loadPainWeekEpisodes()).find(e => e.id === episodeId && e.status === "active");
  if (!episode) throw new Error("No active Pain Week episode");
  await savePainWeekEpisode({ ...episode, dailyAssessments: [
    ...episode.dailyAssessments.filter(a => a.localDate !== assessment.localDate), assessment,
  ].sort((a,b) => a.localDate.localeCompare(b.localDate)) });
}
export async function deletePainWeekEpisode(id: string): Promise<void> {
  const all = await loadPainWeekEpisodes();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(e => e.id !== id)));
}

/** Create one active episode; a medical hold must be checked by the caller first. */
export async function beginPainWeekEpisode(episode: PainWeekEpisode): Promise<void> {
  if (episode.status !== "active") throw new Error("Pain Week must begin active");
  await savePainWeekEpisode(episode);
}
/** Complete only the episode that was approved; retain history. */
export async function completePainWeekEpisode(id: string, actualDays: number): Promise<void> {
  const episode = await getActivePainWeek();
  if (!episode || episode.id !== id || !Number.isInteger(actualDays) || actualDays < 1) throw new Error("Pain Week changed");
  await savePainWeekEpisode({ ...episode, status: "completed", actualDays, completedAt: new Date().toISOString() });
}
export async function escalatePainWeekEpisode(id: string): Promise<void> {
  const episode = await getActivePainWeek();
  if (!episode || episode.id !== id) throw new Error("Pain Week changed");
  await savePainWeekEpisode({ ...episode, status: "medical-recovery" });
}

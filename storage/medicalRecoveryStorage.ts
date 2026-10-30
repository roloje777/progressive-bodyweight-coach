import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicalRecoveryAssessment, isMedicalRecoveryAssessment } from "@/engine/MedicalRecoveryPolicy";

const KEY = "PBH_MEDICAL_RECOVERY_ASSESSMENTS_V1";
/** Private local assessment history; callers must not log consultation notes. */
export async function loadMedicalRecoveryAssessments(): Promise<MedicalRecoveryAssessment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isMedicalRecoveryAssessment) : [];
  } catch { return []; }
}
export async function saveMedicalRecoveryAssessment(value: MedicalRecoveryAssessment): Promise<void> {
  if (!isMedicalRecoveryAssessment(value)) throw new Error("Invalid medical recovery assessment");
  const existing = await loadMedicalRecoveryAssessments();
  await AsyncStorage.setItem(KEY, JSON.stringify([...existing, value]));
}
export async function deleteMedicalRecoveryEpisode(episodeId: string): Promise<void> {
  const existing = await loadMedicalRecoveryAssessments();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter(a => a.episodeId !== episodeId)));
}

const ACTIVE_KEY = "PBH_MEDICAL_RECOVERY_ACTIVE_V1";
/** A persisted safety lock, independent of the Suggested/Compulsory rest setting. */
export async function getActiveMedicalRecovery(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_KEY);
}
export async function beginMedicalRecovery(episodeId: string): Promise<void> {
  if (!episodeId.trim()) throw new Error("Missing medical episode ID");
  await AsyncStorage.setItem(ACTIVE_KEY, episodeId);
}
export async function completeMedicalRecovery(episodeId: string): Promise<void> {
  if ((await getActiveMedicalRecovery()) !== episodeId) throw new Error("Medical recovery episode changed");
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

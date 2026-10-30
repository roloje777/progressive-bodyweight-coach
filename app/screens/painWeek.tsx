import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useFocusEffect } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useProgress } from "@/hooks/useProgress";
import { getActiveMedicalRecovery, beginMedicalRecovery } from "@/storage/medicalRecoveryStorage";
import { assessPainWeek, assessFinalPainWeek, painWeekDay, PainWeekAssessment, PainWeekSymptoms } from "@/engine/PainWeekPolicy";
import { getActivePainWeek, savePainWeekDailyAssessment, savePainWeekEpisode, completePainWeekEpisode, escalatePainWeekEpisode, PainWeekEpisode } from "@/storage/painWeekStorage";

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
export default function PainWeekScreen() {
  const { t } = useTranslation();
  const palette = useAppPalette();
  const { week, beginPainRecovery, isLoaded } = useProgress();
  const [episode, setEpisode] = useState<PainWeekEpisode | null>(null);
  const [busy, setBusy] = useState(false);
  const [pain, setPain] = useState("0");
  const [symptoms, setSymptoms] = useState<PainWeekSymptoms>("improving");
  const [movement, setMovement] = useState(false);
  const [severe, setSevere] = useState(false);
  const [warning, setWarning] = useState(false);
  const [ready, setReady] = useState(false);
  const [early, setEarly] = useState(false);
  const [savedFinal, setSavedFinal] = useState(false);
  const [finalMode, setFinalMode] = useState(false);
  const [savedDaily, setSavedDaily] = useState(false);
  const today = localDate(new Date());
  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      if (await getActiveMedicalRecovery()) { router.replace("/screens/medicalRecovery"); return; }
      const item = await getActivePainWeek();
      if (!active) return;
      if (!item) { router.replace("/"); return; }
      setEpisode(item);
      const last = item.dailyAssessments.find(a => a.localDate === localDate(new Date()));
      if (last) {
        setPain(String(last.painScore)); setSymptoms(last.symptoms);
        setMovement(last.movementLimited); setSevere(last.severePain);
        setWarning(last.warningSigns); setReady(last.readyForReducedTraining);
        setSavedDaily(true);
      }
    })();
    return () => { active = false; };
  }, []));
  const makeAssessment = (): PainWeekAssessment | null => {
    if (!episode || !/^\d+$/.test(pain) || Number(pain) > 10) return null;
    return { episodeId: episode.id, localDate: today, recordedAt: new Date().toISOString(), painScore: Number(pain),
      symptoms, movementLimited: movement, severePain: severe, warningSigns: warning, readyForReducedTraining: ready };
  };
  const assessment = makeAssessment();
  const day = episode ? painWeekDay(episode.startedLocalDate, today) : 1;
  const decision = assessment ? assessPainWeek(assessment) : "continue-recovery";
  const finalDecision = assessment && episode ? assessFinalPainWeek({ ...assessment, earlyReturnAcknowledged: early }, day, episode.recommendedDays) : "continue-recovery";
  const dirty = () => { setSavedDaily(false); setSavedFinal(false); };
  const medicalEscalation = async () => {
    if (!episode) return;
    await escalatePainWeekEpisode(episode.id);
    if (!await getActiveMedicalRecovery()) await beginMedicalRecovery(`medical-${Date.now()}`);
    router.replace("/screens/medicalRecovery");
  };
  const saveDaily = async () => {
    if (!assessment || !episode || busy) { Alert.alert(t("painWeek.error")); return; }
    setBusy(true);
    try {
      if (decision === "medical-recovery") { await medicalEscalation(); return; }
      await savePainWeekDailyAssessment(episode.id, assessment);
      setEpisode(await getActivePainWeek()); setSavedDaily(true); setSavedFinal(false);
      Alert.alert(t("painWeek.saved"));
    } catch { Alert.alert(t("painWeek.error")); } finally { setBusy(false); }
  };
  const saveFinal = async () => {
    if (!episode || !assessment || !savedDaily || busy) return;
    if (finalDecision === "medical-recovery") { await medicalEscalation(); return; }
    if (finalDecision !== "ready-for-deload") { Alert.alert(t("painWeek.blocked")); return; }
    setBusy(true);
    try {
      await savePainWeekEpisode({ ...episode, finalAssessment: { ...assessment, earlyReturnAcknowledged: early } });
      setEpisode(await getActivePainWeek()); setSavedFinal(true);
      Alert.alert(t("painWeek.saved"));
    } catch { Alert.alert(t("painWeek.error")); } finally { setBusy(false); }
  };
  const beginDeload = async () => {
    if (!episode || !assessment || !savedFinal || busy || finalDecision !== "ready-for-deload") return;
    setBusy(true);
    try {
      if (await getActiveMedicalRecovery()) { router.replace("/screens/medicalRecovery"); return; }
      const current = await getActivePainWeek();
      if (!current || current.id !== episode.id || !current.finalAssessment) throw new Error("Pain Week changed");
      // Preserve the original normal position even when pain interrupted Deload/Verification.
      if (!beginPainRecovery(episode.originalWeekIndex)) throw new Error("Deload unavailable");
      await completePainWeekEpisode(episode.id, day);
      router.replace("/");
    } catch { Alert.alert(t("painWeek.error")); } finally { setBusy(false); }
  };
  const button = (label: string, onPress: () => void, disabled = false) => <TouchableOpacity disabled={disabled || busy} onPress={onPress} style={{ padding: 14, borderRadius: 10, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border }}><Text style={{ color: palette.text, fontWeight: "700", textAlign: "center" }}>{label}</Text></TouchableOpacity>;
  const checkbox = (label: string, value: boolean, set: (value: boolean) => void) => <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => { set(!value); dirty(); }} style={{ paddingVertical: 9 }}><Text style={{ color: palette.text }}>{value ? "☑" : "☐"} {label}</Text></TouchableOpacity>;
  if (!isLoaded || !episode) return null;
  return <><Stack.Screen options={{ headerShown: false }} /><SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}><ScrollView contentContainerStyle={{ padding: 20, gap: 15 }}>
    <Text style={{ color: palette.text, fontSize: 24, fontWeight: "700" }}>{t("painWeek.title")}</Text>
    <Text style={{ color: palette.text }}>{t("painWeek.description")}</Text>
    <Text style={{ color: palette.text }}>{t("painWeek.day")}: {day} · {t("painWeek.recommended")}: {episode.recommendedDays}</Text>
    <Text style={{ color: palette.text }}>{t("painWeek.pain")}</Text>
    <TextInput keyboardType="number-pad" value={pain} onChangeText={v => { setPain(v); dirty(); }} style={{ borderWidth: 1, borderColor: palette.border, color: palette.text, padding: 12, borderRadius: 8 }} />
    <Text style={{ color: palette.text }}>{t("painWeek.symptoms")}</Text>
    {(["resolved", "improving", "unchanged", "worsening"] as const).map(v => button(`${symptoms === v ? "◉" : "○"} ${t(`painWeek.${v}`)}`, () => { setSymptoms(v); dirty(); }))}
    {checkbox(t("painWeek.movement"), movement, setMovement)}
    {checkbox(t("painWeek.severe"), severe, setSevere)}
    {checkbox(t("painWeek.warning"), warning, setWarning)}
    {checkbox(t("painWeek.ready"), ready, setReady)}
    {decision === "medical-recovery" ? <><Text style={{ color: palette.text }}>{t("painWeek.medical")}</Text>{button(t("medicalRecovery.enter"), () => void medicalEscalation())}</> : <>
      {button(t("painWeek.save"), () => void saveDaily(), !assessment)}
      {savedDaily && decision === "final-assessment-eligible" && !finalMode && button(t("painWeek.final"), () => setFinalMode(true))}
      {finalMode && savedDaily && decision === "final-assessment-eligible" && <>
        <Text style={{ color: palette.text, fontWeight: "700" }}>{t("painWeek.final")}</Text>
        {day < episode.recommendedDays && <><Text style={{ color: palette.text }}>{t("painWeek.earlyWarning")}</Text>{<TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: early }} onPress={() => { setEarly(!early); setSavedFinal(false); }} style={{ paddingVertical: 9 }}><Text style={{ color: palette.text }}>{early ? "☑" : "☐"} {t("painWeek.early")}</Text></TouchableOpacity>}</>}
        {button(t("painWeek.finalSave"), () => void saveFinal(), finalDecision !== "ready-for-deload")}
        {savedFinal && button(t("painWeek.begin"), () => void beginDeload())}
      </>}
      {button(t("painWeek.continue"), () => router.replace("/"))}
    </>}
    <Text style={{ color: palette.text, fontWeight: "700" }}>{t("painWeek.history")}</Text>
    {episode.dailyAssessments.map(a => <Text key={a.localDate} style={{ color: palette.text }}>{a.localDate}: {a.painScore}/10 — {t(`painWeek.${a.symptoms}`)}</Text>)}
  </ScrollView></SafeAreaView></>;
}

import React, { useCallback, useState } from "react";
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useFocusEffect } from "expo-router";
import { useProgress } from "@/hooks/useProgress";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppPalette } from "@/hooks/use-app-palette";
import { assessMedicalRecovery, MedicalRecoveryAssessment } from "@/engine/MedicalRecoveryPolicy";
import { getActiveMedicalRecovery, loadMedicalRecoveryAssessments, saveMedicalRecoveryAssessment, completeMedicalRecovery } from "@/storage/medicalRecoveryStorage";

/** Medical recovery is a safety hold, not a diagnosis or a medical clearance service. */
export default function MedicalRecoveryScreen() {
  const palette = useAppPalette();
  const { t } = useTranslation();
  const { week, beginPainRecovery, isLoaded } = useProgress();
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [treatment, setTreatment] = useState("");
  const [daysAway, setDaysAway] = useState("");
  const [notes, setNotes] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savedApproved, setSavedApproved] = useState(false);
  const [symptoms, setSymptoms] = useState<MedicalRecoveryAssessment["symptoms"]>("improving");
  const [painScore, setPainScore] = useState("5");
  const [clearance, setClearance] = useState(false);
  const [restrictions, setRestrictions] = useState(false);
  const [warningSigns, setWarningSigns] = useState(false);
  useFocusEffect(useCallback(() => {
    let live = true;
    void (async () => {
      const id = await getActiveMedicalRecovery();
      if (!live) return;
      setEpisodeId(id);
      setSavedApproved(false);
      if (!id) return;
      const saved = (await loadMedicalRecoveryAssessments()).filter(a => a.episodeId === id).slice(-1)[0];
      if (!live || !saved) return;
      setTreatment(saved.treatment); setDaysAway(saved.daysAway == null ? "" : String(saved.daysAway));
      setNotes(saved.notes); setConsultationDate(saved.consultationDate ?? "");
      setSymptoms(saved.symptoms); setPainScore(String(saved.painScore));
      setClearance(saved.medicalClearanceConfirmed); setRestrictions(saved.restrictionsAcknowledged);
      setWarningSigns(saved.warningSigns);
    })();
    return () => { live = false; };
  }, []));
  const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const selectedDate = consultationDate && /^\d{4}-\d{2}-\d{2}$/.test(consultationDate) ? (() => {
    const [y, m, d] = consultationDate.split("-").map(Number);
    const candidate = new Date(y, m - 1, d);
    return dateKey(candidate) === consultationDate ? candidate : new Date();
  })() : new Date();
  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "set" && date) { setConsultationDate(dateKey(date)); setSavedApproved(false); }
  };
  const assessment: MedicalRecoveryAssessment | null = episodeId ? {
    episodeId, recordedAt: new Date().toISOString(), consultationDate: consultationDate.trim() || undefined,
    treatment: treatment.trim(), daysAway: /^\d+$/.test(daysAway.trim()) ? Number(daysAway) : null,
    notes, symptoms, painScore: /^\d+$/.test(painScore.trim()) ? Number(painScore) : -1,
    medicalClearanceConfirmed: clearance, restrictionsAcknowledged: restrictions, warningSigns,
  } : null;
  const decision = assessment ? assessMedicalRecovery(assessment) : "medical-recovery";
  const approvedAndSaved = decision === "ready-for-deload" && savedApproved;
  const update = (setter: (value: any) => void) => (value: any) => { setSavedApproved(false); setter(value); };
  const field = (label: string, value: string, set: (v: string) => void, numeric = false, multiline = false) => (
    <View style={{ gap: 6 }}><Text style={{ color: palette.text, fontWeight: "600" }}>{label}</Text>
      <TextInput value={value} onChangeText={update(set)} keyboardType={numeric ? "numeric" : "default"} multiline={multiline}
        style={{ borderWidth: 1, borderColor: palette.border, color: palette.text, borderRadius: 8, padding: 12, minHeight: multiline ? 88 : 46 }} /></View>
  );
  const choice = (label: string, value: boolean, set: (v: boolean) => void) => (
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => update(set)(!value)} style={{ paddingVertical: 8 }}>
      <Text style={{ color: palette.text }}>{value ? "☑" : "☐"} {label}</Text>
    </TouchableOpacity>
  );
  const save = async (proceed: boolean) => {
    if (!assessment || busy) return;
    if (!assessment.treatment || assessment.daysAway == null || assessment.painScore < 0 || assessment.painScore > 10) {
      Alert.alert(t("medicalRecovery.invalid")); return;
    }
    if (proceed && !approvedAndSaved) { Alert.alert(t("medicalRecovery.blocked")); return; }
    setBusy(true);
    try {
      if (!proceed) await saveMedicalRecoveryAssessment({ ...assessment, recordedAt: new Date().toISOString() });
      if (proceed) {
        // Always begin a fresh reduced-load cycle after medical recovery.
        // beginPainRecovery preserves the original normal cursor even if
        // this episode interrupted a previous Deload or Verification.
        const started = beginPainRecovery(week);
        if (!started) throw new Error("Unable to enter Deload");
        await completeMedicalRecovery(assessment.episodeId);
        router.replace("/");
      } else if (decision === "ready-for-deload") {
        setSavedApproved(true);
        Alert.alert(t("medicalRecovery.saved"), t("medicalRecovery.savedReady"));
      } else {
        setSavedApproved(false);
        Alert.alert(t("medicalRecovery.saved"), t("medicalRecovery.savedHold"), [
          { text: t("medicalRecovery.ok"), onPress: () => router.replace("/") },
        ]);
      }
    } catch { Alert.alert(t("medicalRecovery.saveFailed")); }
    finally { setBusy(false); }
  };
  if (!isLoaded) return null;
  return <><Stack.Screen options={{ headerShown: false }}/><SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", color: palette.text }}>{t("medicalRecovery.title")}</Text>
      <Text style={{ color: palette.text }}>{t("medicalRecovery.explanation")}</Text>
      {field(t("medicalRecovery.treatment"), treatment, setTreatment)}
      {field(t("medicalRecovery.daysAway"), daysAway, setDaysAway, true)}
      <View style={{ gap: 6 }}>
        <Text style={{ color: palette.text, fontWeight: "600" }}>{t("medicalRecovery.consultationDate")}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setShowDatePicker(true)} style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 8, padding: 14 }}>
          <Text style={{ color: palette.text }}>{consultationDate || t("medicalRecovery.selectDate")}</Text>
        </TouchableOpacity>
        {!!consultationDate && <TouchableOpacity onPress={() => { setConsultationDate(""); setSavedApproved(false); }}><Text style={{ color: palette.primary }}>{t("medicalRecovery.clearDate")}</Text></TouchableOpacity>}
        {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />}
        {showDatePicker && Platform.OS === "ios" && <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: palette.primary }}>{t("medicalRecovery.doneDate")}</Text></TouchableOpacity>}
      </View>
      {field(t("medicalRecovery.notes"), notes, setNotes, false, true)}
      <Text style={{ color: palette.text, fontWeight: "600" }}>{t("medicalRecovery.symptoms")}</Text>
      {(["resolved", "improving", "unchanged", "worsening"] as const).map(v => <TouchableOpacity key={v} onPress={() => update(setSymptoms)(v)} style={{ padding: 8, borderWidth: 1, borderColor: symptoms === v ? palette.primary : palette.border, borderRadius: 8 }}><Text style={{ color: palette.text }}>{symptoms === v ? "◉" : "○"} {t(`medicalRecovery.${v}`)}</Text></TouchableOpacity>)}
      <View style={{ gap: 6 }}>
        <Text style={{ color: palette.text, fontWeight: "600" }}>{t("medicalRecovery.painScore")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease pain intensity"
            disabled={Number(painScore) <= 0}
            onPress={() => update(setPainScore)(String(Math.max(0, Number(painScore) - 1)))}
            style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.border }}>
            <Text style={{ color: palette.text, fontSize: 22 }}>−</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator
            contentContainerStyle={{ alignItems: "center", gap: 6, paddingVertical: 6 }}
            style={{ flex: 1 }}>
            {Array.from({ length: 11 }, (_, score) => (
              <TouchableOpacity key={score} accessibilityRole="button"
                accessibilityState={{ selected: Number(painScore) === score }}
                onPress={() => update(setPainScore)(String(score))}
                style={{ minWidth: 42, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center",
                  borderWidth: 1, borderRadius: 8,
                  borderColor: Number(painScore) === score ? palette.primary : palette.border,
                  backgroundColor: Number(painScore) === score ? palette.surfaceAlt : "transparent" }}>
                <Text style={{ color: palette.text, fontWeight: Number(painScore) === score ? "800" : "400" }}>{score}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase pain intensity"
            disabled={Number(painScore) >= 10}
            onPress={() => update(setPainScore)(String(Math.min(10, Number(painScore) + 1)))}
            style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.border }}>
            <Text style={{ color: palette.text, fontSize: 22 }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      {choice(t("medicalRecovery.clearance"), clearance, setClearance)}
      {choice(t("medicalRecovery.restrictions"), restrictions, setRestrictions)}
      {choice(t("medicalRecovery.warningSigns"), warningSigns, setWarningSigns)}
      <View accessibilityRole="alert" style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: decision === "ready-for-deload" ? "#21865B" : "#C66B22", backgroundColor: decision === "ready-for-deload" ? "#123D2C" : "#4A2B17" }}>
        <Text style={{ color: decision === "ready-for-deload" ? "#B8F4D5" : "#FFE0B8", fontWeight: "800", lineHeight: 22 }}>
          {decision === "ready-for-deload" ? t("medicalRecovery.ready") : t("medicalRecovery.blocked")}
        </Text>
      </View>
      <TouchableOpacity disabled={busy} onPress={() => void save(false)} style={{ backgroundColor: palette.surfaceAlt, padding: 16, borderRadius: 10 }}><Text style={{ color: palette.text, textAlign: "center", fontWeight: "700" }}>{t("medicalRecovery.saveDraft")}</Text></TouchableOpacity>
      {approvedAndSaved && <TouchableOpacity disabled={busy} onPress={() => void save(true)} style={{ backgroundColor: palette.primary, padding: 16, borderRadius: 10 }}><Text style={{ color: palette.primaryText, textAlign: "center", fontWeight: "700" }}>{t("medicalRecovery.beginDeload")}</Text></TouchableOpacity>}
      <Text style={{ color: palette.text }}>{t("medicalRecovery.medicalAdvice")}</Text>
    </ScrollView>
  </SafeAreaView></>;
}

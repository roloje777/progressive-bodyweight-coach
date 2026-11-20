/** Local-only, read-only analytics. No private medical notes or treatment are loaded. */
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
import { getAbortAttempts } from "@/storage/abortAttemptStorage";
import { loadPainTriageHistory } from "@/storage/painTriageHistoryStorage";
import { loadPainWeekEpisodes } from "@/storage/painWeekStorage";
import { loadMedicalRecoveryAssessments } from "@/storage/medicalRecoveryStorage";
import { buildRecoveryAnalytics, type AnalyticsWindow, type AnalyticsBucket, type RecoveryAnalytics } from "@/utils/recoveryAnalytics";

const names: Record<string, [string, string]> = {
  pain: ["Pain", "Dor"], fatigue: ["Fatigue", "Fadiga"], unwell: ["Unwell", "Indisposição"],
  time: ["Time", "Tempo"], commitment: ["Commitment", "Compromisso"], equipment: ["Equipment", "Equipamento"],
  technical: ["Technical", "Técnico"], emergency: ["Emergency", "Emergência"], other: ["Other", "Outro"],
  dynamicWarmUp: ["Warm-up", "Aquecimento"], workout: ["Main workout", "Treino principal"],
  staticStretch: ["Stretching", "Alongamentos"], continue: ["Continue", "Continuar"],
  "pain-week": ["Pain Week", "Semana de dor"], "medical-recovery": ["Medical Recovery", "Recuperação médica"],
  active: ["Active", "Ativo"], completed: ["Completed", "Concluído"],
};
export default function RecoveryAnalyticsScreen() {
  const palette = useAppPalette();
  const { language } = useTranslation();
  const pt = language === "pt-PT";
  const [window, setWindow] = useState<AnalyticsWindow>("all");
  const [data, setData] = useState<RecoveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.background },
    content: { padding: 18, paddingBottom: 50 },
    heading: { color: palette.text, fontSize: 22, fontWeight: "700", marginTop: 15, marginBottom: 8 },
    text: { color: palette.text, fontSize: 14, lineHeight: 20 },
    muted: { color: palette.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
    link: { color: palette.info, fontWeight: "700", marginTop: 8 },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginVertical: 12 },
    chip: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
    selected: { backgroundColor: palette.primary, borderColor: palette.primary },
    card: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, borderRadius: 14, padding: 15, marginBottom: 13 },
    cardTitle: { color: palette.text, fontSize: 17, fontWeight: "700", marginBottom: 10 },
    metric: { color: palette.text, fontSize: 25, fontWeight: "700", marginBottom: 4 },
    barTrack: { height: 9, borderRadius: 6, backgroundColor: palette.surfaceAlt, overflow: "hidden", marginTop: 5, marginBottom: 11 },
    barFill: { height: 9, backgroundColor: palette.primary, borderRadius: 6 },
  });
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [aborts, triages, episodes, assessments] = await Promise.all([
        getAbortAttempts(), loadPainTriageHistory(), loadPainWeekEpisodes(), loadMedicalRecoveryAssessments(),
      ]);
      // Explicit allowlist: never pass treatment, notes, consultation details or other free text to analytics.
      const safeMedical = assessments.map(a => ({ episodeId: a.episodeId, recordedAt: a.recordedAt,
        painScore: a.painScore, symptoms: a.symptoms,
        medicalClearanceConfirmed: a.medicalClearanceConfirmed, warningSigns: a.warningSigns }));
      setData(buildRecoveryAnalytics(aborts, triages, episodes, safeMedical, window));
    } catch (e) {
      console.error("Recovery analytics could not load", e);
      setError(true);
    } finally { setLoading(false); }
  }, [window]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const t = (en: string, portuguese: string) => pt ? portuguese : en;
  const bars = (items: AnalyticsBucket[], total: number) => items.map(item => (
    <View key={item.key}>
      <Text style={styles.text}>{names[item.key]?.[pt ? 1 : 0] ?? item.key}: {item.count}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${total ? item.count / total * 100 : 0}%` }]} /></View>
    </View>
  ));
  return <SafeAreaView style={styles.screen} edges={["bottom"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.link}>{t("‹ Back to Recovery History", "‹ Voltar ao histórico de recuperação")}</Text></Pressable>
      <Text style={styles.heading}>{t("Recovery & Interruption Analytics", "Análises de recuperação e interrupções")}</Text>
      <Text style={styles.muted}>{t("Descriptive counts from records stored on this device. These are not medical advice or measures of recovery readiness.", "Contagens descritivas dos registos guardados neste dispositivo. Não constituem aconselhamento médico nem medem a prontidão para regressar ao treino.")}</Text>
      <View style={styles.row}>{(["all", "30", "90"] as AnalyticsWindow[]).map(value =>
        <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: window === value }} onPress={() => setWindow(value)} style={[styles.chip, window === value && styles.selected]}>
          <Text style={{ color: window === value ? palette.primaryText : palette.text, fontWeight: "600" }}>{value === "all" ? t("All time", "Todo o período") : t(`Last ${value} days`, `Últimos ${value} dias`)}</Text>
        </Pressable>)}</View>
      {loading ? <ActivityIndicator color={palette.primary}/> : error || !data ? <Text style={styles.text}>{t("Unable to load analytics.", "Não foi possível carregar as análises.")}</Text> : <>
        <View style={styles.card}><Text style={styles.cardTitle}>{t("Workout interruptions", "Interrupções de treino")}</Text>
          <Text style={styles.metric}>{data.aborts}</Text><Text style={styles.muted}>{t("Recorded aborted attempts", "Tentativas interrompidas registadas")}</Text>
          <Text style={styles.text}>{t("Average recorded completion", "Conclusão média registada")}: {data.averageAbortCompletion == null ? "—" : `${data.averageAbortCompletion}%`}</Text>
          <Text style={styles.cardTitle}>{t("Reasons", "Motivos")}</Text>{bars(data.abortReasons, data.aborts)}
          <Text style={styles.cardTitle}>{t("Stage of interruption", "Fase da interrupção")}</Text>{bars(data.abortStages, data.aborts)}</View>
        <View style={styles.card}><Text style={styles.cardTitle}>{t("Pain Coach assessments", "Avaliações do Coach de Dor")}</Text>
          <Text style={styles.metric}>{data.triages}</Text>{bars(data.triageOutcomes, data.triages)}</View>
        <View style={styles.card}><Text style={styles.cardTitle}>{t("Pain Week episodes", "Episódios de Semana de Dor")}</Text>
          <Text style={styles.metric}>{data.painWeeks}</Text><Text style={styles.text}>{t("Daily check-ins", "Registos diários")}: {data.dailyCheckIns}</Text>
          {bars(data.painWeekStatuses, data.painWeeks)}</View>
        <View style={styles.card}><Text style={styles.cardTitle}>{t("Medical Recovery assessments", "Avaliações de recuperação médica")}</Text>
          <Text style={styles.metric}>{data.medicalAssessments}</Text>
          <Text style={styles.text}>{t("Distinct recorded episodes", "Episódios distintos registados")}: {data.medicalEpisodes}</Text>
          <Text style={styles.text}>{t("Assessments reporting medical clearance", "Avaliações com autorização médica declarada")}: {data.medicalClearances}</Text>
          <Text style={styles.text}>{t("Average recorded pain (0–10)", "Dor média registada (0–10)")}: {data.averageMedicalPain ?? "—"}</Text>
        </View>
        <Text style={styles.muted}>{t("A single interruption may also have a Pain Coach assessment, Pain Week episode and Medical Recovery record. Counts across sections must not be added together. The 30/90-day window uses record dates and Pain Week start dates; Pain Week check-ins are counted within their selected episodes. No private treatment or notes are included.", "Uma interrupção pode também ter uma avaliação do Coach de Dor, um episódio de Semana de Dor e um registo de Recuperação Médica. Não some as contagens das diferentes secções. Os períodos de 30/90 dias usam as datas dos registos e de início dos episódios; os registos diários são contados nos episódios selecionados. Tratamentos e notas privadas não são incluídos.")}</Text>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

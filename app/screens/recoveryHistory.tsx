/** Read-only local history. Medical notes never leave this screen or enter analytics. */
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
import { getAbortAttempts } from "@/storage/abortAttemptStorage";
import { loadPainTriageHistory } from "@/storage/painTriageHistoryStorage";
import { loadPainWeekEpisodes } from "@/storage/painWeekStorage";
import { loadMedicalRecoveryAssessments } from "@/storage/medicalRecoveryStorage";
import { abortReasonLabel, abortStageLabel } from "@/utils/abortPresentation";
import { exportRecoveryHistory, type RecoveryExportEntry } from "@/utils/recoveryHistoryExport";
import type { WorkoutExportFormat } from "@/utils/workoutExport";

type Kind = "abort" | "triage" | "pain-week" | "medical";
type Entry = RecoveryExportEntry;
const when = (date: string | number) => { const n = new Date(date).getTime(); return Number.isFinite(n) ? n : 0; };
const yesNo = (value: boolean | null | undefined, pt: boolean) => value == null ? "—" : value ? (pt ? "Sim" : "Yes") : (pt ? "Não" : "No");

export default function RecoveryHistoryScreen() {
  const palette = useAppPalette();
  const { language } = useTranslation();
  const pt = language === "pt-PT";
  const [items, setItems] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "filtered">("all");
  const [includePrivate, setIncludePrivate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.background },
    content: { padding: 18, paddingBottom: 40 },
    heading: { color: palette.text, fontSize: 22, fontWeight: "700", marginBottom: 7 },
    sub: { color: palette.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
    filters: { flexDirection: "row", gap: 8, marginBottom: 15 },
    chip: { borderColor: palette.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: palette.surface },
    chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
    chipText: { color: palette.text, fontWeight: "600", fontSize: 12 },
    chipTextActive: { color: palette.primaryText },
    card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 12 },
    title: { color: palette.text, fontSize: 16, fontWeight: "700" },
    meta: { color: palette.textMuted, fontSize: 12, marginTop: 5 },
    body: { color: palette.text, fontSize: 13, lineHeight: 20, marginTop: 8 },
    link: { color: palette.info, fontWeight: "700", marginTop: 10 },
    exportBox: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 18 },
    exportRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 10 },
    exportButton: { borderColor: palette.border, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: palette.background },
    exportText: { color: palette.text, fontWeight: "700" },
    privateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 },
  });

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [aborts, triages, episodes, assessments] = await Promise.all([
        getAbortAttempts(), loadPainTriageHistory(), loadPainWeekEpisodes(), loadMedicalRecoveryAssessments(),
      ]);
      const rows: Entry[] = [];
      for (const a of aborts) rows.push({
        id: `abort:${a.attemptId}`, kind: "abort", time: when(a.recordedAt),
        title: pt ? "Treino interrompido" : "Workout aborted",
        summary: `${abortReasonLabel(a.reason, language)} · ${abortStageLabel(a.stage, language)}`,
        details: [
          `${pt ? "Programa" : "Program"}: ${a.programId} · ${pt ? "Semana" : "Week"} ${a.weekIndex == null ? "—" : a.weekIndex + 1} · ${pt ? "Dia" : "Day"} ${a.dayIndex == null ? "—" : a.dayIndex + 1}`,
          `${pt ? "Séries" : "Sets"}: ${a.completedSets}/${a.plannedSets} (${a.completionPercent}%)`,
          `${pt ? "Duração" : "Duration"}: ${Math.floor(a.durationSeconds / 60)} min`,
          ...(a.notes ? [`${pt ? "Observações" : "Notes"}: ${a.notes}`] : []),
        ],
      });
      for (const t of triages) rows.push({
        id: `triage:${t.id}`, kind: "triage", time: when(t.recordedAt),
        title: pt ? "Avaliação do Coach de Dor" : "Pain Coach assessment",
        summary: ({ "medical-recovery": pt ? "Recuperação médica" : "Medical Recovery", "pain-week": pt ? "Semana de recuperação" : "Pain Week", continue: pt ? "Continuar treino" : "Continue training" })[t.outcome],
        details: [
          `${pt ? "Programa" : "Program"}: ${t.programId} · ${pt ? "Semana" : "Week"} ${t.weekIndex + 1} · ${pt ? "Dia" : "Day"} ${t.dayIndex + 1}`,
          `${pt ? "Dor persistente" : "Pain still present"}: ${yesNo(t.painStillPresent, pt)}`,
          `${pt ? "Forma afetada" : "Good form affected"}: ${yesNo(t.affectedGoodForm, pt)}`,
          `${pt ? "Dor intensa" : "Severe pain"}: ${yesNo(t.severePain, pt)}`,
          `${pt ? "Dor a piorar" : "Worsening pain"}: ${yesNo(t.worseningPain, pt)}`,
          `${pt ? "Sinais de alerta" : "Warning signs"}: ${yesNo(t.warningSigns, pt)}`,
        ],
      });
      for (const e of episodes) rows.push({
        id: `pain-week:${e.id}`, kind: "pain-week", time: when(`${e.startedLocalDate}T12:00:00`),
        title: pt ? "Episódio de recuperação da dor" : "Pain Week episode",
        summary: `${e.status === "active" ? (pt ? "Ativo" : "Active") : e.status === "completed" ? (pt ? "Concluído" : "Completed") : (pt ? "Encaminhado para recuperação médica" : "Escalated to Medical Recovery")} · ${e.dailyAssessments.length} ${pt ? "registos diários" : "daily check-ins"}`,
        details: [
          `${pt ? "Início" : "Started"}: ${e.startedLocalDate}`,
          `${pt ? "Programa" : "Program"}: ${e.originalProgramId} · ${pt ? "Semana" : "Week"} ${e.originalWeekIndex + 1} · ${pt ? "Dia" : "Day"} ${e.originalDayIndex + 1}`,
          `${pt ? "Dias recomendados" : "Recommended days"}: ${e.recommendedDays}`,
          ...(e.actualDays != null ? [`${pt ? "Dias efetivos" : "Actual days"}: ${e.actualDays}`] : []),
          ...e.dailyAssessments.map(a => `${a.localDate}: ${pt ? "Dor" : "Pain"} ${a.painScore}/10 · ${a.symptoms} · ${pt ? "Pronto para treino reduzido" : "Ready for reduced training"}: ${yesNo(a.readyForReducedTraining, pt)}`),
          ...(e.finalAssessment ? [`${pt ? "Avaliação final" : "Final assessment"}: ${e.finalAssessment.localDate} · ${pt ? "Dor" : "Pain"} ${e.finalAssessment.painScore}/10`] : []),
        ],
      });
      for (const a of assessments) rows.push({
        id: `medical:${a.episodeId}:${a.recordedAt}`, kind: "medical", time: when(a.recordedAt),
        title: pt ? "Avaliação de recuperação médica" : "Medical Recovery assessment",
        summary: `${pt ? "Dor" : "Pain"} ${a.painScore}/10 · ${a.symptoms}`,
        details: [
          `${pt ? "Consulta" : "Consultation"}: ${a.consultationDate || "—"}`,
          `${pt ? "Dias de afastamento" : "Days away"}: ${a.daysAway ?? "—"}`,
          `${pt ? "Confirmação de autorização médica" : "Medical clearance confirmed"}: ${yesNo(a.medicalClearanceConfirmed, pt)}`,
          `${pt ? "Restrições reconhecidas" : "Restrictions acknowledged"}: ${yesNo(a.restrictionsAcknowledged, pt)}`,
          `${pt ? "Sinais de alerta" : "Warning signs"}: ${yesNo(a.warningSigns, pt)}`,
        ],
        privateDetails: [
          `${pt ? "Tratamento" : "Treatment"}: ${a.treatment || "—"}`,
          `${pt ? "Notas privadas" : "Private notes"}: ${a.notes || "—"}`,
        ],
      });
      rows.sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
      setItems(rows);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [language, pt]);
  useFocusEffect(useCallback(() => { setIncludePrivate(false); void load(); }, [load]));
  const kinds: Array<{ value: "all" | Kind; en: string; pt: string }> = [
    { value: "all", en: "All", pt: "Tudo" }, { value: "abort", en: "Aborts", pt: "Interrupções" },
    { value: "triage", en: "Pain Coach", pt: "Coach de Dor" }, { value: "pain-week", en: "Pain Week", pt: "Semana de Dor" },
    { value: "medical", en: "Medical", pt: "Médico" },
  ];
  const visible = items.filter(i => filter === "all" || i.kind === filter);
  const exportCount = exportScope === "all" ? items.length : visible.length;
  const handleExport = async (format: WorkoutExportFormat) => {
    if (exporting || loading || error || exportCount === 0) return;
    setExporting(true);
    try {
      await exportRecoveryHistory(items, exportScope === "all" ? "all" : filter, includePrivate, pt, format);
    } catch (e) {
      console.error("Recovery history export failed:", e);
      Alert.alert(pt ? "Falha na exportação" : "Export failed", pt ? "Não foi possível exportar o histórico." : "The history could not be exported.");
    } finally { setExporting(false); }
  };
  return <SafeAreaView style={s.screen} edges={["bottom"]}>
    <ScrollView contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.link}>{pt ? "‹ Voltar ao histórico" : "‹ Back to History"}</Text></Pressable>
      <Text style={[s.heading, { marginTop: 18 }]}>{pt ? "Histórico de dor e recuperação" : "Pain & Recovery History"}</Text>
      <Text style={s.sub}>{pt ? "Interrupções, avaliações de dor e recuperação guardadas neste dispositivo. As notas médicas são privadas e não entram nas análises." : "Aborts, pain assessments and recovery saved on this device. Medical notes are private and excluded from analytics."}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {kinds.map(k => <Pressable key={k.value} onPress={() => { setFilter(k.value); setExpanded(null); setShowPrivate(null); }} style={[s.chip, filter === k.value && s.chipActive]} accessibilityRole="button"><Text style={[s.chipText, filter === k.value && s.chipTextActive]}>{pt ? k.pt : k.en}</Text></Pressable>)}
      </ScrollView>
      <View style={s.exportBox}>
        <Text style={s.title}>{pt ? "Exportar histórico" : "Export history"}</Text>
        <Text style={s.meta}>{pt ? "Escolha os registos e o formato." : "Choose records and format."}</Text>
        <View style={s.exportRow}>
          {(["all", "filtered"] as const).map(scope => <Pressable key={scope} accessibilityRole="radio" accessibilityState={{ checked: exportScope === scope }}
            onPress={() => setExportScope(scope)} style={[s.chip, exportScope === scope && s.chipActive]}>
            <Text style={[s.chipText, exportScope === scope && s.chipTextActive]}>{scope === "all" ? (pt ? "Todo o histórico" : "Complete history") : (pt ? "Categoria selecionada" : "Selected category")}</Text>
          </Pressable>)}
        </View>
        <View style={s.privateRow}>
          <Text style={[s.body, { flex: 1, marginTop: 0 }]}>{pt ? "Incluir tratamento e notas médicas privadas" : "Include private medical treatment and notes"}</Text>
          <Switch value={includePrivate} onValueChange={setIncludePrivate} accessibilityLabel={pt ? "Incluir dados médicos privados" : "Include private medical details"} />
        </View>
        <Text style={s.meta}>{pt ? "Atenção: os ficheiros exportados podem conter informações de saúde pessoais." : "Caution: exported files may contain personal health information."}</Text>
        <Text style={s.meta}>{pt ? "Registos a exportar" : "Records to export"}: {exportCount}</Text>
        <View style={s.exportRow}>
          {(["pdf", "html", "txt"] as WorkoutExportFormat[]).map(format => <Pressable key={format} accessibilityRole="button"
            disabled={loading || error || exporting || exportCount === 0} onPress={() => void handleExport(format)}
            style={[s.exportButton, (loading || error || exporting || exportCount === 0) && { opacity: 0.45 }]}>
            <Text style={s.exportText}>{format.toUpperCase()}</Text>
          </Pressable>)}
        </View>
        {exporting && <ActivityIndicator color={palette.primary} />}
      </View>
      {loading ? <ActivityIndicator color={palette.primary}/> : error ? <Text style={s.body}>{pt ? "Não foi possível carregar o histórico." : "Unable to load history."}</Text> : visible.length === 0 ? <Text style={s.body}>{pt ? "Ainda não existem registos nesta categoria." : "No records in this category yet."}</Text> : visible.map(item => <View key={item.id} style={s.card}>
        <Pressable onPress={() => { setExpanded(expanded === item.id ? null : item.id); setShowPrivate(null); }} accessibilityRole="button">
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.meta}>{new Date(item.time).toLocaleString(pt ? "pt-PT" : "en-GB")}</Text>
          <Text style={s.body}>{item.summary}</Text>
          <Text style={s.link}>{expanded === item.id ? (pt ? "Ocultar detalhes" : "Hide details") : (pt ? "Ver detalhes" : "View details")}</Text>
        </Pressable>
        {expanded === item.id && <View>
          {item.details.map((line, index) => <Text key={index} style={s.body}>{line}</Text>)}
          {!!item.privateDetails && <Pressable onPress={() => setShowPrivate(showPrivate === item.id ? null : item.id)} accessibilityRole="button"><Text style={s.link}>{showPrivate === item.id ? (pt ? "Ocultar notas privadas" : "Hide private notes") : (pt ? "Mostrar tratamento e notas privadas" : "Show treatment and private notes")}</Text></Pressable>}
          {showPrivate === item.id && item.privateDetails?.map((line, index) => <Text key={index} style={s.body}>{line}</Text>)}
        </View>}
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}

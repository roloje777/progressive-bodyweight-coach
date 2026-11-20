import { abortReasonLabel, abortStageLabel } from "@/utils/abortPresentation";
import { getAbortAttempts } from "@/storage/abortAttemptStorage";
import { WorkoutStatus } from "@/models/WorkoutStatus";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { getWorkoutHistory } from "../../storage/workoutStorage";
import { exportWorkoutHistorySummary, type WorkoutHistoryCategory } from "@/utils/workoutHistorySummaryExport";
import type { WorkoutExportFormat } from "@/utils/workoutExport";
import { CompletedSession } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";
import { useAppStyles } from "../../styles/appStyles";
import { useAppPalette, AppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
import { formatLocalizedDate, formatLocalizedTime } from "@/utils/localizedDate";
import { localizeHistoryText, localizeWeek, localizeDay, localizeCount } from "@/i18n/historyPresentation";
import {
  getWorkoutStatusPresentation,
  WorkoutStatusTone,
} from "../../utils/workoutPresentation";

const STATUS_COLORS: Record<WorkoutStatusTone, { background: string; border: string; text: string }> = {
  aborted: { background: "#3B2323", border: "#E57373", text: "#FFCDD2" },
  normal: { background: "#243125", border: "#4CAF50", text: "#A5D6A7" },
  repeat: { background: "#332F1D", border: "#FFD700", text: "#FFE66D" },
  deload: { background: "#33291D", border: "#FF9800", text: "#FFCC80" },
  recovery: { background: "#1D2D33", border: "#4FC3F7", text: "#81D4FA" },
  verification: { background: "#29233A", border: "#9575CD", text: "#D1C4E9" },
  maintenance: { background: "#21312D", border: "#26A69A", text: "#80CBC4" },
};

function formatDuration(seconds?: number) {
  const total = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)} min`;
}

function formatDate(timestamp: number, language: "en" | "pt-PT") {
  return formatLocalizedDate(timestamp, language, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatClockTime(timestamp: number, language: "en" | "pt-PT") {
  return formatLocalizedTime(timestamp, language, { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { language, workoutTitle: localizeWorkoutTitle } = useTranslation();
  const historyStyles = createHistoryStyles(palette);
  const statusColorsByTone: Record<WorkoutStatusTone, { background: string; border: string; text: string }> = {
    ...STATUS_COLORS,
    repeat: { background: palette.surfaceAlt, border: palette.primary, text: palette.primary },
    recovery: { background: palette.surfaceAlt, border: palette.info, text: palette.info },
    aborted: { background: "#3B2323", border: "#E57373", text: "#FFCDD2" },
  normal: { background: palette.surfaceAlt, border: palette.accent, text: palette.accent },
  };
  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [filter, setFilter] = useState<WorkoutHistoryCategory>("all");
  const [exportScope, setExportScope] = useState<"all" | "filtered">("all");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
    const [data, aborted] = await Promise.all([getWorkoutHistory(), getAbortAttempts()]);
    const abortedSessions: CompletedSession[] = aborted.map(a => ({
      attemptId: a.attemptId, abortAttempt: a, status: WorkoutStatus.Aborted,
      programId: a.programId, dayId: a.dayId, weekIndex: a.weekIndex, dayIndex: a.dayIndex,
      completedAt: a.recordedAt, startWorkoutTime: a.startWorkoutTime,
      endWorkoutTime: a.endWorkoutTime, workoutDuration: a.durationSeconds,
      timeUnderTension: 0, exercises: a.completedExercises as CompletedSession["exercises"],
      trainingMode: a.trainingMode as CompletedSession["trainingMode"],
      workoutReason: a.workoutReason as CompletedSession["workoutReason"],
      warmup: {completed:a.completedWarmup,skipped:a.skippedWarmup,sectionSkipped:false},
      stretch: {completed:a.completedStretch,skipped:a.skippedStretch,sectionSkipped:false},
    }));
    setHistory([...data,...abortedSessions].sort((a,b)=>b.endWorkoutTime-a.endWorkoutTime));
    } catch (error) {
      console.error("Workout history load failed", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const categories: Array<{ id: WorkoutHistoryCategory; en: string; pt: string }> = [
    { id: "all", en: "All", pt: "Tudo" },
    { id: "normal", en: "Normal", pt: "Normal" },
    { id: "aborted", en: "Aborted", pt: "Interrompido" },
    { id: "deload", en: "Deload", pt: "Deload" },
    { id: "verification", en: "Verification", pt: "Verificação" },
    { id: "recovery", en: "Pain Recovery", pt: "Recuperação da dor" },
    { id: "repeat", en: "Repeat", pt: "Repetição" },
    { id: "maintenance", en: "Maintenance", pt: "Manutenção" },
  ];
  // Baseline is intentionally not inferred: CompletedSession has no baseline marker.
  const categoryFor = (item: CompletedSession): WorkoutHistoryCategory =>
    getWorkoutStatusPresentation(item, programs.find(p => p.id === item.programId)).tone;
  const visibleHistory = history.filter(item => filter === "all" || categoryFor(item) === filter);
  const exportCount = exportScope === "all" ? history.length : visibleHistory.length;
  const handleExport = async (format: WorkoutExportFormat) => {
    if (exporting || loading || loadError || exportCount === 0) return;
    setExporting(true);
    try {
      await exportWorkoutHistorySummary(history, exportScope === "all" ? "all" : filter, language === "pt-PT", format);
    } catch (error) {
      console.error("Workout history summary export failed", error);
      Alert.alert(language === "pt-PT" ? "Falha na exportação" : "Export failed",
        language === "pt-PT" ? "Não foi possível exportar o resumo." : "Could not export the history summary.");
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item }: { item: CompletedSession }) => {
    const program = programs.find((candidate) => candidate.id === item.programId);
    const configuredDay = program?.days.find((candidate) => candidate.id === item.dayId);
    const totalSets = item.exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0,
    );
    const status = getWorkoutStatusPresentation(item, program);
    const statusColors = statusColorsByTone[status.tone];
    const weekLabel = item.weekIndex != null ? localizeWeek(language, item.weekIndex + 1) : (language === "pt-PT" ? "Semana —" : "Week —");
    const dayLabel = item.dayIndex != null ? localizeDay(language, item.dayIndex + 1) : item.dayId;
    const workoutTitle = localizeWorkoutTitle(configuredDay?.title ?? item.dayId);
    const programLabel = localizeWorkoutTitle(program?.level ?? program?.name ?? item.programId.toUpperCase());

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/screens/workoutDetail",
            params: { workout: JSON.stringify(item) },
          })
        }
        style={({ pressed }) => [historyStyles.cardPressable, pressed && { opacity: 0.82 }]}
      >
        <View style={historyStyles.card}>
          <View style={historyStyles.cardTopRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={historyStyles.date}>{formatDate(item.startWorkoutTime, language)}</Text>
              <Text style={historyStyles.time}>{formatClockTime(item.startWorkoutTime, language)}</Text>
            </View>
            <View
              style={[
                historyStyles.statusBadge,
                { backgroundColor: statusColors.background, borderColor: statusColors.border },
              ]}
            >
              <Text style={[historyStyles.statusText, { color: statusColors.text }]}>
                {item.abortAttempt ? (language === "pt-PT" ? "INTERROMPIDO" : "ABORTED") : localizeHistoryText(language, status.label)}
              </Text>
            </View>
          </View>

          <View style={historyStyles.divider} />

          <View style={historyStyles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={historyStyles.programLabel}>
                {programLabel}
              </Text>
              <Text style={historyStyles.workoutTitle}>{workoutTitle}</Text>
              <Text style={historyStyles.positionText}>{weekLabel} · {dayLabel}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={26} color="#777" />
          </View>

          {item.abortAttempt && <Text style={{color:palette.text,marginBottom:8}}>
            {language === "pt-PT" ? "Motivo" : "Reason"}: {abortReasonLabel(item.abortAttempt.reason, language)} · {item.abortAttempt.completionPercent}%
          </Text>}
          <View style={historyStyles.statsRow}>
            <View style={historyStyles.statItem}>
              <MaterialIcons name="fitness-center" size={16} color="#aaa" />
              <Text style={historyStyles.statText}>{localizeCount(language, totalSets, "set", "sets", "série", "séries")}</Text>
            </View>
            <View style={historyStyles.statItem}>
              <MaterialIcons name="schedule" size={16} color="#aaa" />
              <Text style={historyStyles.statText}>{formatDuration(item.workoutDuration)}</Text>
            </View>
            <View style={historyStyles.statItem}>
              <MaterialIcons name="format-list-numbered" size={16} color="#aaa" />
              <Text style={historyStyles.statText}>
                {localizeCount(language, item.exercises.length, "exercise", "exercises", "exercício", "exercícios")}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <View style={historyStyles.screenContent}>
          <Text style={styles.title}>{localizeHistoryText(language, "Workout History")}</Text>
          <Text style={historyStyles.subtitle}>
            {localizeHistoryText(language, "Your training timeline, including recovery and lifecycle workouts.")}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/screens/recoveryHistory")}
            style={[historyStyles.exportBox, { marginBottom: 12 }]}
          >
            <Text style={{ color: palette.text, fontWeight: "700" }}>
              {language === "pt-PT" ? "Histórico de dor e recuperação ›" : "Pain & Recovery History ›"}
            </Text>
          </Pressable>

          <View style={historyStyles.controls}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={historyStyles.filterRow}>
              {categories.map(category => (
                <Pressable key={category.id} accessibilityRole="button"
                  accessibilityState={{ selected: filter === category.id }}
                  onPress={() => setFilter(category.id)}
                  style={[historyStyles.chip, filter === category.id && historyStyles.chipActive]}>
                  <Text style={[historyStyles.chipText, filter === category.id && historyStyles.chipTextActive]}>
                    {language === "pt-PT" ? category.pt : category.en}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={historyStyles.exportBox}>
              <Text style={historyStyles.exportHeading}>{language === "pt-PT" ? "Exportar resumo do histórico" : "Export history summary"}</Text>
              <View style={historyStyles.filterRow}>
                {(["all", "filtered"] as const).map(scope => (
                  <Pressable key={scope} accessibilityRole="radio" accessibilityState={{ checked: exportScope === scope }}
                    onPress={() => setExportScope(scope)}
                    style={[historyStyles.chip, exportScope === scope && historyStyles.chipActive]}>
                    <Text style={[historyStyles.chipText, exportScope === scope && historyStyles.chipTextActive]}>
                      {scope === "all" ? (language === "pt-PT" ? "Todo o histórico" : "Complete history")
                        : (language === "pt-PT" ? "Categoria selecionada" : "Selected category")}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={historyStyles.exportMeta}>{language === "pt-PT" ? "Treinos a exportar" : "Workouts to export"}: {exportCount}</Text>
              <View style={historyStyles.filterRow}>
                {(["pdf", "html", "txt"] as WorkoutExportFormat[]).map(format => (
                  <Pressable key={format} accessibilityRole="button"
                    disabled={loading || loadError || exporting || exportCount === 0}
                    onPress={() => void handleExport(format)}
                    style={[historyStyles.exportButton, (loading || loadError || exporting || exportCount === 0) && { opacity: 0.45 }]}>
                    <Text style={historyStyles.chipText}>{format.toUpperCase()}</Text>
                  </Pressable>
                ))}
                {exporting && <ActivityIndicator color={palette.primary} />}
              </View>
            </View>
          </View>
          <FlatList
            data={visibleHistory}
            keyExtractor={(item, index) =>
              `${item.programId}-${item.weekIndex ?? "x"}-${item.dayIndex ?? item.dayId}-${item.trainingMode ?? "normal"}-${item.completedAt}-${index}`
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={visibleHistory.length ? historyStyles.listContent : historyStyles.emptyList}
            ListEmptyComponent={
              <View style={historyStyles.emptyState}>
                <MaterialIcons name="history" size={42} color="#666" />
                <Text style={historyStyles.emptyTitle}>{loadError
                  ? (language === "pt-PT" ? "Erro ao carregar histórico" : "Unable to load history")
                  : loading ? (language === "pt-PT" ? "A carregar..." : "Loading...")
                  : filter !== "all" ? (language === "pt-PT" ? "Sem treinos nesta categoria" : "No workouts in this category")
                  : localizeHistoryText(language, "No workouts yet")}</Text>
                {!loading && !loadError && filter === "all" && <Text style={historyStyles.emptyText}>
                  {localizeHistoryText(language, "Completed workouts and recovery sessions will appear here.")}
                </Text>}
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const createHistoryStyles = (palette: AppPalette) => StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    backgroundColor: palette.background,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: -12,
    marginBottom: 18,
  },
  controls: { marginBottom: 12 },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  chip: { borderColor: palette.border, borderWidth: 1, borderRadius: 10, backgroundColor: palette.surface,
    paddingHorizontal: 12, paddingVertical: 9 },
  chipActive: { borderColor: palette.primary, backgroundColor: palette.surfaceAlt },
  chipText: { color: palette.text, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: palette.primary },
  exportBox: { borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: palette.surface,
    padding: 12, marginTop: 10 },
  exportHeading: { color: palette.text, fontWeight: "800", fontSize: 15, marginBottom: 6 },
  exportMeta: { color: palette.textMuted, fontSize: 12, marginVertical: 6 },
  exportButton: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 15,
    paddingVertical: 10, backgroundColor: palette.background },
  listContent: { paddingBottom: 28 },
  emptyList: { flexGrow: 1 },
  cardPressable: { marginBottom: 14 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center" },
  date: { color: palette.text, fontSize: 14, fontWeight: "700" },
  time: { color: palette.textMuted, fontSize: 12, marginTop: 3 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.65 },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: 13 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  programLabel: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  workoutTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  positionText: { color: palette.textMuted, fontSize: 13, marginTop: 5 },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statText: { color: palette.textMuted, fontSize: 12, fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  emptyTitle: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 12 },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 19, marginTop: 6 },
});

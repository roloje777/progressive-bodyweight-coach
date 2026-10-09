import { abortReasonLabel, abortStageLabel } from "@/utils/abortPresentation";
import { getAbortAttempts } from "@/storage/abortAttemptStorage";
import { WorkoutStatus } from "@/models/WorkoutStatus";
import React, { useCallback, useState } from "react";
import {
  FlatList,
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

  const loadHistory = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

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

          <FlatList
            data={history}
            keyExtractor={(item, index) =>
              `${item.programId}-${item.weekIndex ?? "x"}-${item.dayIndex ?? item.dayId}-${item.trainingMode ?? "normal"}-${item.completedAt}-${index}`
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={history.length ? historyStyles.listContent : historyStyles.emptyList}
            ListEmptyComponent={
              <View style={historyStyles.emptyState}>
                <MaterialIcons name="history" size={42} color="#666" />
                <Text style={historyStyles.emptyTitle}>{localizeHistoryText(language, "No workouts yet")}</Text>
                <Text style={historyStyles.emptyText}>
                  {localizeHistoryText(language, "Completed workouts and recovery sessions will appear here.")}
                </Text>
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

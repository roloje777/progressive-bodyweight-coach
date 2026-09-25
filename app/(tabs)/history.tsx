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
import {
  getWorkoutStatusPresentation,
  WorkoutStatusTone,
} from "../../utils/workoutPresentation";

const STATUS_COLORS: Record<WorkoutStatusTone, { background: string; border: string; text: string }> = {
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

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatClockTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const styles = useAppStyles();
  const [history, setHistory] = useState<CompletedSession[]>([]);

  const loadHistory = useCallback(async () => {
    const data = await getWorkoutHistory();
    setHistory([...data].reverse());
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
    const statusColors = STATUS_COLORS[status.tone];
    const weekLabel = item.weekIndex != null ? `Week ${item.weekIndex + 1}` : "Week —";
    const dayLabel = item.dayIndex != null ? `Day ${item.dayIndex + 1}` : item.dayId;
    const workoutTitle = configuredDay?.title ?? item.dayId;

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
              <Text style={historyStyles.date}>{formatDate(item.startWorkoutTime)}</Text>
              <Text style={historyStyles.time}>{formatClockTime(item.startWorkoutTime)}</Text>
            </View>
            <View
              style={[
                historyStyles.statusBadge,
                { backgroundColor: statusColors.background, borderColor: statusColors.border },
              ]}
            >
              <Text style={[historyStyles.statusText, { color: statusColors.text }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={historyStyles.divider} />

          <View style={historyStyles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={historyStyles.programLabel}>
                {program?.level ?? program?.name ?? item.programId.toUpperCase()}
              </Text>
              <Text style={historyStyles.workoutTitle}>{workoutTitle}</Text>
              <Text style={historyStyles.positionText}>{weekLabel} · {dayLabel}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={26} color="#777" />
          </View>

          <View style={historyStyles.statsRow}>
            <View style={historyStyles.statItem}>
              <MaterialIcons name="fitness-center" size={16} color="#aaa" />
              <Text style={historyStyles.statText}>{totalSets} sets</Text>
            </View>
            <View style={historyStyles.statItem}>
              <MaterialIcons name="schedule" size={16} color="#aaa" />
              <Text style={historyStyles.statText}>{formatDuration(item.workoutDuration)}</Text>
            </View>
            <View style={historyStyles.statItem}>
              <MaterialIcons name="format-list-numbered" size={16} color="#aaa" />
              <Text style={historyStyles.statText}>
                {item.exercises.length} exercise{item.exercises.length === 1 ? "" : "s"}
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
          <Text style={styles.title}>Workout History</Text>
          <Text style={historyStyles.subtitle}>
            Your training timeline, including recovery and lifecycle workouts.
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
                <Text style={historyStyles.emptyTitle}>No workouts yet</Text>
                <Text style={historyStyles.emptyText}>
                  Completed workouts and recovery sessions will appear here.
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const historyStyles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    backgroundColor: "#111",
  },
  subtitle: {
    color: "#999",
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
    backgroundColor: "#1D1D1D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    padding: 16,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center" },
  date: { color: "#F5F5F5", fontSize: 14, fontWeight: "700" },
  time: { color: "#888", fontSize: 12, marginTop: 3 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.65 },
  divider: { height: 1, backgroundColor: "#303030", marginVertical: 13 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  programLabel: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  workoutTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  positionText: { color: "#AAA", fontSize: 13, marginTop: 5 },
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
    backgroundColor: "#272727",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statText: { color: "#C7C7C7", fontSize: 12, fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  emptyTitle: { color: "#FFF", fontSize: 18, fontWeight: "800", marginTop: 12 },
  emptyText: { color: "#888", textAlign: "center", lineHeight: 19, marginTop: 6 },
});

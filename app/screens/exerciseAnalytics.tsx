import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AnalyticsLineChart } from "@/components/analytics/AnalyticsLineChart";
import { AnalyticsMetric, formatTrend } from "@/components/analytics/AnalyticsMetric";
import { AnalyticsRangeSelector } from "@/components/analytics/AnalyticsRangeSelector";
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { useExerciseAnalyticsDetail } from "@/hooks/useExerciseAnalyticsDetail";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { CompletedSession } from "@/models/WorkoutLog";
import { appTokens } from "@/styles/appStyles";
import { formatAnalyticsDuration } from "@/utils/analyticsFormatting";

const VALID_RANGES: AnalyticsTimeRange[] = ["4w", "12w", "6m", "1y", "all"];

function parseRange(value: string | string[] | undefined): AnalyticsTimeRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_RANGES.includes(candidate as AnalyticsTimeRange)
    ? (candidate as AnalyticsTimeRange)
    : "12w";
}

function formatValue(value: number | null, unit: "reps" | "seconds" | null) {
  if (value == null) return "—";
  return unit === "seconds" ? `${Math.round(value)}s` : `${Math.round(value)}`;
}

function formatPercent(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";
}

function effortTrendLabel(trend: ReturnType<typeof formatTrend>) {
  if (trend.label.includes("Improving")) return { ...trend, label: "↓ Getting easier" };
  if (trend.label.includes("Declining")) return { ...trend, label: "↑ Feeling harder" };
  return trend;
}

function openWorkout(workout: CompletedSession) {
  router.push({
    pathname: "/screens/workoutDetail",
    params: { workout: JSON.stringify(workout) },
  });
}

export default function ExerciseAnalyticsScreen() {
  const params = useLocalSearchParams();
  const exerciseId = Array.isArray(params.exerciseId) ? params.exerciseId[0] : params.exerciseId;
  const [range, setRange] = useState<AnalyticsTimeRange>(() => parseRange(params.range));

  const safeExerciseId = exerciseId ?? "";
  const { analytics, recentSessions, isLoaded } = useExerciseAnalyticsDetail(safeExerciseId, range);
  const exercise = safeExerciseId ? exerciseRegistry[safeExerciseId] : undefined;
  const performanceTrend = formatTrend(analytics.performanceTrend);
  const effortTrend = effortTrendLabel(formatTrend(analytics.effortTrend));

  const chartPoints = analytics.sessionsPerformed
    ? analytics.personalBests.length > 1
      ? analytics.personalBests.map((point) => ({
          label: formatDate(point.completedAt).replace(/\s\d{4}$/, ""),
          value: point.value,
        }))
      : []
    : [];

  const historyPoints = useMemo(() => {
    const values: Array<{ label: string; value: number | null }> = [];
    for (const session of [...recentSessions].reverse()) {
      const completedExercise = session.exercises.find((item) => item.exerciseId === safeExerciseId);
      if (!completedExercise) continue;
      const setValues = completedExercise.sets
        .filter((set) => set.status !== "skipped" && set.excludeFromProgression !== true)
        .map((set) => {
          if (set.repsCompleted != null) return set.repsCompleted;
          if (set.repsLeft != null && set.repsRight != null) return (set.repsLeft + set.repsRight) / 2;
          if (set.durationSeconds != null) return set.durationSeconds;
          if (set.durationLeft != null && set.durationRight != null) return (set.durationLeft + set.durationRight) / 2;
          return null;
        })
        .filter((value): value is number => value != null);
      values.push({
        label: new Date(session.completedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        value: setValues.length ? Math.max(...setValues) : null,
      });
    }
    return values;
  }, [recentSessions, safeExerciseId]);

  if (!exerciseId) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>No exercise was selected.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={appTokens.colors.primary} />
          <Text style={styles.loadingText}>Building exercise analytics…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backTextButton}>
          <MaterialIcons name="arrow-back" size={19} color={appTokens.colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>EXERCISE ANALYTICS</Text>
            <Text style={styles.title}>{exercise?.name ?? exerciseId}</Text>
            <Text style={styles.subtitle}>
              Performance, progression evidence and recent training history.
            </Text>
          </View>
        </View>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        <AnalyticsCard title="Performance" subtitle="Best result across each completed session">
          <View style={styles.trendHeader}>
            <Text style={styles.largeValue}>{formatValue(analytics.bestPerformance, analytics.unit)}</Text>
            <Text style={[styles.trendText, { color: performanceTrend.color }]}>
              {performanceTrend.label}
            </Text>
          </View>
          <AnalyticsLineChart
            points={historyPoints}
            valueSuffix={analytics.unit === "seconds" ? "s" : ""}
          />
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Average" value={formatValue(analytics.averagePerformance, analytics.unit)} />
            <AnalyticsMetric
              label={analytics.unit === "seconds" ? "Total hold" : "Total reps"}
              value={
                analytics.unit === "seconds"
                  ? formatAnalyticsDuration(analytics.totalPerformance)
                  : formatValue(analytics.totalPerformance, analytics.unit)
              }
            />
            <AnalyticsMetric label="Sessions" value={`${analytics.sessionsPerformed}`} accent />
            <AnalyticsMetric
              label="Frequency"
              value={analytics.sessionsPerWeek == null ? "—" : `${analytics.sessionsPerWeek}/wk`}
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Progression evidence" subtitle="How this exercise is responding">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric
              label="Match or Beat"
              value={formatPercent(analytics.matchOrBeat.successRate)}
              helper={analytics.matchOrBeat.attempted ? `${analytics.matchOrBeat.successful}/${analytics.matchOrBeat.attempted} eligible targets` : "No eligible targets"}
              accent
            />
            <AnalyticsMetric
              label="Set drop-off"
              value={formatPercent(analytics.averageSetDropoffPercent)}
              helper="First set to final set"
            />
            <AnalyticsMetric
              label="Personal bests"
              value={`${analytics.personalBestCount}`}
            />
            <AnalyticsMetric
              label="Avg effort"
              value={analytics.averageEffortRating == null ? "—" : `${analytics.averageEffortRating}/3`}
              helper="😀 1 • 👍 2 • 😓 3"
            />
          </View>
          <View style={styles.effortRow}>
            <Text style={styles.effortLabel}>Effort trend</Text>
            <Text style={[styles.trendText, { color: effortTrend.color }]}>{effortTrend.label}</Text>
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Personal bests" subtitle="New best session performances">
          {analytics.personalBests.length ? (
            [...analytics.personalBests].reverse().slice(0, 5).map((pb, index) => (
              <View key={`${pb.completedAt}-${pb.value}`} style={[styles.listRow, index < Math.min(analytics.personalBests.length, 5) - 1 && styles.divider]}>
                <View>
                  <Text style={styles.listTitle}>{formatDate(pb.completedAt)}</Text>
                  <Text style={styles.listMeta}>New personal best</Text>
                </View>
                <Text style={styles.pbValue}>{formatValue(pb.value, analytics.unit)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Complete more sessions to build personal-best history.</Text>
          )}
          {chartPoints.length > 1 ? (
            <AnalyticsLineChart points={chartPoints} valueSuffix={analytics.unit === "seconds" ? "s" : ""} />
          ) : null}
        </AnalyticsCard>

        <AnalyticsCard title="Recent sessions" subtitle="Tap a session to open the full workout">
          {recentSessions.length ? (
            recentSessions.slice(0, 8).map((session, index) => {
              const completedExercise = session.exercises.find((item) => item.exerciseId === exerciseId);
              const completedSets = completedExercise?.sets.filter((set) => set.status !== "skipped").length ?? 0;
              return (
                <Pressable
                  key={`${session.completedAt}-${session.programId}-${session.dayId}`}
                  onPress={() => openWorkout(session)}
                  style={({ pressed }) => [styles.listRow, index < Math.min(recentSessions.length, 8) - 1 && styles.divider, pressed && styles.pressed]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{formatDate(session.completedAt)}</Text>
                    <Text style={styles.listMeta}>
                      {session.programId.toUpperCase()} • {completedSets} completed sets
                      {session.weekIndex != null ? ` • Week ${session.weekIndex + 1}` : ""}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={appTokens.colors.muted} />
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No sessions for this exercise in the selected period.</Text>
          )}
        </AnalyticsCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appTokens.colors.background },
  content: { padding: 18, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { color: appTokens.colors.muted },
  errorText: { color: appTokens.colors.danger, textAlign: "center" },
  backTextButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 8, marginBottom: 6 },
  backText: { color: appTokens.colors.text, fontSize: 14, fontWeight: "700" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  eyebrow: { color: appTokens.colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: appTokens.colors.text, fontSize: 27, fontWeight: "900", marginTop: 2 },
  subtitle: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  trendHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10 },
  largeValue: { color: appTokens.colors.primary, fontSize: 32, fontWeight: "900" },
  trendText: { fontSize: 13, fontWeight: "800" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  effortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#3A3A3A", paddingTop: 12, marginTop: 8 },
  effortLabel: { color: appTokens.colors.muted, fontSize: 12 },
  listRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#3A3A3A" },
  listTitle: { color: appTokens.colors.text, fontSize: 14, fontWeight: "700" },
  listMeta: { color: appTokens.colors.muted, fontSize: 11, marginTop: 3 },
  pbValue: { color: appTokens.colors.primary, fontSize: 18, fontWeight: "900" },
  emptyText: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 18, marginTop: 12 },
  pressed: { opacity: 0.7 },
});

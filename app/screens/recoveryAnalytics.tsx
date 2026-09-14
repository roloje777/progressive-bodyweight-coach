import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { useRecoveryAnalyticsDetail } from "@/hooks/useRecoveryAnalyticsDetail";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { appTokens } from "@/styles/appStyles";

const VALID_RANGES: AnalyticsTimeRange[] = ["4w", "12w", "6m", "1y", "all"];

function parseRange(value: string | string[] | undefined): AnalyticsTimeRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_RANGES.includes(candidate as AnalyticsTimeRange)
    ? (candidate as AnalyticsTimeRange)
    : "12w";
}

function formatRating(value: number | null) {
  return value == null ? "—" : value.toFixed(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";
}

function signalLabel(signal: string) {
  switch (signal) {
    case "joint-discomfort":
      return "Joint discomfort";
    case "low-energy":
      return "Low energy";
    case "form-breakdown":
      return "Form breakdown";
    case "couldnt-finish":
      return "Couldn't finish";
    default:
      return signal;
  }
}

function modeLabel(mode: string) {
  switch (mode) {
    case "normal":
      return "Normal training";
    case "deload-fatigue":
      return "Fatigue deload";
    case "deload-pain":
      return "Pain deload";
    case "deload-form":
      return "Form deload";
    case "deload-recovery":
      return "Recovery deload";
    case "verification":
      return "Verification";
    default:
      return mode;
  }
}

function feedbackLabel(tag: string) {
  return signalLabel(tag)
    .replace("perfect-difficulty", "Perfect difficulty")
    .replace("good-pump", "Good pump")
    .replace("great-focus", "Great focus")
    .replace("could-do-more", "Could do more")
    .replace("too-easy", "Too easy");
}

export default function RecoveryAnalyticsScreen() {
  const params = useLocalSearchParams();
  const [range, setRange] = useState<AnalyticsTimeRange>(() => parseRange(params.range));
  const { analytics, sessionByIdentity, isLoaded } = useRecoveryAnalyticsDetail(range);
  const recoveryTrend = formatTrend(analytics.recoveryTrend);
  const ratingTrend = formatTrend(analytics.ratingTrend);

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={appTokens.colors.primary} />
          <Text style={styles.loadingText}>Building recovery analytics…</Text>
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

        <Text style={styles.eyebrow}>RECOVERY & FATIGUE</Text>
        <Text style={styles.title}>Recovery Evidence</Text>
        <Text style={styles.subtitle}>
          Historical training signals that help explain workload tolerance and recovery. This is training guidance, not medical diagnosis.
        </Text>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        <AnalyticsCard title="Recovery overview" subtitle="Feedback and recovery signals in the selected period">
          <View style={styles.trendHeader}>
            <Text style={styles.largeValue}>{formatRating(analytics.averageWorkoutRating)}</Text>
            <Text style={[styles.trendText, { color: recoveryTrend.color }]}>{recoveryTrend.label}</Text>
          </View>
          <Text style={styles.helperText}>Average workout rating • {analytics.workoutsConsidered} workouts</Text>
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Pain reports" value={`${analytics.painOccurrences}`} />
            <AnalyticsMetric label="Low energy" value={`${analytics.lowEnergyOccurrences}`} />
            <AnalyticsMetric label="Form breakdown" value={`${analytics.formBreakdownOccurrences}`} />
            <AnalyticsMetric label="Couldn't finish" value={`${analytics.couldntFinishOccurrences}`} />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Workout rating trend" subtitle="How subjective workout ratings changed over time">
          <View style={styles.trendHeaderSmall}>
            <Text style={styles.sectionValue}>{formatRating(analytics.averageWorkoutRating)}</Text>
            <Text style={[styles.trendText, { color: ratingTrend.color }]}>{ratingTrend.label}</Text>
          </View>
          <AnalyticsLineChart
            points={analytics.weekly.map((point) => ({ label: point.label, value: point.averageRating }))}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Recovery signal burden" subtitle="Lower signal burden over time is interpreted as improving recovery">
          <AnalyticsLineChart
            points={analytics.weekly.map((point) => ({ label: point.label, value: point.signalBurden }))}
          />
          <Text style={styles.helperText}>
            Signal burden counts pain, low-energy, form-breakdown and couldn't-finish reports. It is not a medical score.
          </Text>
        </AnalyticsCard>

        <AnalyticsCard title="Signal breakdown" subtitle="Which recovery/fatigue signals appeared most often">
          {analytics.signals.some((item) => item.count > 0) ? (
            analytics.signals.map((item, index) => (
              <View key={item.signal} style={[styles.listRow, index < analytics.signals.length - 1 && styles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{signalLabel(item.signal)}</Text>
                  <Text style={styles.listMeta}>Historical workout feedback</Text>
                </View>
                <Text style={styles.countValue}>{item.count}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No negative recovery or fatigue signals were recorded in this period.</Text>
          )}
        </AnalyticsCard>

        <AnalyticsCard title="Recovery phases" subtitle="Deload and verification exposure in this period">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Deload workouts" value={`${analytics.deloadWorkoutCount}`} accent />
            <AnalyticsMetric label="Verification" value={`${analytics.verificationWorkoutCount}`} />
            <AnalyticsMetric label="Total signals" value={`${analytics.totalSignalOccurrences}`} />
          </View>
          {analytics.modes.length ? (
            <View style={styles.modeList}>
              {analytics.modes.map((item, index) => (
                <View key={item.mode} style={[styles.listRow, index < analytics.modes.length - 1 && styles.divider]}>
                  <Text style={[styles.listTitle, { flex: 1 }]}>{modeLabel(item.mode)}</Text>
                  <Text style={styles.countValue}>{item.count}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </AnalyticsCard>

        <AnalyticsCard title="Recent workouts" subtitle="Tap a workout to see the underlying training record">
          {analytics.recentWorkouts.length ? (
            analytics.recentWorkouts.map((item, index) => {
              const identity = `${item.completedAt}|${item.programId}|${item.dayId}`;
              const workout = sessionByIdentity.get(identity);
              return (
                <Pressable
                  key={`${identity}-${index}`}
                  disabled={!workout}
                  onPress={() =>
                    workout &&
                    router.push({
                      pathname: "/screens/workoutDetail",
                      params: { workout: JSON.stringify(workout) },
                    })
                  }
                  style={({ pressed }) => [
                    styles.recentRow,
                    index < analytics.recentWorkouts.length - 1 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{formatDate(item.completedAt)}</Text>
                    <Text style={styles.listMeta}>
                      {modeLabel(item.trainingMode)} • Rating {item.rating == null ? "—" : item.rating.toFixed(1)}
                    </Text>
                    {item.tags.length ? (
                      <Text style={styles.tagsText}>{item.tags.map(feedbackLabel).join(" • ")}</Text>
                    ) : (
                      <Text style={styles.tagsText}>No feedback tags recorded</Text>
                    )}
                  </View>
                  <View style={styles.recentRight}>
                    {item.signalBurden > 0 ? (
                      <Text style={styles.signalCount}>{item.signalBurden} signal{item.signalBurden === 1 ? "" : "s"}</Text>
                    ) : (
                      <Text style={styles.clearText}>Clear</Text>
                    )}
                    <MaterialIcons name="chevron-right" size={22} color={appTokens.colors.muted} />
                  </View>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No workouts are available in the selected period.</Text>
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
  backTextButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 8, marginBottom: 10 },
  backText: { color: appTokens.colors.text, fontSize: 14, fontWeight: "700" },
  eyebrow: { color: appTokens.colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: appTokens.colors.text, fontSize: 28, fontWeight: "900", marginTop: 2 },
  subtitle: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 16 },
  trendHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10 },
  trendHeaderSmall: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  largeValue: { color: appTokens.colors.primary, fontSize: 32, fontWeight: "900" },
  sectionValue: { color: appTokens.colors.text, fontSize: 24, fontWeight: "900" },
  trendText: { fontSize: 13, fontWeight: "800" },
  helperText: { color: appTokens.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, marginTop: 8 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#3A3A3A" },
  pressed: { opacity: 0.65 },
  listTitle: { color: appTokens.colors.text, fontSize: 14, fontWeight: "700" },
  listMeta: { color: appTokens.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  tagsText: { color: appTokens.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  countValue: { color: appTokens.colors.primary, fontSize: 18, fontWeight: "900" },
  modeList: { marginTop: 8 },
  recentRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  signalCount: { color: appTokens.colors.primary, fontSize: 11, fontWeight: "800" },
  clearText: { color: appTokens.colors.muted, fontSize: 11, fontWeight: "700" },
  emptyText: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 18, marginTop: 10 },
});

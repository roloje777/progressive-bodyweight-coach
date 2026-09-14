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
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { useMatchOrBeatAnalyticsDetail } from "@/hooks/useMatchOrBeatAnalyticsDetail";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { MatchOrBeatExclusionReason } from "@/models/analytics/MatchOrBeatDetailAnalytics";
import { appTokens } from "@/styles/appStyles";

const VALID_RANGES: AnalyticsTimeRange[] = ["4w", "12w", "6m", "1y", "all"];

function parseRange(value: string | string[] | undefined): AnalyticsTimeRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_RANGES.includes(candidate as AnalyticsTimeRange)
    ? (candidate as AnalyticsTimeRange)
    : "12w";
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

function exclusionLabel(reason: MatchOrBeatExclusionReason) {
  switch (reason) {
    case "deload":
      return "Deload exposure";
    case "low-rating":
      return "Low workout rating";
    case "joint-discomfort":
      return "Joint discomfort";
    case "form-breakdown":
      return "Form breakdown";
    case "low-energy":
      return "Low energy";
    case "excluded-set":
      return "Set excluded from progression";
  }
}

function statusLabel(status: "exceeded" | "matched" | "missed" | "excluded") {
  if (status === "exceeded") return { label: "Exceeded", color: appTokens.colors.accent };
  if (status === "matched") return { label: "Matched", color: appTokens.colors.primary };
  if (status === "missed") return { label: "Missed", color: appTokens.colors.danger };
  return { label: "Excluded", color: appTokens.colors.muted };
}

function isTimeExercise(exerciseId: string) {
  const type = exerciseRegistry[exerciseId]?.type;
  return type === "hold" || type === "time";
}

function formatTargetValue(exerciseId: string, value: number) {
  return isTimeExercise(exerciseId) ? `${Math.round(value)}s` : `${Math.round(value)}`;
}

export default function MatchOrBeatAnalyticsScreen() {
  const params = useLocalSearchParams();
  const [range, setRange] = useState<AnalyticsTimeRange>(() => parseRange(params.range));
  const { analytics, isLoaded } = useMatchOrBeatAnalyticsDetail(range);
  const trend = formatTrend(analytics.trend);

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={appTokens.colors.primary} />
          <Text style={styles.loadingText}>Building Match-or-Beat analytics…</Text>
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

        <Text style={styles.eyebrow}>MATCH OR BEAT</Text>
        <Text style={styles.title}>Progression Evidence</Text>
        <Text style={styles.subtitle}>
          See which targets were exceeded, matched, missed or deliberately excluded from progression evidence.
        </Text>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        <AnalyticsCard title="Overall performance" subtitle="Eligible progression targets in the selected period">
          <View style={styles.trendHeader}>
            <Text style={styles.largeValue}>{formatPercent(analytics.successRate)}</Text>
            <Text style={[styles.trendText, { color: trend.color }]}>{trend.label}</Text>
          </View>
          <AnalyticsLineChart
            valueSuffix="%"
            points={analytics.weekly.map((point) => ({
              label: `W${point.weekIndex + 1}`,
              value: point.successRate,
            }))}
          />
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Eligible targets" value={`${analytics.eligibleTargets}`} accent />
            <AnalyticsMetric label="Successful" value={`${analytics.successfulTargets}`} />
            <AnalyticsMetric label="Missed" value={`${analytics.missed}`} />
            <AnalyticsMetric label="Excluded" value={`${analytics.excluded}`} helper="Not counted against success" />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Outcome breakdown" subtitle="How eligible targets were classified">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Exceeded" value={`${analytics.exceeded}`} accent />
            <AnalyticsMetric label="Matched" value={`${analytics.matched}`} />
            <AnalyticsMetric label="Missed" value={`${analytics.missed}`} />
            <AnalyticsMetric label="Excluded" value={`${analytics.excluded}`} />
          </View>
          <Text style={styles.explanation}>
            Success rate uses only eligible targets. Excluded performances stay in workout history but do not lower Match-or-Beat progression evidence.
          </Text>
        </AnalyticsCard>

        <AnalyticsCard title="By exercise" subtitle="Tap an exercise for its full performance analytics">
          {analytics.exercises.length ? (
            analytics.exercises.slice(0, 12).map((exercise, index) => {
              const name = exerciseRegistry[exercise.exerciseId]?.name ?? exercise.exerciseId;
              return (
                <Pressable
                  key={exercise.exerciseId}
                  onPress={() =>
                    router.push({
                      pathname: "/screens/exerciseAnalytics",
                      params: { exerciseId: exercise.exerciseId, range },
                    })
                  }
                  style={({ pressed }) => [
                    styles.listRow,
                    index < Math.min(analytics.exercises.length, 12) - 1 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{name}</Text>
                    <Text style={styles.listMeta}>
                      {exercise.successful}/{exercise.attempted} eligible targets
                      {exercise.excluded ? ` • ${exercise.excluded} excluded` : ""}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rateValue}>{formatPercent(exercise.successRate)}</Text>
                    <MaterialIcons name="chevron-right" size={22} color={appTokens.colors.muted} />
                  </View>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No Match-or-Beat evidence is available in this period yet.</Text>
          )}
        </AnalyticsCard>

        <AnalyticsCard title="Excluded evidence" subtitle="Why some performances were kept out of progression calculations">
          {analytics.exclusions.length ? (
            analytics.exclusions.map((item, index) => (
              <View
                key={item.reason}
                style={[styles.listRow, index < analytics.exclusions.length - 1 && styles.divider]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{exclusionLabel(item.reason)}</Text>
                  <Text style={styles.listMeta}>Retained in workout history</Text>
                </View>
                <Text style={styles.excludedCount}>{item.count}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No performances were excluded in the selected period.</Text>
          )}
        </AnalyticsCard>

        <AnalyticsCard title="Recent evidence" subtitle="Target-by-target progression evidence">
          {analytics.recentEvidence.length ? (
            analytics.recentEvidence.slice(0, 16).map((item, index) => {
              const status = statusLabel(item.status);
              const exerciseName = exerciseRegistry[item.exerciseId]?.name ?? item.exerciseId;
              return (
                <View
                  key={`${item.completedAt}-${item.exerciseId}-${item.setNumber}-${index}`}
                  style={[styles.evidenceRow, index < Math.min(analytics.recentEvidence.length, 16) - 1 && styles.divider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{exerciseName} • Set {item.setNumber}</Text>
                    <Text style={styles.listMeta}>
                      {formatDate(item.completedAt)} • Target {formatTargetValue(item.exerciseId, item.target)} • Actual {formatTargetValue(item.exerciseId, item.actual)}
                    </Text>
                    {item.exclusionReason ? (
                      <Text style={styles.exclusionReason}>{exclusionLabel(item.exclusionReason)}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Complete more comparable sets to build Match-or-Beat evidence.</Text>
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
  largeValue: { color: appTokens.colors.primary, fontSize: 32, fontWeight: "900" },
  trendText: { fontSize: 13, fontWeight: "800" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, marginTop: 8 },
  explanation: { color: appTokens.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  evidenceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#3A3A3A" },
  pressed: { opacity: 0.65 },
  listTitle: { color: appTokens.colors.text, fontSize: 14, fontWeight: "700" },
  listMeta: { color: appTokens.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 3 },
  rateValue: { color: appTokens.colors.primary, fontSize: 17, fontWeight: "900" },
  excludedCount: { color: appTokens.colors.muted, fontSize: 18, fontWeight: "900" },
  exclusionReason: { color: appTokens.colors.muted, fontSize: 11, fontStyle: "italic", marginTop: 3 },
  statusText: { fontSize: 12, fontWeight: "900", paddingTop: 2 },
  emptyText: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 18, marginTop: 10 },
});

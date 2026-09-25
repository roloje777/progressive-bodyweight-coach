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
import { AnalyticsMetric } from "@/components/analytics/AnalyticsMetric";
import { AnalyticsRangeSelector } from "@/components/analytics/AnalyticsRangeSelector";
import { useTrainingLoadAnalyticsDetail } from "@/hooks/useTrainingLoadAnalyticsDetail";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { useAppPalette } from "@/hooks/use-app-palette";
import { formatAnalyticsDuration } from "@/utils/analyticsFormatting";

const VALID_RANGES: AnalyticsTimeRange[] = ["4w", "12w", "6m", "1y", "all"];

function parseRange(value: string | string[] | undefined): AnalyticsTimeRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_RANGES.includes(candidate as AnalyticsTimeRange)
    ? (candidate as AnalyticsTimeRange)
    : "12w";
}


function formatWeek(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "";
}

export default function TrainingLoadAnalyticsScreen() {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  const params = useLocalSearchParams();
  const [range, setRange] = useState<AnalyticsTimeRange>(() => parseRange(params.range));
  const { analytics, isLoaded } = useTrainingLoadAnalyticsDetail(range);
  const maxBodyPartExposure = analytics.bodyParts[0]?.setExposures ?? 0;

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Building training-load analytics…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backTextButton}>
          <MaterialIcons name="arrow-back" size={19} color={palette.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>TRAINING LOAD</Text>
        <Text style={styles.title}>Load & Body Parts</Text>
        <Text style={styles.subtitle}>
          Work completed over time and where your training sets are being directed.
        </Text>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        <AnalyticsCard title="Work completed" subtitle="Selected training period">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Workouts" value={`${analytics.workoutsCompleted}`} />
            <AnalyticsMetric label="Working sets" value={`${analytics.workingSetsCompleted}`} accent />
            <AnalyticsMetric label="Total reps" value={`${Math.round(analytics.totalRepsCompleted)}`} />
            <AnalyticsMetric label="Hold time" value={formatAnalyticsDuration(analytics.totalHoldSeconds)} />
            <AnalyticsMetric label="Time under tension" value={formatAnalyticsDuration(analytics.totalTimeUnderTensionSeconds)} />
            <AnalyticsMetric
              label="Avg sets / workout"
              value={analytics.averageSetsPerWorkout == null ? "—" : `${analytics.averageSetsPerWorkout}`}
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Weekly working sets" subtitle="Completed sets by training week">
          <AnalyticsLineChart
            points={analytics.weekly.map((point) => ({
              label: formatWeek(point.weekStart),
              value: point.workingSets,
            }))}
          />
        </AnalyticsCard>

        <AnalyticsCard title="Time under tension" subtitle="Recorded workout TUT by week">
          <AnalyticsLineChart
            valueSuffix="m"
            points={analytics.weekly.map((point) => ({
              label: formatWeek(point.weekStart),
              value: Math.round((point.timeUnderTensionSeconds / 60) * 10) / 10,
            }))}
          />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average per workout</Text>
            <Text style={styles.summaryValue}>
              {formatAnalyticsDuration(analytics.averageTimeUnderTensionPerWorkoutSeconds)}
            </Text>
          </View>
        </AnalyticsCard>

        <AnalyticsCard
          title="Body-part exposure"
          subtitle="Completed set exposure from the exercises you performed"
        >
          {analytics.bodyParts.length ? (
            <>
              {analytics.bodyParts.map((item, index) => (
                <Pressable
                  key={item.bodyPart}
                  onPress={() =>
                    router.push({
                      pathname: "/screens/bodyPartAnalytics",
                      params: { bodyPart: item.bodyPart, range },
                    })
                  }
                  style={({ pressed }) => [
                    styles.bodyPartRow,
                    index < analytics.bodyParts.length - 1 && styles.divider,
                    pressed && styles.bodyPartRowPressed,
                  ]}
                >
                  <View style={styles.bodyPartHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bodyPartName}>{item.bodyPart}</Text>
                      <Text style={styles.bodyPartMeta}>
                        {item.sessions} session{item.sessions === 1 ? "" : "s"} • {item.exerciseCount} exercise{item.exerciseCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <View style={styles.bodyPartValueBlock}>
                      <Text style={styles.bodyPartValue}>{item.setExposures}</Text>
                      <Text style={styles.bodyPartUnit}>set exposures • {Math.round(item.sharePercent)}%</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={palette.primary} />
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${maxBodyPartExposure ? Math.max(6, (item.setExposures / maxBodyPartExposure) * 100) : 0}%` as `${number}%`,
                        },
                      ]}
                    />
                  </View>
                </Pressable>
              ))}
              <Text style={styles.explanation}>
                A compound set can count toward more than one body part. These are set exposures, not estimated muscle activation or a medical/physiological load score.
              </Text>
              {analytics.unmappedWorkingSets > 0 ? (
                <Text style={styles.unmappedText}>
                  {analytics.unmappedWorkingSets} working set{analytics.unmappedWorkingSets === 1 ? "" : "s"} could not be assigned to a body-part category.
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyText}>Complete workouts to build body-part exposure history.</Text>
          )}
        </AnalyticsCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof useAppPalette>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 18, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: palette.textMuted },
  backTextButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 8, marginBottom: 8 },
  backText: { color: palette.text, fontSize: 14, fontWeight: "700" },
  eyebrow: { color: palette.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: palette.text, fontSize: 28, fontWeight: "900", marginTop: 3 },
  subtitle: { color: palette.textMuted, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 14 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.surfaceAlt },
  summaryLabel: { color: palette.textMuted, fontSize: 12 },
  summaryValue: { color: palette.text, fontSize: 13, fontWeight: "800" },
  bodyPartRow: { paddingVertical: 12 },
  bodyPartRowPressed: { opacity: 0.72 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.surfaceAlt },
  bodyPartHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  bodyPartName: { color: palette.text, fontSize: 15, fontWeight: "800" },
  bodyPartMeta: { color: palette.textMuted, fontSize: 11, marginTop: 3 },
  bodyPartValueBlock: { alignItems: "flex-end" },
  bodyPartValue: { color: palette.primary, fontSize: 20, fontWeight: "900" },
  bodyPartUnit: { color: palette.textMuted, fontSize: 9 },
  barTrack: { height: 7, backgroundColor: palette.surfaceAlt, borderRadius: 4, overflow: "hidden", marginTop: 9 },
  barFill: { height: "100%", backgroundColor: palette.primary, borderRadius: 4 },
  explanation: { color: palette.textMuted, fontSize: 11, lineHeight: 16, marginTop: 12 },
  unmappedText: { color: palette.textMuted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  emptyText: { color: palette.textMuted, fontSize: 13, lineHeight: 18, marginTop: 8 },
});

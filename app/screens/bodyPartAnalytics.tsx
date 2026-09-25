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
import { AnalyticsMetric } from "@/components/analytics/AnalyticsMetric";
import { AnalyticsRangeSelector } from "@/components/analytics/AnalyticsRangeSelector";
import type { AnalyticsBodyPart } from "@/data/analytics/exerciseBodyParts";
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { useTrainingLoadAnalyticsDetail } from "@/hooks/useTrainingLoadAnalyticsDetail";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { useAppPalette } from "@/hooks/use-app-palette";

const VALID_RANGES: AnalyticsTimeRange[] = ["4w", "12w", "6m", "1y", "all"];
const VALID_BODY_PARTS: AnalyticsBodyPart[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Grip",
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseRange(value: string | string[] | undefined): AnalyticsTimeRange {
  const candidate = firstParam(value);
  return VALID_RANGES.includes(candidate as AnalyticsTimeRange)
    ? (candidate as AnalyticsTimeRange)
    : "12w";
}

function parseBodyPart(value: string | string[] | undefined): AnalyticsBodyPart | null {
  const candidate = firstParam(value);
  return VALID_BODY_PARTS.includes(candidate as AnalyticsBodyPart)
    ? (candidate as AnalyticsBodyPart)
    : null;
}

export default function BodyPartAnalyticsScreen() {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  const params = useLocalSearchParams();
  const bodyPart = parseBodyPart(params.bodyPart);
  const [range, setRange] = useState<AnalyticsTimeRange>(() => parseRange(params.range));
  const { analytics, isLoaded } = useTrainingLoadAnalyticsDetail(range);
  const detail = bodyPart
    ? analytics.bodyParts.find((item) => item.bodyPart === bodyPart) ?? null
    : null;
  const maxExposure = detail?.exercises[0]?.setExposures ?? 0;

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Building body-part analytics…</Text>
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

        <Text style={styles.eyebrow}>BODY-PART EXPOSURE</Text>
        <Text style={styles.title}>{bodyPart ?? "Body Part"}</Text>
        <Text style={styles.subtitle}>
          Which exercises contributed completed working-set exposure to this area.
        </Text>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        {bodyPart && detail ? (
          <>
            <AnalyticsCard title={`${bodyPart} exposure`} subtitle="Selected training period">
              <View style={styles.metricsGrid}>
                <AnalyticsMetric label="Set exposures" value={`${detail.setExposures}`} accent />
                <AnalyticsMetric label="Sessions" value={`${detail.sessions}`} />
                <AnalyticsMetric label="Exercises" value={`${detail.exerciseCount}`} />
                <AnalyticsMetric label="Share of exposure" value={`${Math.round(detail.sharePercent)}%`} />
              </View>
            </AnalyticsCard>

            <AnalyticsCard
              title="Contributing exercises"
              subtitle="Tap an exercise to open its Exercise Analytics"
            >
              {detail.exercises.map((exercise, index) => {
                const definition = exerciseRegistry[exercise.exerciseId];
                const name = definition?.name ?? exercise.exerciseId;
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
                      styles.exerciseRow,
                      index < detail.exercises.length - 1 && styles.divider,
                      pressed && styles.exerciseRowPressed,
                    ]}
                  >
                    <View style={styles.exerciseHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sessions} session{exercise.sessions === 1 ? "" : "s"} • {Math.round(exercise.sharePercent)}% of {bodyPart} exposure
                        </Text>
                      </View>
                      <View style={styles.exerciseValueBlock}>
                        <Text style={styles.exerciseValue}>{exercise.setExposures}</Text>
                        <Text style={styles.exerciseUnit}>sets</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={palette.primary} />
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${maxExposure ? Math.max(6, (exercise.setExposures / maxExposure) * 100) : 0}%` as `${number}%`,
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
              <Text style={styles.explanation}>
                Set exposure means a completed working set from an exercise mapped to {bodyPart}. Compound exercises can contribute to several body parts, so these values are not estimates of isolated muscle activation.
              </Text>
            </AnalyticsCard>
          </>
        ) : bodyPart ? (
          <AnalyticsCard title={`${bodyPart} exposure`} subtitle="Selected training period">
            <Text style={styles.emptyText}>
              No completed working-set exposure for {bodyPart} exists in this period.
            </Text>
          </AnalyticsCard>
        ) : (
          <AnalyticsCard title="Body-part analytics">
            <Text style={styles.emptyText}>Unable to identify the selected body part.</Text>
          </AnalyticsCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof useAppPalette>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 18, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: palette.textMuted },
  backTextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: { color: palette.text, fontSize: 14, fontWeight: "700" },
  eyebrow: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: { color: palette.text, fontSize: 28, fontWeight: "900", marginTop: 3 },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 14,
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  exerciseRow: { paddingVertical: 13 },
  exerciseRowPressed: { opacity: 0.72 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.surfaceAlt },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  exerciseName: { color: palette.text, fontSize: 15, fontWeight: "800" },
  exerciseMeta: { color: palette.textMuted, fontSize: 11, marginTop: 3, lineHeight: 15 },
  exerciseValueBlock: { alignItems: "flex-end" },
  exerciseValue: { color: palette.primary, fontSize: 20, fontWeight: "900" },
  exerciseUnit: { color: palette.textMuted, fontSize: 9 },
  barTrack: {
    height: 7,
    backgroundColor: "#1A1A1A",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 9,
  },
  barFill: { height: "100%", backgroundColor: palette.primary, borderRadius: 4 },
  explanation: { color: palette.textMuted, fontSize: 11, lineHeight: 16, marginTop: 12 },
  emptyText: { color: palette.textMuted, fontSize: 13, lineHeight: 18, marginTop: 8 },
});

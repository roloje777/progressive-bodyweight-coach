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
import { AnalyticsRangeSelector } from "@/components/analytics/AnalyticsRangeSelector";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { CoachAnalyticsEvidence, CoachEvidenceSource } from "@/models/analytics/CoachAnalytics";
import { appTokens } from "@/styles/appStyles";

const VALID_RANGES: AnalyticsTimeRange[] = ["4w", "12w", "6m", "1y", "all"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseRange(value: string | string[] | undefined): AnalyticsTimeRange {
  const candidate = firstParam(value);
  return VALID_RANGES.includes(candidate as AnalyticsTimeRange)
    ? (candidate as AnalyticsTimeRange)
    : "12w";
}

function toneColor(tone: CoachAnalyticsEvidence["tone"]) {
  if (tone === "positive") return "#4CAF50";
  if (tone === "caution") return "#FFB020";
  return appTokens.colors.primary;
}

function sourceLabel(source: CoachEvidenceSource) {
  switch (source) {
    case "readiness": return "Readiness";
    case "match-or-beat": return "Match or Beat";
    case "recovery": return "Recovery";
    case "consistency": return "Consistency";
    case "exercise": return "Exercises";
    case "training-load": return "Training load";
  }
}

function openEvidence(source: CoachEvidenceSource, range: AnalyticsTimeRange) {
  if (source === "match-or-beat") {
    router.push({ pathname: "/screens/matchOrBeatAnalytics", params: { range } });
    return;
  }
  if (source === "recovery") {
    router.push({ pathname: "/screens/recoveryAnalytics", params: { range } });
    return;
  }
  if (source === "training-load") {
    router.push({ pathname: "/screens/trainingLoadAnalytics", params: { range } });
  }
}

function canOpen(source: CoachEvidenceSource) {
  return source === "match-or-beat" || source === "recovery" || source === "training-load";
}

export default function CoachAnalyticsScreen() {
  const params = useLocalSearchParams();
  const [range, setRange] = useState<AnalyticsTimeRange>(() => parseRange(params.range));
  const { dashboard, isLoaded } = useAnalytics(range);

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={appTokens.colors.primary} />
          <Text style={styles.loadingText}>Interpreting your training history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const coach = dashboard.coach;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={19} color={appTokens.colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>COACH ANALYSIS</Text>
        <Text style={styles.title}>What your data is saying</Text>
        <Text style={styles.subtitle}>
          A deterministic interpretation of performance, recovery, consistency, readiness and workload in the selected period.
        </Text>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        <AnalyticsCard title={coach.headline} subtitle="Current interpretation">
          <View style={[styles.statusBar, { borderLeftColor: toneColor(coach.tone) }]}>
            <Text style={styles.summary}>{coach.summary}</Text>
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="What to do next" subtitle="Action based on the combined evidence">
          <View style={styles.actionRow}>
            <MaterialIcons name="arrow-forward" size={22} color={appTokens.colors.primary} />
            <Text style={styles.actionText}>{coach.action}</Text>
          </View>
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>WHY THE COACH SAYS THIS</Text>
        {coach.evidence.map((item) => (
          <Pressable
            key={item.source}
            disabled={!canOpen(item.source)}
            onPress={() => openEvidence(item.source, range)}
            style={({ pressed }) => [pressed && canOpen(item.source) && styles.pressed]}
          >
            <AnalyticsCard title={item.label} subtitle={sourceLabel(item.source)}>
              <View style={styles.evidenceHeader}>
                <Text style={[styles.evidenceValue, { color: toneColor(item.tone) }]}>
                  {item.value}
                </Text>
                {canOpen(item.source) ? (
                  <MaterialIcons name="chevron-right" size={22} color={appTokens.colors.muted} />
                ) : null}
              </View>
              <Text style={styles.evidenceText}>{item.interpretation}</Text>
            </AnalyticsCard>
          </Pressable>
        ))}

        <Text style={styles.disclaimer}>
          Coach Analysis explains patterns in your recorded training history. It does not diagnose injury, illness or medical conditions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appTokens.colors.background },
  content: { padding: 18, paddingBottom: 42 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: appTokens.colors.muted },
  backButton: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginBottom: 18 },
  backText: { color: appTokens.colors.text, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: appTokens.colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: appTokens.colors.text, fontSize: 29, fontWeight: "900", marginTop: 3 },
  subtitle: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  sectionLabel: { color: appTokens.colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 22, marginBottom: 8 },
  statusBar: { borderLeftWidth: 4, paddingLeft: 12, marginTop: 8 },
  summary: { color: appTokens.colors.text, fontSize: 14, lineHeight: 21 },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8 },
  actionText: { flex: 1, color: appTokens.colors.text, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  evidenceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  evidenceValue: { fontSize: 18, fontWeight: "900", flex: 1 },
  evidenceText: { color: appTokens.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  pressed: { opacity: 0.72 },
  disclaimer: { color: appTokens.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
});

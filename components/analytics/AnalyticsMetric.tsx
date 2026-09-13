import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnalyticsTrend } from "@/models/analytics/AnalyticsTrend";
import { appTokens } from "@/styles/appStyles";

export function formatTrend(trend: AnalyticsTrend) {
  if (trend === "improving") return { label: "↑ Improving", color: appTokens.colors.accent };
  if (trend === "declining") return { label: "↓ Declining", color: appTokens.colors.danger };
  if (trend === "stable") return { label: "→ Stable", color: appTokens.colors.muted };
  return { label: "Not enough history", color: appTokens.colors.muted };
}

export function AnalyticsMetric({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accent]}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metric: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 8,
  },
  label: {
    color: appTokens.colors.muted,
    fontSize: 12,
  },
  value: {
    color: appTokens.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  accent: {
    color: appTokens.colors.primary,
  },
  helper: {
    color: appTokens.colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});

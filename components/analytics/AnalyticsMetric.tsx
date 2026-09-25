import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnalyticsTrend } from "@/models/analytics/AnalyticsTrend";
import { useAppPalette } from "@/hooks/use-app-palette";

export function formatTrend(trend: AnalyticsTrend, palette: ReturnType<typeof useAppPalette>) {
  if (trend === "improving") return { label: "↑ Improving", color: palette.accent };
  if (trend === "declining") return { label: "↓ Declining", color: palette.danger };
  if (trend === "stable") return { label: "→ Stable", color: palette.textMuted };
  return { label: "Not enough history", color: palette.textMuted };
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
  const palette = useAppPalette();
  const styles = createStyles(palette);
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accent]}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof useAppPalette>) => StyleSheet.create({
  metric: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 8,
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
  },
  value: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  accent: {
    color: palette.primary,
  },
  helper: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

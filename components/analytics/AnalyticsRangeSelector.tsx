import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { useAppPalette } from "@/hooks/use-app-palette";

const options: Array<{ value: AnalyticsTimeRange; label: string }> = [
  { value: "4w", label: "4W" },
  { value: "12w", label: "12W" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "ALL" },
];

export function AnalyticsRangeSelector({
  value,
  onChange,
}: {
  value: AnalyticsTimeRange;
  onChange: (range: AnalyticsTimeRange) => void;
}) {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.button, selected && styles.selectedButton]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof useAppPalette>) => StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#1B1B1B",
    borderRadius: 12,
    padding: 4,
  },
  button: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  selectedButton: {
    backgroundColor: palette.primary,
  },
  text: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedText: {
    color: "#111",
  },
});

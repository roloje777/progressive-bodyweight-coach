import { StyleSheet } from "react-native";
import { useAppPalette } from "@/hooks/use-app-palette";

export function useTopAppBarStyles() {
  const palette = useAppPalette();

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      backgroundColor: palette.background,
    },

    pill: {
      flex: 1,
      marginHorizontal: 6,
      padding: 10,
      backgroundColor: palette.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    label: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.textMuted,
    },

    level: {
      fontSize: 16,
      fontWeight: "bold",
      color: palette.text,
      marginVertical: 4,
    },

    barBackground: {
      height: 6,
      backgroundColor: palette.border,
      borderRadius: 4,
      overflow: "hidden",
    },

    barFill: {
      height: 6,
      borderRadius: 4,
    },

    metricLabel: {
      color: palette.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },

    levelLabel: {
      fontSize: 14,
      fontWeight: "600",
    },
  });
}

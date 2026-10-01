import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
import { localizeAnalyticsText } from "@/i18n/analyticsPresentation";

export function AnalyticsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  const { language } = useTranslation();
  const at = (text: string) => localizeAnalyticsText(language, text);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{at(title)}</Text>
      {subtitle ? <Text style={styles.subtitle}>{at(subtitle)}</Text> : null}
      {children}
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof useAppPalette>) => StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2D2D2D",
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 10,
  },
});

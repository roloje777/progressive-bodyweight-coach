import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTokens } from "@/styles/appStyles";

export function AnalyticsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: appTokens.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2D2D2D",
  },
  title: {
    color: appTokens.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: appTokens.colors.muted,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 10,
  },
});

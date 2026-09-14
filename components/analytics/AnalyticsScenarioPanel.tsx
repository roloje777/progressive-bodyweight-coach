import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { ANALYTICS_SCENARIOS, AnalyticsScenarioDefinition, seedAnalyticsScenario } from "@/dev/analyticsScenarios";
import { appTokens } from "@/styles/appStyles";

export function AnalyticsScenarioPanel(props: { onSeeded: () => Promise<void> | void }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!__DEV__) return null;

  const apply = (scenario: AnalyticsScenarioDefinition) => {
    Alert.alert(
      `Load ${scenario.title}?`,
      "This replaces your local workout history, evaluations and progress with development test data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load scenario",
          style: "destructive",
          onPress: async () => {
            try {
              setBusyId(scenario.id);
              await seedAnalyticsScenario(scenario.id);
              await props.onSeeded();
            } catch (error) {
              console.error("Failed to seed analytics scenario", error);
              Alert.alert("Scenario failed", "The test scenario could not be loaded.");
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <MaterialIcons name="science" size={20} color={appTokens.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Analytics test scenarios</Text>
          <Text style={styles.subtitle}>Development only • replaces local test history</Text>
        </View>
      </View>
      <View style={styles.buttons}>
        {ANALYTICS_SCENARIOS.map((scenario) => (
          <Pressable
            key={scenario.id}
            disabled={busyId != null}
            onPress={() => apply(scenario)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonTitle}>{busyId === scenario.id ? "Loading…" : scenario.title}</Text>
            <Text style={styles.buttonDescription}>{scenario.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: "#1B1B1B", borderWidth: 1, borderColor: "#353535" },
  titleRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  title: { color: appTokens.colors.text, fontSize: 15, fontWeight: "800" },
  subtitle: { color: appTokens.colors.muted, fontSize: 11, marginTop: 2 },
  buttons: { gap: 8, marginTop: 12 },
  button: { padding: 11, borderRadius: 10, backgroundColor: "#242424" },
  buttonPressed: { opacity: 0.7 },
  buttonTitle: { color: appTokens.colors.primary, fontWeight: "800", fontSize: 13 },
  buttonDescription: { color: appTokens.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
});

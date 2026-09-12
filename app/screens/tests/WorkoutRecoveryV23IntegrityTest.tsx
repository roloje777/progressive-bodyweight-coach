import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  runWorkoutRecoveryV23IntegrityAssertions,
  V23AssertionResult,
} from "@/utils/testing/WorkoutRecoveryV23IntegrityAssertions";

export default function WorkoutRecoveryV23IntegrityTest() {
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState<V23AssertionResult[]>([]);

  const run = async () => {
    setRunning(true);
    setResults([]);

    try {
      setResults(await runWorkoutRecoveryV23IntegrityAssertions());
    } finally {
      setRunning(false);
    }
  };

  const passed = results.filter((result) => result.passed).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ padding: 20, gap: 14 }}
    >
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>
        V2.3 Recovery Integrity Tests
      </Text>

      <Text style={{ color: "#ccc", lineHeight: 21 }}>
        These assertions verify stale-state classification, structural recovery
        consistency, timer/exercise identity, and safe/idempotent cleanup.
      </Text>

      <TouchableOpacity
        disabled={running}
        onPress={run}
        style={{
          borderWidth: 1,
          borderColor: "#4FC3F7",
          borderRadius: 10,
          padding: 15,
          alignItems: "center",
          backgroundColor: "#111",
          opacity: running ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#4FC3F7", fontWeight: "700" }}>
          {running ? "RUNNING…" : "RUN V2.3 ASSERTIONS"}
        </Text>
      </TouchableOpacity>

      {results.length > 0 ? (
        <Text
          style={{
            color: passed === results.length ? "#7CFC8A" : "#FFD54F",
            fontWeight: "700",
          }}
        >
          {passed}/{results.length} passed
        </Text>
      ) : null}

      {results.map((result) => (
        <View
          key={result.name}
          style={{
            borderWidth: 1,
            borderColor: result.passed ? "#295f31" : "#7a3030",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {result.passed ? "✅" : "❌"} {result.name}
          </Text>
          <Text style={{ color: "#aaa", marginTop: 5 }}>{result.detail}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

import React from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  runWorkoutRecoveryV24Assertions,
  V24AssertionResult,
} from "@/utils/testing/WorkoutRecoveryV24Assertions";

export default function WorkoutRecoveryV24Test() {
  const [results, setResults] = React.useState<V24AssertionResult[]>([]);

  const run = () => setResults(runWorkoutRecoveryV24Assertions());
  const passed = results.filter((result) => result.passed).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>V2.4 Recovery Assertions</Text>
        <Text style={{ color: "#aaa", marginTop: 8, marginBottom: 18, lineHeight: 20 }}>
          Checks migration compatibility and completed-workout recovery provenance without modifying stored workout history.
        </Text>
        <Pressable onPress={run} style={{ padding: 14, borderWidth: 1, borderColor: "#888", borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>RUN V2.4 ASSERTIONS</Text>
        </Pressable>
        {results.length > 0 && (
          <Text style={{ color: passed === results.length ? "#9fe39f" : "#ffb3b3", fontWeight: "800", marginBottom: 14 }}>
            {passed}/{results.length} passed
          </Text>
        )}
        {results.map((result) => (
          <View key={result.name} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#333" }}>
            <Text style={{ color: result.passed ? "#9fe39f" : "#ffb3b3", fontWeight: "700" }}>
              {result.passed ? "PASS" : "FAIL"} — {result.name}
            </Text>
            <Text selectable style={{ color: "#aaa", marginTop: 5 }}>{result.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

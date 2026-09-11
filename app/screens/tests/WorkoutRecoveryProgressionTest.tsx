import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { runWorkoutRecoveryProgressionAssertions } from "@/utils/testing/WorkoutRecoveryProgressionAssertionRunner";

export default function WorkoutRecoveryProgressionTest() {
  const [result, setResult] = React.useState<ReturnType<
    typeof runWorkoutRecoveryProgressionAssertions
  > | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = () => {
    try {
      setError(null);
      setResult(runWorkoutRecoveryProgressionAssertions());
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#000",
      }}
      contentContainerStyle={{
        padding: 20,
        gap: 14,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: "#fff",
        }}
      >
        Recovery Progression Assertion
      </Text>

      <Text
        style={{
          color: "#ccc",
          lineHeight: 21,
        }}
      >
        Proves that manually recovered performance remains stored while the
        progression setting controls whether it may establish future
        Match-or-Beat evidence.
      </Text>

      <TouchableOpacity
        onPress={run}
        activeOpacity={0.75}
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: "#777",
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "700",
            color: "#fff",
          }}
        >
          RUN ASSERTION
        </Text>
      </TouchableOpacity>

      {error ? (
        <View
          style={{
            gap: 6,
            padding: 12,
            borderWidth: 1,
            borderColor: "#777",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              color: "#fff",
            }}
          >
            FAILED
          </Text>
          <Text style={{ color: "#ccc" }}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <View
          style={{
            gap: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: "#777",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              color: "#fff",
            }}
          >
            PASSED
          </Text>

          {result.checks.map((check) => (
            <View key={check.label} style={{ marginBottom: 8 }}>
              <Text
                style={{
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                {check.label}
              </Text>
              <Text style={{ color: "#ccc" }}>
                Expected: {String(check.expected)} | Actual:{" "}
                {String(check.actual)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

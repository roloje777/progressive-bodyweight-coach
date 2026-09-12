import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import {
  seedWorkoutRecoveryLifecycleScenario,
  WorkoutRecoveryLifecycleScenarioResult,
} from "@/utils/testing/WorkoutRecoveryLifecycleScenarioSeeder";

export default function WorkoutRecoveryLifecycleScenarioTest() {
  const [status, setStatus] = React.useState("Ready");
  const [lastSeed, setLastSeed] =
    React.useState<WorkoutRecoveryLifecycleScenarioResult | null>(null);

  const prepareScenario = async () => {
    try {
      setStatus("Preparing Week 1 / Day 1…");

      const seeded = await seedWorkoutRecoveryLifecycleScenario("level1");
      setLastSeed(seeded);
      setStatus("Scenario ready — opening final set.");

      router.replace({
        pathname: "/screens/workout",
        params: {
          session: JSON.stringify(seeded.session),
          blockIndex: "0",
          startWorkoutTime: String(seeded.startWorkoutTime),
          recoveryState: JSON.stringify(seeded.recoveryState),
          recovered: "true",
        },
      });
    } catch (error) {
      console.error("Lifecycle scenario seed failed", error);
      setStatus(
        `FAILED: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 24,
          fontWeight: "700",
        }}
      >
        V2.1 Lifecycle Recovery Scenario
      </Text>

      <Text style={{ color: "#ccc", lineHeight: 21 }}>
        Creates Level 1, Week 1, Day 1 with the main workout already completed
        except for the final set of the final exercise. Trusted main-workout
        duration starts at exactly 3:00.
      </Text>

      <TouchableOpacity
        onPress={prepareScenario}
        style={{
          borderWidth: 1,
          borderColor: "#4FC3F7",
          borderRadius: 10,
          padding: 15,
          alignItems: "center",
          backgroundColor: "#111",
        }}
      >
        <Text style={{ color: "#4FC3F7", fontWeight: "700" }}>
          PREPARE FINAL-SET SCENARIO
        </Text>
      </TouchableOpacity>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Test each case from a fresh seed
        </Text>

        <Text style={{ color: "#ccc" }}>
          1. Brief background: background 10–20 seconds, return, complete the
          last set.
        </Text>

        <Text style={{ color: "#ccc" }}>
          2. Extended background: background several minutes without killing
          the app, return, complete the last set.
        </Text>

        <Text style={{ color: "#ccc" }}>
          3. Force close: force-close on the final set, wait several minutes,
          reopen, choose Resume Workout, then complete the final set.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: the 3:00 seeded baseline plus actual foreground activity is
          counted. Background/closed-app time is not.
        </Text>
      </View>

      <Text style={{ color: "#aaa" }}>{status}</Text>

      {lastSeed ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: "#aaa" }}>
            Program: {lastSeed.programName}
          </Text>
          <Text style={{ color: "#aaa" }}>
            Final exercise: {lastSeed.finalExerciseName}
          </Text>
          <Text style={{ color: "#aaa" }}>
            Remaining set: {lastSeed.finalSetNumber} /{" "}
            {lastSeed.totalSetsInFinalExercise}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

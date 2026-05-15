import React, { useState } from "react";
import { View, Text, Button, ScrollView, TextInput } from "react-native";

import { runProgramE2ETest } from "./ProgramEngine.e2e.test";

export default function ProgramEngineTestScreen() {
  const [status, setStatus] = useState("Idle");

  const [programIndex, setProgramIndex] = useState("*");

  const [weeks, setWeeks] = useState("8");

  const [days, setDays] = useState("*");

  // -----------------------------
  // FULL TEST
  // -----------------------------
  const runFullTest = async () => {
    setStatus("Running Full Simulation...");

    try {
      // await runProgramE2ETest();
      await runProgramE2ETest({
        mode: "full",
      });

      setStatus("✅ Full Simulation Completed");
    } catch (err) {
      console.error("Test failed:", err);

      setStatus("❌ Failed");
    }
  };

  // -----------------------------
  // CUSTOM TEST
  // -----------------------------
  const runCustomTest = async () => {
    setStatus("Running Custom Simulation...");

    try {
      await runProgramE2ETest({
        mode: "custom",

        maxProgramIndex:
          programIndex === "*" ? undefined : Number(programIndex),

        maxWeeks: weeks === "*" ? undefined : Number(weeks),

        maxDays: days === "*" ? undefined : Number(days),
      });

      setStatus("✅ Custom Simulation Completed");
    } catch (err) {
      console.error("Test failed:", err);

      setStatus("❌ Failed");
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
      }}
    >
      <Text
        style={{
          fontSize: 24,
          marginBottom: 20,
          fontWeight: "bold",
          color: "#fff",
        }}
      >
        Program Engine E2E Test
      </Text>

      {/* FULL */}
      <Button title="Run Full Simulation" onPress={runFullTest} />

      <View style={{ height: 30 }} />

      {/* CUSTOM */}
      <Text
        style={{
          fontSize: 18,
          marginBottom: 10,
          fontWeight: "bold",
          color: "#FFD700",
        }}
      >
        Custom Simulation
      </Text>

      {/* PROGRAM */}
      <Text
        style={{
          color: "#fff",
          marginBottom: 6,
        }}
      >
        Program Index (* = all)
      </Text>

      <TextInput
        value={programIndex}
        onChangeText={setProgramIndex}
        placeholder="*"
        placeholderTextColor="#777"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          color: "#fff",
          padding: 12,
          borderRadius: 10,
          marginBottom: 15,
        }}
      />

      {/* WEEKS */}
      <Text
        style={{
          color: "#fff",
          marginBottom: 6,
        }}
      >
        Weeks (* = program default)
      </Text>

      <TextInput
        value={weeks}
        onChangeText={setWeeks}
        placeholder="8"
        placeholderTextColor="#777"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          color: "#fff",
          padding: 12,
          borderRadius: 10,
          marginBottom: 15,
        }}
      />

      {/* DAYS */}
      <Text
        style={{
          color: "#fff",
          marginBottom: 6,
        }}
      >
        Days (* = all)
      </Text>

      <TextInput
        value={days}
        onChangeText={setDays}
        placeholder="*"
        placeholderTextColor="#777"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          color: "#fff",
          padding: 12,
          borderRadius: 10,
          marginBottom: 20,
        }}
      />

      <Button title="Run Custom Simulation" onPress={runCustomTest} />

      {/* STATUS */}
      <Text
        style={{
          marginTop: 30,
          fontSize: 16,
          color: "#4CAF50",
        }}
      >
        Status: {status}
      </Text>

      {/* EXAMPLES */}
      <View
        style={{
          marginTop: 30,
          backgroundColor: "#111",
          padding: 15,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#222",
        }}
      >
        <Text
          style={{
            color: "#FFD700",
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          Examples
        </Text>

        <Text style={{ color: "#ccc", marginBottom: 8 }}>
          Program * + Week 8 + All Days
        </Text>

        <Text style={{ color: "#ccc", marginBottom: 8 }}>
          Program 0 + Week 4 + All Days
        </Text>

        <Text style={{ color: "#ccc" }}>Program 0 + Week 1 + Day 3</Text>
      </View>
    </ScrollView>
  );
}

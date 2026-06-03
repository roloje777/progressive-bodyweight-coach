import React, { useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { runProgramE2ETest } from "./ProgramEngine.e2e.test";

export default function ProgramEngineTestScreen() {
  const [status, setStatus] = useState("Idle");

  const [programIndex, setProgramIndex] = useState("*");

  const [weeks, setWeeks] = useState("8");

  const [days, setDays] = useState("*");

  const [simulationMode, setSimulationMode] = useState("realistic");

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

        simulationMode: simulationMode as any,

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

      <View
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        <Picker
          selectedValue={programIndex}
          onValueChange={(value) => setProgramIndex(value)}
          dropdownIconColor="#3f3e3e"
          style={{
            color: "#271cc2",
          }}
        >
          <Picker.Item label="All Programs (*)" value="*" />

          <Picker.Item label="Program 0" value="0" />
          <Picker.Item label="Program 1" value="1" />
          <Picker.Item label="Program 2" value="2" />
        </Picker>
      </View>

      {/* WEEKS */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        <Picker
          selectedValue={weeks}
          onValueChange={(value) => setWeeks(value)}
          dropdownIconColor="#3f3e3e"
          style={{
            color: "#271cc2",
          }}
        >
          <Picker.Item label="Program Default (*)" value="*" />

          <Picker.Item label="1 Week" value="1" />
          <Picker.Item label="2 Weeks" value="2" />
          <Picker.Item label="4 Weeks" value="4" />
          <Picker.Item label="8 Weeks" value="8" />
          <Picker.Item label="12 Weeks" value="12" />
          <Picker.Item label="16 Weeks" value="16" />
        </Picker>
      </View>

      {/* DAYS */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        <Picker
          selectedValue={days}
          onValueChange={(value) => setDays(value)}
          dropdownIconColor="#3f3e3e"
          style={{
            color: "#271cc2",
          }}
        >
          <Picker.Item label="All Days (*)" value="*" />

          <Picker.Item label="1 Day" value="1" />
          <Picker.Item label="2 Days" value="2" />
          <Picker.Item label="3 Days" value="3" />
          <Picker.Item label="4 Days" value="4" />
          <Picker.Item label="5 Days" value="5" />
          <Picker.Item label="6 Days" value="6" />
          <Picker.Item label="7 Days" value="7" />
        </Picker>
      </View>
      <View
        style={{
          borderWidth: 1,
          borderColor: "#444",
          backgroundColor: "#111",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Picker
          selectedValue={simulationMode}
          onValueChange={(value) => setSimulationMode(value)}
         dropdownIconColor="#3f3e3e"
          style={{
            color: "#271cc2",
          }}
        >
          <Picker.Item label="Realistic" value="realistic" />
          <Picker.Item label="Easy" value="easy" />
          <Picker.Item label="Brutal" value="brutal" />
          <Picker.Item label="Plateau" value="plateau" />
          <Picker.Item label="Overtrained" value="overtrained" />
        </Picker>
      </View>

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

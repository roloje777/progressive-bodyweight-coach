import React, { useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";

import { soundManager } from "../../../services/SoundManagerExpoAv";

export default function SoundManagerTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    console.log(msg);
    setLogs((prev) => [...prev, msg]);
  };

  const runTests = async () => {
    setLogs([]);
    log("🔊 Starting SoundManager Tests...\n");

    await soundManager.loadSounds();

    // Helper to run test
    const test = async (name: string, fn: Function) => {
      log(`▶️ ${name}()`);
      await fn();

      log(`▶️ ${name}(true)`);
      await fn(true);
    };

    await test("playTick", soundManager.playTick.bind(soundManager));
    await test("playGetReady", soundManager.playGetReady.bind(soundManager));
    await test("playGo", soundManager.playGo.bind(soundManager));
    await test("playNextSet", soundManager.playNextSet.bind(soundManager));
    await test("playNextExercise", soundManager.playNextExercise.bind(soundManager));

    // ⚠️ NOTE: your method is named playCountdownBeep (not playCountDownAndBeep)
    await test("playCountdownBeep", soundManager.playCountdownBeep.bind(soundManager));

    await test("playHalfWay", soundManager.playHalfWay.bind(soundManager));
    await test("playReadySetGoSound", soundManager.playReadySetGoSound.bind(soundManager));

    // Phase sounds (no boolean version)
    log("▶️ playPhaseSound(eccentric)");
    await soundManager.playPhaseSound("eccentric");

    log("▶️ playPhaseSound(concentric)");
    await soundManager.playPhaseSound("concentric");

    log("▶️ playPhaseSound(pauseEccentric)");
    await soundManager.playPhaseSound("pauseEccentric");

    log("▶️ playPhaseSound(pauseConcentric)");
    await soundManager.playPhaseSound("pauseConcentric");

    log("\n✅ All tests completed!");
  };

  return (
    <View style={{ padding: 20, flex: 1 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Test Sound Manager
      </Text>

      <Button title="Run Sound Tests" onPress={runTests} />

      <ScrollView style={{ marginTop: 20 }}>
        {logs.map((logItem, index) => (
          <Text key={index} style={{ marginBottom: 5 }}>
            {logItem}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
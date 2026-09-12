import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import {
  seedV22ExerciseRestScenario,
  seedV22HoldScenario,
  seedV22SetRestScenario,
  V22ScenarioResult,
} from "@/utils/testing/WorkoutRecoveryV22TimerScenarioSeeder";

type ScenarioAction =
  | "set-rest-60"
  | "set-rest-15"
  | "exercise-rest-60"
  | "hold";

export default function WorkoutRecoveryV22TimerScenarioTest() {
  const [status, setStatus] = React.useState("Ready");
  const [lastSeed, setLastSeed] =
    React.useState<V22ScenarioResult | null>(null);

  const openSeed = (seeded: V22ScenarioResult) => {
    setLastSeed(seeded);

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
  };

  const prepareScenario = async (action: ScenarioAction) => {
    try {
      setStatus("Preparing scenario…");

      let seeded: V22ScenarioResult;

      switch (action) {
        case "set-rest-60":
          seeded = await seedV22SetRestScenario(60);
          break;

        case "set-rest-15":
          seeded = await seedV22SetRestScenario(15);
          break;

        case "exercise-rest-60":
          seeded = await seedV22ExerciseRestScenario(60);
          break;

        case "hold":
          seeded = await seedV22HoldScenario();
          break;
      }

      setStatus(
        `${seeded.kind} ready — opening ${seeded.exerciseName}.`,
      );

      openSeed(seeded);
    } catch (error) {
      console.error("V2.2 timer scenario seed failed", error);
      setStatus(
        `FAILED: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const button = (
    label: string,
    action: ScenarioAction,
  ) => (
    <TouchableOpacity
      onPress={() => prepareScenario(action)}
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
        {label}
      </Text>
    </TouchableOpacity>
  );

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
        V2.2 Timer Recovery Tests
      </Text>

      <Text style={{ color: "#ccc", lineHeight: 21 }}>
        Each button creates a fresh real workout snapshot with an exact 3:00
        trusted-workout baseline. Run every lifecycle test from a fresh seed.
      </Text>

      {button("SET REST — 60 SEC", "set-rest-60")}
      {button("EXPIRED SET REST — 15 SEC", "set-rest-15")}
      {button("EXERCISE REST — 60 SEC", "exercise-rest-60")}
      {button("TIMED HOLD", "hold")}

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          A — Brief background during set rest
        </Text>

        <Text style={{ color: "#ccc" }}>
          Open SET REST — 60 SEC. Note the remaining value, background the app
          for about 10–20 seconds, then return.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: the countdown has reduced by approximately the real elapsed
          10–20 seconds. It must not restart at 60.
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          B — Rest expires in background
        </Text>

        <Text style={{ color: "#ccc" }}>
          Open EXPIRED SET REST — 15 SEC. Background the app for more than 15
          seconds, then return.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: the rest is already complete and the workout is ready for
          the next set. A fresh 15-second countdown must not appear.
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          C — Force-close during set rest
        </Text>

        <Text style={{ color: "#ccc" }}>
          Open SET REST — 60 SEC. Let several seconds pass, force-close the
          application, wait another 10–20 seconds, reopen it and choose Resume
          Workout.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: the restored countdown reflects all real rest time that
          elapsed while the app was closed. It must not restart from 60.
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          D — Exercise-rest reconstruction
        </Text>

        <Text style={{ color: "#ccc" }}>
          Open EXERCISE REST — 60 SEC. Background for about 10–20 seconds and
          return. Then either let the rest expire or background long enough for
          it to expire.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: the countdown reconstructs correctly and advances to the
          next exercise exactly once when the rest expires.
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          E — Background during timed hold
        </Text>

        <Text style={{ color: "#ccc" }}>
          Open TIMED HOLD. Start the hold normally and let about 5–10 seconds
          pass. Background the app for another 10–20 seconds, then return.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: the hold is interrupted. Background time is NOT credited as
          performance. The screen offers Record Ns and Restart Hold.
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#333",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          F — Force-close during timed hold
        </Text>

        <Text style={{ color: "#ccc" }}>
          Open TIMED HOLD. Start the hold, let it run for at least several
          seconds, force-close, wait 10–20 seconds, reopen, choose Resume
          Workout.
        </Text>

        <Text style={{ color: "#FFD54F" }}>
          Expected: only the trusted hold duration before interruption is
          recoverable. Closed-app time must never be added to the hold result.
        </Text>
      </View>

      <Text style={{ color: "#aaa" }}>
        Timing integrity expectation: the seeded workout begins at exactly
        3:00 trusted active time. Background/closed-app gaps may advance REST,
        but they must never increase trusted workout duration or timed exercise
        performance.
      </Text>

      <Text style={{ color: "#aaa" }}>{status}</Text>

      {lastSeed ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: "#aaa" }}>
            Program: {lastSeed.programName}
          </Text>
          <Text style={{ color: "#aaa" }}>
            Week / Day: {lastSeed.week} / {lastSeed.day}
          </Text>
          <Text style={{ color: "#aaa" }}>
            Exercise: {lastSeed.exerciseName}
          </Text>
          <Text style={{ color: "#aaa" }}>
            Scenario: {lastSeed.kind}
          </Text>
          <Text style={{ color: "#aaa" }}>
            Trusted baseline: {lastSeed.seededTrustedDurationSeconds}s
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

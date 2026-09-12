import React from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { appStyles as styles } from "@/styles/appStyles";
import {
  clearActiveWorkout,
  inspectActiveWorkout,
  resumeActiveWorkout,
} from "@/storage/activeWorkoutStorage";
import { ActiveWorkoutLoadResult } from "@/models/WorkoutRecovery";

function formatAbsence(ms?: number) {
  if (ms == null) return null;
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  if (totalMinutes < 1) return "less than a minute";
  if (totalMinutes < 60) return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

export default function WorkoutRecoveryScreen() {
  const [result, setResult] = React.useState<ActiveWorkoutLoadResult | null>(null);

  React.useEffect(() => {
    inspectActiveWorkout().then(setResult);
  }, []);

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Checking interrupted workout…</Text>
      </SafeAreaView>
    );
  }

  if (result.status === "invalid") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ width: "92%", alignSelf: "center", marginTop: 30 }}>
          <Text style={styles.title}>Workout Recovery Issue</Text>
          <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 24, lineHeight: 21 }}>
            An unfinished workout was found, but its saved recovery state cannot be safely restored.
            {result.issue ? `\n\n${result.issue}` : ""}
          </Text>
          <PrimaryButton
            title="DISCARD UNUSABLE RECOVERY"
            onPress={() => {
              Alert.alert(
                "Discard unusable recovery?",
                "The corrupted recovery snapshot will be removed. Completed workout history is not affected.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Discard",
                    style: "destructive",
                    onPress: async () => {
                      await clearActiveWorkout();
                      router.replace("/");
                    },
                  },
                ],
              );
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const snapshot = result.snapshot;
  if (!snapshot) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>No interrupted workout found.</Text>
        <PrimaryButton title="Return Home" onPress={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  const resume = async () => {
    const resumed = await resumeActiveWorkout();
    if (!resumed) return;
    const pathname =
      resumed.screen === "dynamicWarmUp"
        ? "/screens/dynamicWarmUp"
        : resumed.screen === "staticStretch"
          ? "/screens/staticStretch"
          : resumed.screen === "workoutSummary"
            ? "/screens/workoutSummary"
            : "/screens/workout";

    router.replace({
      pathname: pathname as any,
      params: {
        session: JSON.stringify(resumed.session),
        blockIndex: String(resumed.blockIndex),
        startWorkoutTime: String(resumed.startWorkoutTime),
        recoveryState: JSON.stringify(resumed.screenState ?? {}),
        recovered: "true",
      },
    });
  };

  const discard = () => {
    Alert.alert(
      "Discard interrupted workout?",
      "The recoverable workout state will be removed. Completed workout history is not affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await clearActiveWorkout();
            router.replace("/");
          },
        },
      ],
    );
  };

  const absence = formatAbsence(snapshot.interruption?.absenceMs);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: "92%", alignSelf: "center", marginTop: 30 }}>
        <Text style={styles.title}>Interrupted Workout Found</Text>
        <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 12, lineHeight: 21 }}>
          Day {snapshot.dayIndex + 1} was interrupted. You can continue the live workout, or complete the missing results manually without timers.
        </Text>
        {snapshot.interruption?.kind === "processRestart" ? (
          <Text style={{ color: "#aaa", textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            The app restarted during this workout{absence ? ` after approximately ${absence} away` : ""}. Closed-app time has not been added to the workout duration.
          </Text>
        ) : null}
        <PrimaryButton title="RESUME WORKOUT" onPress={resume} />
        <PrimaryButton
          title="COMPLETE / EDIT REMAINING"
          onPress={() => router.push("/screens/manualWorkoutRecovery" as any)}
        />
        <PrimaryButton title="DISCARD WORKOUT" onPress={discard} />
      </View>
    </SafeAreaView>
  );
}

import React from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { appStyles as styles } from "@/styles/appStyles";
import {
  clearActiveWorkout,
  clearActiveWorkoutIfSession,
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

function formatSnapshotAge(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
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
            await clearActiveWorkoutIfSession(snapshot.sessionId);
            router.replace("/");
          },
        },
      ],
    );
  };

  const absence = formatAbsence(snapshot.interruption?.absenceMs);
  const integrity = result.integrity;
  const context = integrity?.context;
  const lastSaved = integrity ? formatSnapshotAge(integrity.ageMs) : null;
  const isStale = integrity?.age === "stale" || integrity?.age === "veryStale";

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: "92%", alignSelf: "center", marginTop: 30 }}>
        <Text style={styles.title}>Interrupted Workout Found</Text>
        <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 8, lineHeight: 21 }}>
          Week {snapshot.weekIndex + 1} · Day {snapshot.dayIndex + 1}
          {context?.blockTitle ? ` · ${context.blockTitle}` : ""}
        </Text>

        {context?.exerciseName ? (
          <Text style={{ color: "#fff", textAlign: "center", marginBottom: 8, fontWeight: "700" }}>
            {context.exerciseName}
            {context.setNumber ? ` · Set ${context.setNumber}` : ""}
          </Text>
        ) : null}

        {lastSaved ? (
          <Text style={{ color: "#aaa", textAlign: "center", marginBottom: 12 }}>
            Last active: {lastSaved}
          </Text>
        ) : null}

        {isStale ? (
          <View style={{ borderWidth: 1, borderColor: "#FFD54F", borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: "#FFD54F", textAlign: "center", lineHeight: 20, fontWeight: "700" }}>
              {integrity?.age === "veryStale"
                ? "This recovery is more than 7 days old."
                : "This recovery is more than 24 hours old."}
            </Text>
            <Text style={{ color: "#ccc", textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              You can still resume it, but confirm this is the workout you intend to continue.
            </Text>
          </View>
        ) : null}

        <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 12, lineHeight: 21 }}>
          You can continue the live workout, or complete the missing results manually without timers.
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

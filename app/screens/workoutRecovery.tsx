import React from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { appStyles as styles } from "@/styles/appStyles";
import {
  clearActiveWorkout,
  loadActiveWorkout,
  resumeActiveWorkout,
} from "@/storage/activeWorkoutStorage";

export default function WorkoutRecoveryScreen() {
  const [snapshot, setSnapshot] = React.useState<any>(null);

  React.useEffect(() => {
    loadActiveWorkout().then(setSnapshot);
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: "92%", alignSelf: "center", marginTop: 30 }}>
        <Text style={styles.title}>Interrupted Workout Found</Text>
        <Text style={{ color: "#ccc", textAlign: "center", marginBottom: 24, lineHeight: 21 }}>
          Day {snapshot.dayIndex + 1} was interrupted. You can continue the live workout, or complete the missing results manually without timers.
        </Text>
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

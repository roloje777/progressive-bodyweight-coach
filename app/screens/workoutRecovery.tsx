import React from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import {
  clearActiveWorkout,
  clearActiveWorkoutIfSession,
  inspectActiveWorkout,
  resumeActiveWorkout,
} from "@/storage/activeWorkoutStorage";
import { ActiveWorkoutLoadResult } from "@/models/WorkoutRecovery";
import { useTranslation } from "@/hooks/useTranslation";
import { loadLockedWorkoutPrescription } from "@/storage/workoutPrescriptionStorage";
import { classifyResumedPrescription } from "@/utils/workoutPrescriptionResumeCheck";

function formatAbsence(ms: number | undefined, language: "en" | "pt-PT") {
  if (ms == null) return null;
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  if (totalMinutes < 1) return language === "pt-PT" ? "menos de um minuto" : "less than a minute";
  if (totalMinutes < 60) return language === "pt-PT" ? `${totalMinutes} minuto${totalMinutes === 1 ? "" : "s"}` : `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

function formatSnapshotAge(ms: number, language: "en" | "pt-PT") {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return language === "pt-PT" ? "agora mesmo" : "just now";
  if (minutes < 60) return language === "pt-PT" ? `há ${minutes} minuto${minutes === 1 ? "" : "s"}` : `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === "pt-PT" ? `há ${hours} hora${hours === 1 ? "" : "s"}` : `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return language === "pt-PT" ? `há ${days} dia${days === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function WorkoutRecoveryScreen() {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { language, uiText, exerciseName, workoutTitle } = useTranslation();
  const [result, setResult] = React.useState<ActiveWorkoutLoadResult | null>(null);

  React.useEffect(() => {
    inspectActiveWorkout().then(setResult);
  }, []);

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{uiText("Checking interrupted workout…")}</Text>
      </SafeAreaView>
    );
  }

  if (result.status === "invalid") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ width: "92%", alignSelf: "center", marginTop: 30 }}>
          <Text style={styles.title}>{uiText("Workout Recovery Issue")}</Text>
          <Text style={{ color: palette.textMuted, textAlign: "center", marginBottom: 24, lineHeight: 21 }}>
            {uiText("An unfinished workout was found, but its saved recovery state cannot be safely restored.")}
            {result.issue ? `\n\n${result.issue}` : ""}
          </Text>
          <PrimaryButton
            title={uiText("DISCARD UNUSABLE RECOVERY")}
            onPress={() => {
              Alert.alert(
                uiText("Discard unusable recovery?"),
                uiText("The corrupted recovery snapshot will be removed. Completed workout history is not affected."),
                [
                  { text: uiText("Cancel"), style: "cancel" },
                  {
                    text: uiText("Discard"),
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
        <Text style={styles.title}>{uiText("No interrupted workout found.")}</Text>
        <PrimaryButton title={uiText("Return Home")} onPress={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  const resume = async () => {
    const resumed = await resumeActiveWorkout();
    if (!resumed) return;
    // Observation only. A legacy or mismatched lock must never be reconstructed
    // from mutable resumed session results or block contents.
    try {
      const identity = {
        programId: resumed.programId,
        weekIndex: resumed.weekIndex,
        dayIndex: resumed.dayIndex,
        startWorkoutTime: resumed.startWorkoutTime,
      };
      const locked = await loadLockedWorkoutPrescription(identity);
      const status = classifyResumedPrescription(identity, locked);
      if (__DEV__ && status !== "matched") {
        console.warn("[PBH prescription] Resumed workout lock unavailable", { status });
      }
    } catch (error) {
      if (__DEV__) console.warn("[PBH prescription] Resume lock read failed", error);
    }
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
      uiText("Discard interrupted workout?"),
      uiText("The recoverable workout state will be removed. Completed workout history is not affected."),
      [
        { text: uiText("Cancel"), style: "cancel" },
        {
          text: uiText("Discard"),
          style: "destructive",
          onPress: async () => {
            await clearActiveWorkoutIfSession(snapshot.sessionId);
            router.replace("/");
          },
        },
      ],
    );
  };

  const absence = formatAbsence(snapshot.interruption?.absenceMs, language);
  const integrity = result.integrity;
  const context = integrity?.context;
  const lastSaved = integrity ? formatSnapshotAge(integrity.ageMs, language) : null;
  const isStale = integrity?.age === "stale" || integrity?.age === "veryStale";

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: "92%", alignSelf: "center", marginTop: 30 }}>
        <Text style={styles.title}>{uiText("Interrupted Workout Found")}</Text>
        <Text style={{ color: palette.textMuted, textAlign: "center", marginBottom: 8, lineHeight: 21 }}>
          {uiText("Week")} {snapshot.weekIndex + 1} · {uiText("Day")} {snapshot.dayIndex + 1}
          {context?.blockTitle ? ` · ${workoutTitle(context.blockTitle)}` : ""}
        </Text>

        {context?.exerciseName ? (
          <Text style={{ color: palette.text, textAlign: "center", marginBottom: 8, fontWeight: "700" }}>
            {exerciseName(context.exerciseId, context.exerciseName)}
            {context.setNumber ? ` · ${uiText("Set")} ${context.setNumber}` : ""}
          </Text>
        ) : null}

        {lastSaved ? (
          <Text style={{ color: palette.textMuted, textAlign: "center", marginBottom: 12 }}>
            {uiText("Last active:")} {lastSaved}
          </Text>
        ) : null}

        {isStale ? (
          <View style={{ borderWidth: 1, borderColor: "#FFD54F", borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: "#FFD54F", textAlign: "center", lineHeight: 20, fontWeight: "700" }}>
              {integrity?.age === "veryStale"
                ? uiText("This recovery is more than 7 days old.")
                : uiText("This recovery is more than 24 hours old.")}
            </Text>
            <Text style={{ color: palette.textMuted, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              {uiText("You can still resume it, but confirm this is the workout you intend to continue.")}
            </Text>
          </View>
        ) : null}

        <Text style={{ color: palette.textMuted, textAlign: "center", marginBottom: 12, lineHeight: 21 }}>
          {uiText("You can continue the live workout, or complete the missing results manually without timers.")}
        </Text>

        {snapshot.interruption?.kind === "processRestart" ? (
          <Text style={{ color: palette.textMuted, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            {language === "pt-PT" ? `A aplicação reiniciou durante este treino${absence ? ` após uma ausência de aproximadamente ${absence}` : ""}. O tempo com a aplicação fechada não foi adicionado à duração do treino.` : `The app restarted during this workout${absence ? ` after approximately ${absence} away` : ""}. Closed-app time has not been added to the workout duration.`}
          </Text>
        ) : null}
        <PrimaryButton title={uiText("RESUME WORKOUT")} onPress={resume} />
        <PrimaryButton
          title={uiText("COMPLETE / EDIT REMAINING")}
          onPress={() => router.push("/screens/manualWorkoutRecovery" as any)}
        />
        <PrimaryButton title={uiText("DISCARD WORKOUT")} onPress={discard} />
      </View>
    </SafeAreaView>
  );
}

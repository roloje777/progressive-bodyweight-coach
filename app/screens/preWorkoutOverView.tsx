//preWorkoutOverview.tsx
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { buildSession } from "../../engine/sessionBuilder";
import { useProgress } from "@/hooks/useProgress";
import { useAdaptiveRestSettings } from "@/hooks/useAdaptiveRestSettings";
import { estimateSessionDuration } from "@/utils/estimateSessionDuration";
import { useAppStyles } from "@/styles/appStyles"; // ✅ import your shared styles
import { useAppPalette } from "@/hooks/use-app-palette";
import {
  normalizeWorkoutExercise,
  normalizeWarmupExercise,
  normalizeStretchExercise,
} from "@/utils/normalizeExercises";
import AppIcon from "../../components/AppIcon";
import { hydrateExercise } from "@/utils/hydrateExercise";
import PrimaryButton from "@/components/PrimaryButton";
import { createActiveWorkout } from "@/storage/activeWorkoutStorage";
import { useWorkoutRecoverySettings } from "@/hooks/useWorkoutRecoverySettings";
import { saveStartedProgramPosition } from "@/storage/workoutStartStorage";
import { useTranslation } from "@/hooks/useTranslation";

export default function PreWorkoutOverview() {
  const appStyles = useAppStyles();
  const palette = useAppPalette();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t, exerciseName, workoutTitle } = useTranslation();


  const { adaptiveRestConfig } = useAdaptiveRestSettings();
  const { workoutRecoveryConfig } = useWorkoutRecoverySettings();

  const {
    program,
    week,
    day: currentDayIndex,
    getDayStatus,
    adaptiveVolume,
    completedSessions,
    workoutReason,
    isLoaded,
  } = useProgress();

  if (!program) {

    return <Text style={appStyles.errorText}>{t("workout.loadingProgram")}</Text>;
  }


  const dayIndex = Number(params.dayIndex);
  const includeWarmup = params.includeWarmup === "true";
  const includeStretch = params.includeStretch === "true";
  const isGuidedRecovery = params.recoveryGuided === "true";

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= program.days.length) {
    console.warn("⚠️ Invalid dayIndex:", dayIndex);
    return <Text style={appStyles.errorText}>{t("workout.invalidDay")}</Text>;
  }

  if (!isLoaded) {
    return null;
  }

  const workoutStatus = getDayStatus(dayIndex);

  if (workoutStatus !== "current") {
    return (
      <SafeAreaView style={appStyles.container}>
        <Text style={appStyles.title}>
          {workoutStatus === "completed"
            ? t("workout.completed")
            : t("workout.locked")}
        </Text>

        <Text style={appStyles.errorText}>
          {workoutStatus === "completed"
            ? t("workout.alreadyCompleted")
            : t("workout.completeCurrentFirst")}
        </Text>

        <PrimaryButton title={t("common.back")}  onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const builtSession = buildSession(program, dayIndex, {
    includeWarmup,
    includeStretch,
    adaptiveVolume,
    completedSessions,
    workoutReason,
  });

  const session = isGuidedRecovery
    ? {
        ...builtSession,
        blocks: builtSession.blocks.filter((block: any) => {
          if (block.type === "warmup") return includeWarmup;
          if (block.type === "stretch") return includeStretch;
          return false;
        }),
      }
    : builtSession;



  // const allExercises = session.blocks.flatMap((b) => b.exercises);
  // const duration = estimateSessionDuration(allExercises);
  const normalizedExercises = session.blocks.flatMap((block) => {
    if (block.type === "warmup") {
      return block.exercises.map((exercise: any) =>
        normalizeWarmupExercise(hydrateExercise(exercise)),
      );
    }

    if (block.type === "stretch") {
      return block.exercises.map((exercise: any) =>
        normalizeStretchExercise(hydrateExercise(exercise)),
      );
    }

    return block.exercises.map((exercise: any) =>
      normalizeWorkoutExercise(hydrateExercise(exercise)),
    );
  });


  const duration = estimateSessionDuration(
    normalizedExercises,
    adaptiveRestConfig.defaultSetRestSeconds,
    adaptiveRestConfig.defaultExerciseRestSeconds,
  );


  if (!session.blocks.length) {
    return (
      <Text style={appStyles.errorText}>
        {t("workout.noExercisesSession")}
      </Text>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={appStyles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {isGuidedRecovery ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={appStyles.title}>{t("workout.guidedRecovery")}</Text>
            <Text
              style={{
                color: palette.info,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {t("workout.guidedRecoveryDescription")}
            </Text>
            <Text
              style={{
                color: palette.textMuted,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {t("workout.estimatedTime", { minutes: Math.round(duration / 60) })}
            </Text>
          </View>
        ) : (
          <Text style={appStyles.title}>
            {t("workout.estimatedTime", { minutes: Math.round(duration / 60) })}
          </Text>
        )}

        <ScrollView
          style={appStyles.screen}
          contentContainerStyle={appStyles.scrollContainer}
        >
          {session.blocks.map((block) => (
            <View key={block.id} style={appStyles.exerciseCard}>
              <Text style={appStyles.exerciseTitle}>{workoutTitle(block.title)}</Text>

              {/* Instruction Row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <AppIcon name="information-circle" />
                <Text
                  style={{
                    color: palette.primary,
                    fontSize: 14,
                    marginLeft: 6,
                  }}
                >
                  {t("workout.tapExerciseInstructions")}
                </Text>
              </View>

              {block.exercises.length ? (
                block.exercises.map((exercise: any, index: number) => {

                  const ex = hydrateExercise(exercise);

                  return (
                    <Pressable
                      key={ex.exerciseId}
                      onPress={() =>
                        router.push({
                          pathname: "/screens/exerciseGuideScreen",
                          params: {
                            exerciseId: ex.exerciseId,
                          },
                        })
                      }
                    >
                      <Text style={appStyles.exerciseName}>• {exerciseName(ex.exerciseId, ex.name)}</Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text
                  style={{
                    fontStyle: "italic",
                    color: palette.textMuted,
                  }}
                >
                  {t("workout.noExercisesBlock")}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            appStyles.startWorkoutContainer,
            {
              paddingBottom: 0,
            },
          ]}
        >
          <PrimaryButton
            title={isGuidedRecovery ? t("workout.startGuidedRecovery") : t("workout.startWorkout")}
            onPress={async () => {
              const startWorkoutTime = Date.now();

              // Guided pain recovery contains only the selected mobility/stretch
              // blocks, so there is no main block that can create results.workout.
              // Seed the recovery result before navigation so WorkoutSummary and
              // active-workout recovery always receive the required workout data.
              const sessionToStart = isGuidedRecovery
                ? {
                    ...session,
                    results: {
                      ...session.results,
                      workout: {
                        programId: program.id,
                        dayId: program.days[dayIndex].id,
                        completedAt: new Date(startWorkoutTime).toISOString(),
                        startWorkoutTime,
                        endWorkoutTime: startWorkoutTime,
                        workoutDuration: 0,
                        timeUnderTension: 0,
                        exercises: [],
                        sectionSkipped: true,
                        recoveryActivity: {
                          type: "guided-mobility" as const,
                          completed: true,
                        },
                      },
                    },
                  }
                : session;

              await saveStartedProgramPosition({
                programId: program.id,
                weekIndex: week,
                dayIndex,
              });

              if (workoutRecoveryConfig.enabled) {
                await createActiveWorkout({
                  programId: program.id,
                  weekIndex: week,
                  dayIndex,
                  startWorkoutTime,
                  session: sessionToStart,
                });
              }

              router.push({
                pathname: "/screens/workoutRunner",
                params: {
                  session: JSON.stringify(sessionToStart),
                  blockIndex: "0",
                  startWorkoutTime: startWorkoutTime.toString(), // Expo Router params are strings
                },
              });
            }}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

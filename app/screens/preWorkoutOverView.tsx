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
import { appStyles } from "@/styles/appStyles"; // ✅ import your shared styles
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

export default function PreWorkoutOverview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();


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

    return <Text style={appStyles.errorText}>Loading program...</Text>;
  }


  const dayIndex = Number(params.dayIndex);
  const includeWarmup = params.includeWarmup === "true";
  const includeStretch = params.includeStretch === "true";
  const isGuidedRecovery = params.recoveryGuided === "true";

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= program.days.length) {
    console.warn("⚠️ Invalid dayIndex:", dayIndex);
    return <Text style={appStyles.errorText}>Error: Invalid day index</Text>;
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
            ? "Workout Completed"
            : "Workout Locked"}
        </Text>

        <Text style={appStyles.errorText}>
          {workoutStatus === "completed"
            ? "This workout has already been completed."
            : "Complete the current workout before starting this one."}
        </Text>

        <PrimaryButton title="BACK" onPress={() => router.back()} />
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
        results: {
          ...builtSession.results,
          ...(builtSession.results?.workout
            ? {
                workout: {
                  ...builtSession.results.workout,
                  exercises: [],
                  sectionSkipped: true,
                  recoveryActivity: {
                    type: "guided-mobility" as const,
                    completed: true,
                  },
                },
              }
            : {}),
        },
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
        No exercises found for this session.
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
            <Text style={appStyles.title}>Guided Recovery</Text>
            <Text
              style={{
                color: "#B3E5FC",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Complete only the recovery blocks you selected. Stop or skip any
              movement that reproduces joint discomfort.
            </Text>
            <Text
              style={{
                color: "#aaa",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Estimated Time: {Math.round(duration / 60)} min
            </Text>
          </View>
        ) : (
          <Text style={appStyles.title}>
            Estimated Time: {Math.round(duration / 60)} min
          </Text>
        )}

        <ScrollView
          style={appStyles.screen}
          contentContainerStyle={appStyles.scrollContainer}
        >
          {session.blocks.map((block) => (
            <View key={block.id} style={appStyles.exerciseCard}>
              <Text style={appStyles.exerciseTitle}>{block.title}</Text>

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
                    color: "#FFD700",
                    fontSize: 14,
                    marginLeft: 6,
                  }}
                >
                  Tap an exercise for instructions →
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
                      <Text style={appStyles.exerciseName}>• {ex.name}</Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text
                  style={{
                    fontStyle: "italic",
                    color: "#777",
                  }}
                >
                  No exercises in this block.
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
            title={isGuidedRecovery ? "START GUIDED RECOVERY" : "START WORKOUT"}
            onPress={async () => {
              const startWorkoutTime = Date.now();

              if (workoutRecoveryConfig.enabled) {
                await createActiveWorkout({
                  programId: program.id,
                  weekIndex: week,
                  dayIndex,
                  startWorkoutTime,
                  session,
                });
              }

              router.push({
                pathname: "/screens/workoutRunner",
                params: {
                  session: JSON.stringify(session),
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

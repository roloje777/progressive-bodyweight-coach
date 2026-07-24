//preWorkoutOverview.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function PreWorkoutOverview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  console.log("🚀 URL params:", params);

  const { program } = useProgress();

  if (!program) {
    console.log("⚠️ Program not loaded yet");
    return <Text style={appStyles.errorText}>Loading program...</Text>;
  }

  console.log("📦 Program:", program);

  const dayIndex = Number(params.dayIndex);
  const includeWarmup = params.includeWarmup === "true";
  const includeStretch = params.includeStretch === "true";

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= program.days.length) {
    console.warn("⚠️ Invalid dayIndex:", dayIndex);
    return <Text style={appStyles.errorText}>Error: Invalid day index</Text>;
  }

  const session = buildSession(program, dayIndex, {
    includeWarmup,
    includeStretch,
  });

  console.log("📝 Built session:", session);

  // Debug info
  console.log(
    "Exercise counts per block:",
    session.blocks.map((b) => ({
      block: b.title,
      exercises: b.exercises.length,
      sets: b.exercises.map((ex: any) => ex.sets),
    })),
  );

  console.log(
    "🧪 STRETCH RAW:",
    session.blocks.find((b) => b.type === "stretch"),
  );

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

  // 👇 ADD IT HERE
  console.log("🧪 NORMALIZED:", JSON.stringify(normalizedExercises, null, 2));

  const duration = estimateSessionDuration(
    normalizedExercises,
    program.restBetweenSets,
    program.restBetweenExercises,
  );

  console.log("⏱ Estimated duration (seconds):", duration);

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
        <Text style={appStyles.title}>
          Estimated Time: {Math.round(duration / 60)} min
        </Text>

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
                  console.log(
                    `🧪 Block=${block.title} ExerciseIndex=${index}`,
                    JSON.stringify(exercise, null, 2),
                  );

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
              paddingBottom:  0,
            },
          ]}
        >
          <PrimaryButton
            title="START WORKOUT"
            onPress={() => {
              const startWorkoutTime = Date.now();
              console.log("startWorkoutTime  :" + startWorkoutTime);

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

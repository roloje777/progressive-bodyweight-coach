// app/screens/WorkoutSummary.tsx

import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { saveCompletedWorkout } from "../../storage/workoutStorage";
import { appStyles as styles } from "../../styles/appStyles";
import { useProgress } from "@/hooks/useProgress";
import { FeedbackCard } from "@/components/FeedbackCard";
import { hydrateExercise } from "@/utils/hydrateExercise";
import { evaluateProgramLifecycle } from "@/engine/ProgramLifecycleEngine";

export default function WorkoutSummary() {
  const [feedback, setFeedback] = React.useState<{
    rating: number | null;
    tags: string[];
    comment: string;
  } | null>(null);
  const params = useLocalSearchParams();
  const session = JSON.parse(params.session as string);

  const {
    program,
    completeWorkout,
    saveWorkoutProgress,
    programIndex,
    week,
    day,
  } = useProgress();

  const workout = session.results?.workout;

  //   const enrichedWorkout = React.useMemo(() => {
  //   if (!feedback) return workout;

  //   return {
  //     ...workout,
  //     feedback,
  //   };
  // }, [workout, feedback]);

  const enrichedWorkout = feedback ? { ...workout, feedback } : workout;

  // ✅ Guard
  if (!workout) {
    return (
      <View style={styles.container}>
        <Text>No workout data available</Text>
      </View>
    );
  }

  // ✅ Format date
  const formatDate = (date: string) => {
    const d = new Date(date);

    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();

    return `${weekday} the ${dayNum} of ${month} ${year}`;
  };

  // ✅ Random message
  const messages = [
    "Great work today. Consistency builds strength.",
    "Another step forward. Your future self thanks you.",
    "Discipline beats motivation. You showed both today.",
    "Progress happens one workout at a time.",
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  const getExerciseName = (exerciseId: string) => {
    const programExercise = program.days
      .flatMap((d) => d.exercises)
      .find((e) => e.exerciseId === exerciseId);

    if (!programExercise) {
      return exerciseId;
    }

    const hydrated = hydrateExercise(programExercise);

    return hydrated.name;
  };

  // ✅ 🔥 THIS WAS MISSING (CORE FIX)
  const renderExercise = ({ item }: any) => {
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.exerciseTitle}>
          {getExerciseName(item.exerciseId)}
        </Text>

        {item.sets.map((set: any, index: number) => {
          let value = "-";

          // ✅ NORMAL REPS
          if (set.repsCompleted !== undefined) {
            value = `${set.repsCompleted} reps`;
          }

          // ✅ ALTERNATING REPS
          else if (set.repsLeft !== undefined && set.repsRight !== undefined) {
            value = `L:${set.repsLeft} | R:${set.repsRight}`;
          }

          // ✅ 🧠 HANDLE BOTH HOLD FORMATS
          else if (
            set.durationLeft !== undefined &&
            set.durationRight !== undefined
          ) {
            value = `L:${set.durationLeft} sec | R:${set.durationRight} sec`;
          }

          // 🔥 fallback for OLD / BROKEN DATA SHAPE
          else if (set.duration?.left !== undefined) {
            value = `L:${set.duration.left} sec | R:${set.duration.right} sec`;
          }

          // ✅ NORMAL HOLD
          else if (set.durationSeconds !== undefined) {
            value = `${set.durationSeconds} sec`;
          }

          return (
            <Text key={index} style={styles.setText}>
              Set {index + 1}: {value}
            </Text>
          );
        })}
      </View>
    );
  };

  // ✅ Complete workout handler
  const handleCompleteWorkout = async () => {
    await saveCompletedWorkout(enrichedWorkout);

    console.log("FINAL WORKOUT DATA:", enrichedWorkout);

    // const lifecycleResult = await evaluateProgramLifecycle(
    //   workout.programId,
    //   4,
    // );

    const currentBlock = Math.floor(week / 4);

    const lifecycleResult = await evaluateProgramLifecycle(
      workout.programId,
      currentBlock,
    );

    // -----------------------------------
    // 🏁 BLOCK EVALUATION
    // -----------------------------------

    if (lifecycleResult?.blockComplete) {
      const report = lifecycleResult.readinessReport;

      if (!report) return;

      console.log("🏁 BLOCK COMPLETE");

      console.log("Recommendation:", report.recommendation);

      if (report.recommendation === "advance") {
        console.log("⬆️ Advance to next level");

        // TODO:
        // move to next program
        // reset week/day
        // preserve athlete profile
      }

      if (report.recommendation === "repeat") {
        console.log("🔁 Repeat current block");

        // TODO:
        // repeat same program
        // keep progression data
      }

      if (report.recommendation === "deload") {
        console.log("⬇️ Deload recommended");

        // TODO:
        // reduce volume
        // reduce sets
        // increase rest periods
      }
    }

    // -----------------------------------
    // EXISTING WORKOUT PROGRESS
    // -----------------------------------

    const mainBlock = session.blocks.find((b: any) => b.type === "main");

    const totalSets =
      mainBlock?.exercises.reduce((acc: number, ex: any) => acc + ex.sets, 0) ??
      0;

    const completedSets = workout.exercises.reduce(
      (acc: number, ex: any) => acc + ex.sets.length,
      0,
    );

    saveWorkoutProgress(programIndex, week, day, {
      completedSets,
      totalSets,
      completed: completedSets === totalSets,
    });

    completeWorkout();

    router.replace("/");
  };

  // ✅ UI
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >      
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Text style={styles.title}>Workout Complete</Text>

        <Text style={styles.summaryDate}>{formatDate(workout.date)}</Text>

        <FlatList
          style={styles.summaryContainer}
          data={workout.exercises}
          keyExtractor={(item) => item.exerciseId}
          renderItem={renderExercise}
          ListFooterComponent={
            <>
              <Text style={styles.summaryMessage}>{message}</Text>

              <FeedbackCard onChange={(data) => setFeedback(data)} />

              <TouchableOpacity
                style={styles.completeWorkoutButton}
                onPress={handleCompleteWorkout}
              >
                <Text style={styles.buttonText}>Complete Workout</Text>
              </TouchableOpacity>
            </>
          }
          contentContainerStyle={{
            paddingBottom: 80,
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// app/screens/WorkoutSummary.tsx

import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { saveCompletedWorkout } from "../../storage/workoutStorage";
import { appStyles as styles } from "../../styles/appStyles";
import { useProgress } from "@/hooks/useProgress";

export default function WorkoutSummary() {
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

  // ✅ Resolve exercise name
  // const getExerciseName = (exerciseId: string) => {
  //   const exercise = beginnerProgram.days
  //     .flatMap((d) => d.exercises)
  //     .find((e) => e.id === exerciseId);

  //   return exercise?.name ?? exerciseId;
  // };

  const getExerciseName = (exerciseId: string) => {
    const exercise = program.days
      .flatMap((d) => d.exercises)
      .find((e) => e.id === exerciseId);

    return exercise?.name ?? exerciseId;
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
    await saveCompletedWorkout(workout);

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
    <View style={styles.container}>
      <Text style={styles.title}>Workout Complete</Text>

      <Text style={styles.summaryDate}>{formatDate(workout.date)}</Text>

      <FlatList
        style={styles.summaryContainer}
        data={workout.exercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={renderExercise}
      />

      <Text style={styles.summaryMessage}>{message}</Text>

      <TouchableOpacity style={styles.button} onPress={handleCompleteWorkout}>
        <Text style={styles.buttonText}>Complete Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

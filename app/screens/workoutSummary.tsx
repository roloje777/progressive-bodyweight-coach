// app/screens/WorkoutSummary.tsx

import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { saveCompletedWorkout } from "../../storage/workoutStorage";
import { beginnerProgram } from "../../data/beginnerProgram";
import { appStyles as styles } from "../../styles/appStyles";
import { useProgress } from "@/hooks/useProgress";

export default function WorkoutSummary() {
  const params = useLocalSearchParams();
  const session = JSON.parse(params.session as string);

  const { completeWorkout, saveWorkoutProgress, programIndex, week, day } =
    useProgress();
  const workout = session.results?.workout;
  // ✅ 👉 ADD IT HERE (early return guard)
  if (!workout) {
    return (
      <View>
        <Text>No workout data available</Text>
      </View>
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);

    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();

    return `${weekday} the ${day} of ${month} ${year}`;
  };

  const messages = [
    "Great work today. Consistency builds strength.",
    "Another step forward. Your future self thanks you.",
    "Discipline beats motivation. You showed both today.",
    "Progress happens one workout at a time.",
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  console.log("SESSION:", session);
  console.log("WORKOUT:", workout);

  const handleCompleteWorkout = async () => {
    await saveCompletedWorkout(workout);

  const mainBlock = session.blocks.find((b: any) => b.type === "main");

const totalSets =
  mainBlock?.exercises.reduce(
    (acc: number, ex: any) => acc + ex.sets,
    0
  ) ?? 0;

    const completedSets = workout.exercises.reduce(
      (acc: number, ex: any) => acc + ex.sets.length,
      0,
    );

    console.log("SETS:", { completedSets, totalSets });

    saveWorkoutProgress(programIndex, week, day, {
      completedSets,
      totalSets,
      completed: completedSets === totalSets,
    });

    completeWorkout();

    router.replace("/");
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = beginnerProgram.days
      .flatMap((d) => d.exercises)
      .find((e) => e.id === exerciseId);

    return exercise?.name ?? exerciseId;
  };

  const renderExercise = ({ item }: any) => {
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.exerciseTitle}>
          {getExerciseName(item.exerciseId)}
        </Text>

        {item.sets.map((set: any, index: number) => {
          let value = "";

          if (set.repsCompleted !== undefined)
            value = `${set.repsCompleted} reps`;
          if (set.durationSeconds !== undefined)
            value = `${set.durationSeconds} sec`;

          return (
            <Text key={index} style={styles.setText}>
              Set {index + 1}: {value}
            </Text>
          );
        })}
      </View>
    );
  };

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

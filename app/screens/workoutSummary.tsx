// app/screens/WorkoutSummary.tsx

import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { saveCompletedWorkout } from "../../storage/workoutStorage";
import { beginnerProgram } from "../../data/beginnerProgram";

export default function WorkoutSummary() {
  const params = useLocalSearchParams();
  const workout: CompletedWorkout = JSON.parse(params.workout as string);

  const program = beginnerProgram;

  const formatDate = (date: string) => {
    const d = new Date(date);

    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();

    return `${weekday} the ${day} of ${month} ${year}`;
  };

  const motivationalMessages = [
    "Great work today. Consistency builds strength.",
    "Another step forward. Your future self thanks you.",
    "Discipline beats motivation. You showed both today.",
    "Progress happens one workout at a time.",
  ];

  const message =
    motivationalMessages[
      Math.floor(Math.random() * motivationalMessages.length)
    ];

  const handleCompleteWorkout = async () => {
    await saveCompletedWorkout(workout);

    router.replace("/screens/history");
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = program.days
      .flatMap((d) => d.exercises)
      .find((e) => e.id === exerciseId);

    return exercise?.name ?? exerciseId;
  };

  const renderExercise = ({ item }: any) => {
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.exerciseTitle}>
          {getExerciseName(item.exerciseId)}
        </Text>

        {item.sets.map((set: any, index: number) => {
          let value = "";

          if (set.repsCompleted) value = `${set.repsCompleted} reps`;
          if (set.durationSeconds) value = `${set.durationSeconds} sec`;

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

      <Text style={styles.programName}>{program.name}</Text>
      <Text style={styles.programDesc}>{program.description}</Text>

      <Text style={styles.date}>{formatDate(workout.date)}</Text>

      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={renderExercise}
      />

      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCompleteWorkout}
      >
        <Text style={styles.buttonText}>Complete Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },

  programName: {
    fontSize: 20,
    color: "#FFD700",
    textAlign: "center",
  },

  programDesc: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 10,
  },

  date: {
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },

  exerciseCard: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  exerciseTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 5,
  },

  setText: {
    color: "#ddd",
  },

  message: {
    fontSize: 18,
    color: "#FFD700",
    textAlign: "center",
    marginVertical: 20,
  },

  button: {
    backgroundColor: "#FF6B00",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
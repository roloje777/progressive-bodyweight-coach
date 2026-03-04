import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";

export default function WorkoutDetailScreen() {
  const { workout } = useLocalSearchParams();

  if (!workout || typeof workout !== "string") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No workout data found.</Text>
      </View>
    );
  }

  const parsedWorkout: CompletedWorkout = JSON.parse(workout);

  // 🔹 Find program
  const program = programs.find((p) => p.id === parsedWorkout.programId);

  // 🔹 Find day
  const day = program?.days.find((d) => d.id === parsedWorkout.dayId);

  // 🔹 Helper: Get readable day name
  const getDayName = () => {
    return day?.title ?? parsedWorkout.dayId;
  };

  // 🔹 Helper: Get readable exercise name
  const getExerciseName = (exerciseId: string) => {
    const exercise = day?.exercises.find((ex) => ex.id === exerciseId);
    return exercise?.name ?? exerciseId;
  };

  // 🔹 Calculate total time per exercise
  const calculateExerciseTotal = (exercise: any) => {
    return exercise.sets.reduce(
      (sum: number, set: any) => sum + (set.durationSeconds || 0),
      0,
    );
  };

  // 🔹 Calculate total workout time
  const calculateWorkoutTotal = (workout: CompletedWorkout) => {
    return workout.exercises.reduce((total, exercise) => {
      return total + calculateExerciseTotal(exercise);
    }, 0);
  };

  const totalWorkoutTime = calculateWorkoutTotal(parsedWorkout);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout Detail</Text>

      <Text style={styles.header}>
        {new Date(parsedWorkout.date).toLocaleString()}
      </Text>

      <Text style={styles.subHeader}>Day: {getDayName()}</Text>

      <Text style={styles.totalWorkout}>
        Total Time: {totalWorkoutTime.toFixed(1)} sec
      </Text>

      {parsedWorkout.exercises.map((exercise) => {
        const exerciseTotal = calculateExerciseTotal(exercise);

        return (
          <View key={exercise.exerciseId} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>{getExerciseName(exercise.exerciseId)}</Text>

            <Text style={styles.exerciseTotal}>
              Total: {exerciseTotal.toFixed(1)} sec
            </Text>

            {exercise.sets.map((set) => (
              <Text key={set.setNumber} style={styles.setText}>
                Set {set.setNumber}: {set.durationSeconds?.toFixed(1) ?? 0} sec
              </Text>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
    fontWeight: "bold",
  },
  header: {
    color: "white",
    fontWeight: "600",
    marginBottom: 5,
  },
  subHeader: {
    color: "#aaa",
    marginBottom: 10,
  },
  totalWorkout: {
    color: "#4CAF50",
    marginBottom: 20,
    fontWeight: "bold",
    fontSize: 16,
  },
  exerciseCard: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  exerciseTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  exerciseTotal: {
    color: "#4CAF50",
    marginBottom: 5,
  },
  setText: {
    color: "#ccc",
  },
  errorText: {
    color: "white",
    fontSize: 16,
  },
});

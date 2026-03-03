import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CompletedWorkout } from "../../models/WorkoutLog";

export default function WorkoutDetailScreen() {
  const { workout } = useLocalSearchParams();

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>No workout data found.</Text>
      </View>
    );
  }

  const parsedWorkout: CompletedWorkout = JSON.parse(
    workout as string
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout Detail</Text>

      <Text style={styles.header}>
        {new Date(parsedWorkout.date).toLocaleString()}
      </Text>

      <Text style={styles.subHeader}>
        Day: {parsedWorkout.dayId}
      </Text>

      {parsedWorkout.exercises.map((exercise) => (
        <View key={exercise.exerciseId} style={styles.exerciseCard}>
          <Text style={styles.exerciseTitle}>
            {exercise.exerciseId}
          </Text>

          {exercise.sets.map((set) => (
            <Text key={set.setNumber} style={styles.setText}>
              Set {set.setNumber}: {set.durationSeconds?.toFixed(1)} sec
            </Text>
          ))}
        </View>
      ))}
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
  },
  header: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  subHeader: {
    color: "#aaa",
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
    fontWeight: "bold",
    marginBottom: 5,
  },
  setText: {
    color: "#ccc",
  },
});
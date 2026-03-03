import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { getWorkoutHistory } from "../../storage/workoutStorage";
import { CompletedWorkout } from "../../models/WorkoutLog";

export default function HistoryScreen() {
  const [history, setHistory] = useState<CompletedWorkout[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getWorkoutHistory();
    setHistory(data.reverse()); // newest first
  };

  const calculateTotalSets = (workout: CompletedWorkout) => {
    return workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.length;
    }, 0);
  };

  const calculateTotalTime = (workout: CompletedWorkout) => {
    return workout.exercises.reduce((total, exercise) => {
      const exerciseTime = exercise.sets.reduce(
        (sum, set) => sum + (set.durationSeconds || 0),
        0
      );
      return total + exerciseTime;
    }, 0);
  };

  const renderItem = ({ item }: { item: CompletedWorkout }) => {
    const totalSets = calculateTotalSets(item);
    const totalTime = calculateTotalTime(item);

    return (
      <View style={styles.card}>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>

        <Text>Day: {item.dayId}</Text>
        <Text>Total Sets: {totalSets}</Text>
        <Text>Total Time: {totalTime.toFixed(1)} sec</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>

      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#111",
  },
  title: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#222",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  date: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
});


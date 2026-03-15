import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { getWorkoutHistory } from "../../storage/workoutStorage";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { router } from "expo-router";
import { appStyles as styles } from "../styles/appStyles";

export default function HistoryScreen() {
  const [history, setHistory] = useState<CompletedWorkout[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getWorkoutHistory();
    setHistory(data.reverse());
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
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/screens/workoutDetail",
            params: { workout: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.historyCard}>
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>

          <Text style={styles.historyText}>Day: {item.dayId}</Text>
          <Text style={styles.historyText}>Total Sets: {totalSets}</Text>
          <Text style={styles.historyText}>
            Total Time: {totalTime.toFixed(1)} sec
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Workout History</Text>

        <FlatList
          data={history}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
        />
      </View>
    </View>
  );
}
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable,  KeyboardAvoidingView, Platform} from "react-native";
import { getWorkoutHistory } from "../../storage/workoutStorage";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { router } from "expo-router";
import { appStyles as styles } from "../../styles/appStyles";


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




  const renderItem = ({ item }: { item: CompletedWorkout }) => {
    const totalSets = calculateTotalSets(item);
  

       // ✅ Format date
  const formatDate = (timestamp:number) => {
    const d = new Date(timestamp);

    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();
    console.log(`${weekday} the ${dayNum} of ${month} ${year} `);

    return `${weekday} the ${dayNum} of ${month} ${year} `;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

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
            {formatDate(item.startWorkoutTime)}
          </Text>
        <Text style={styles.historyText}>{item.programId.toUpperCase()}</Text>
          <Text style={styles.historyText}>Day: {item.dayId}</Text>
          <Text style={styles.historyText}>Total Sets: {totalSets}</Text>
          <Text style={styles.historyText}>
              Workout Duration: {formatTime(item.workoutDuration)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Workout History</Text>

        <FlatList
          data={history}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  </KeyboardAvoidingView>
);
  


}
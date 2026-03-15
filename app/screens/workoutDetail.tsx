import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";
import { appStyles as styles } from "../styles/appStyles";

export default function WorkoutDetailScreen() {
  const { workout } = useLocalSearchParams();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

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

  const calculateWorkoutTotals = (workout: CompletedWorkout) => {
    let totalTime = 0;
    let totalReps = 0;
    let totalSets = 0;

    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set: any) => {
        totalTime += getSetDuration(set);
        totalReps += set.repsCompleted || 0;
        totalSets += 1;
      });
    });

    return { totalTime, totalReps, totalSets };
  };
  //Calculate set duration (all exercise types)
  const getSetDuration = (set: any) => {
    if (set.durationSeconds) return set.durationSeconds;

    if (set.phaseDurations) {
      return set.phaseDurations.reduce((a: number, b: number) => a + b, 0);
    }

    return 0;
  };

  // Calculate exercise totals
  const calculateExerciseTotals = (exercise: any) => {
    let totalTime = 0;
    let totalReps = 0;

    exercise.sets.forEach((set: any) => {
      totalTime += getSetDuration(set);
      totalReps += set.repsCompleted || 0;
    });

    return { totalTime, totalReps, totalSets: exercise.sets.length };
  };

  // const totalWorkoutTime = calculateWorkoutTotal(parsedWorkout);
  const totals = calculateWorkoutTotals(parsedWorkout);
  // console.log(parsedWorkout);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Workout Detail</Text>

      <Text style={styles.header}>
        {new Date(parsedWorkout.date).toLocaleString()}
      </Text>

      <Text style={styles.subHeader}>Day: {getDayName()}</Text>

      {/* <Text style={styles.totalWorkout}>
        Total Time: {totalWorkoutTime.toFixed(1)} sec
      </Text> */}

      <Text style={styles.totalWorkout}>
        Total Time: {formatTime(totals.totalTime)}
      </Text>

      <Text style={styles.totalWorkout}>
        Total Sets: {totals.totalSets} sets
      </Text>

      <Text style={styles.totalWorkout}>
        Total Reps: {totals.totalReps} reps
      </Text>

      {parsedWorkout.exercises.map((exercise) => {
        const totals = calculateExerciseTotals(exercise);

        return (
          <View key={exercise.exerciseId} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>
              {getExerciseName(exercise.exerciseId)}
            </Text>

            {totals.totalTime > 0 && (
              <Text style={styles.exerciseTotal}>
                Total Time: {formatTime(totals.totalTime)}
              </Text>
            )}

            {totals.totalReps > 0 && (
              <Text style={styles.exerciseTotal}>
                Total Reps: {totals.totalReps}
              </Text>
            )}

            {exercise.sets.map((set: any) => {
              const duration = getSetDuration(set);

              return (
                <Text key={set.setNumber} style={styles.setText}>
                  Set {set.setNumber}:{" "}
                  {set.repsCompleted ? `${set.repsCompleted} reps` : ""}
                  {set.repsCompleted && duration > 0 ? " | " : ""}
                  {duration > 0 ? `${duration.toFixed(1)} sec` : ""}
                </Text>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

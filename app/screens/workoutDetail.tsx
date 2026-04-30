import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CompletedWorkout } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";
import { appStyles as styles } from "../../styles/appStyles";

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
        totalReps +=
          set.repsCompleted ?? (set.repsLeft ?? 0) + (set.repsRight ?? 0);
        totalSets += 1;
      });
    });

    return { totalTime, totalReps, totalSets };
  };
  //Calculate set duration (all exercise types)
 const getSetDuration = (set: any) => {
  // ✅ NORMAL HOLD
  if (set.durationSeconds) return set.durationSeconds;

  // ✅ PHASE-BASED
  if (set.phaseDurations) {
    return set.phaseDurations.reduce((a: number, b: number) => a + b, 0);
  }

  // 🔥 ✅ ALTERNATING HOLD (NEW FIX)
  if (
    set.durationLeft !== undefined &&
    set.durationRight !== undefined
  ) {
    return set.durationLeft + set.durationRight;
  }

  // 🔥 fallback old shape
  if (set.duration?.left !== undefined) {
    return set.duration.left + set.duration.right;
  }

  return 0;
};

  // Calculate exercise totals
  const calculateExerciseTotals = (exercise: any) => {
    let totalTime = 0;

    let totalReps = 0;

    let totalLeft = 0;
    let totalRight = 0;

    let totalLeftTime = 0;
    let totalRightTime = 0;

    exercise.sets.forEach((set: any) => {
      // ✅ total time (global)
      totalTime += getSetDuration(set);

      // ✅ NORMAL REPS
      if (set.repsCompleted !== undefined) {
        totalReps += set.repsCompleted;
      }

      // ✅ ALTERNATING REPS
      else if (set.repsLeft !== undefined && set.repsRight !== undefined) {
        totalLeft += set.repsLeft;
        totalRight += set.repsRight;
      }

      // ✅ 🔥 ALTERNATING HOLD (NEW FIX)
      else if (
        set.durationLeft !== undefined &&
        set.durationRight !== undefined
      ) {
        totalLeftTime += set.durationLeft;
        totalRightTime += set.durationRight;
      }

      // 🔥 fallback old shape
      else if (set.duration?.left !== undefined) {
        totalLeftTime += set.duration.left;
        totalRightTime += set.duration.right;
      }
    });

    return {
      totalTime,
      totalReps,
      totalLeft,
      totalRight,
      totalLeftTime,
      totalRightTime,
      totalSets: exercise.sets.length,
    };
  };

  // const totalWorkoutTime = calculateWorkoutTotal(parsedWorkout);
  const totals = calculateWorkoutTotals(parsedWorkout);
  // console.log(parsedWorkout);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Workout Detail</Text>

        <Text style={styles.header}>
          {new Date(parsedWorkout.date).toLocaleString()}
        </Text>

        <Text style={styles.subHeader}>Day: {getDayName()}</Text>

        {/* <Text style={styles.totalWorkout}>
        Total Time (Work): {totalWorkoutTime.toFixed(1)} sec
      </Text> */}

        <Text style={styles.totalWorkout}>
          Total Time (Work): {formatTime(totals.totalTime)}
        </Text>

        <Text style={styles.totalWorkout}>
          Total Sets: {totals.totalSets} sets
        </Text>

        <Text style={styles.totalWorkout}>
          Total Reps: {totals.totalReps} reps
        </Text>

        {parsedWorkout.exercises.map((exercise) => {
          const totals = calculateExerciseTotals(exercise);

          const repImbalance = Math.abs(totals.totalLeft - totals.totalRight);
          const timeImbalance = Math.abs(
            totals.totalLeftTime - totals.totalRightTime,
          );

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

              {/* ✅ ADD HERE */}
              {(totals.totalLeftTime > 0 || totals.totalRightTime > 0) && (
                <Text style={styles.exerciseTotal}>
                  Total Time: L:{totals.totalLeftTime}s | R:
                  {totals.totalRightTime}s
                </Text>
              )}

              {/* ✅ NORMAL */}
              {totals.totalReps > 0 && (
                <Text style={styles.exerciseTotal}>
                  Total Reps: {totals.totalReps}
                </Text>
              )}

              {/* ✅ ALTERNATING */}
              {(totals.totalLeft > 0 || totals.totalRight > 0) && (
                <Text style={styles.exerciseTotal}>
                  Total Reps: L:{totals.totalLeft} | R:{totals.totalRight}
                </Text>
              )}

              {/* ✅ REPS IMBALANCE */}
              {repImbalance > 0 && (
                <Text style={{ color: "#FF6B6B" }}>
                  Imbalance: {repImbalance} reps (
                  {(
                    repImbalance /
                    (totals.totalLeft + totals.totalRight)*100
                  ).toFixed(1)}
                  %)
                </Text>
              )}

              {/* ✅ HOLD IMBALANCE */}
              {timeImbalance > 0 && (
                <Text style={{ color: "#FF6B6B" }}>
                  Imbalance: {timeImbalance}s (
                  {(
                    timeImbalance /
                    (totals.totalLeftTime + totals.totalRightTime)*100
                  ).toFixed(1)}
                  %)
                </Text>
              )}

              {exercise.sets.map((set: any, index: number) => {
                let value = "";

                // ✅ NORMAL REPS
                if (set.repsCompleted !== undefined) {
                  value = `${set.repsCompleted} reps`;
                }

                // ✅ ALTERNATING REPS
                else if (
                  set.repsLeft !== undefined &&
                  set.repsRight !== undefined
                ) {
                  value = `L:${set.repsLeft} | R:${set.repsRight}`;
                }

                // ✅ 🔥 ALTERNATING HOLD (correct shape)
                else if (
                  set.durationLeft !== undefined &&
                  set.durationRight !== undefined
                ) {
                  value = `L:${set.durationLeft} sec | R:${set.durationRight} sec`;
                }

                // 🔥 fallback for old shape
                else if (set.duration?.left !== undefined) {
                  value = `L:${set.duration.left} sec | R:${set.duration.right} sec`;
                }

                // ✅ NORMAL HOLD
                else if (set.durationSeconds !== undefined) {
                  value = `${set.durationSeconds} sec`;
                }

                return (
                  
                  <Text
                    key={`${exercise.exerciseId}-${set.setNumber}-${index}`}
                    style={styles.setText}
                  >
                    Set {set.setNumber}: {value || "-"}
                  </Text>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

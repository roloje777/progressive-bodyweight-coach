// //app/screens/workoutDetails.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { CompletedSession } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";
import { appStyles as styles } from "../../styles/appStyles";
import { hydrateExercise } from "@/utils/hydrateExercise";

export default function WorkoutDetailScreen() {
  const { workout } = useLocalSearchParams();

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatClockTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!workout || typeof workout !== "string") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No workout data found.</Text>
      </View>
    );
  }

  // Format date
  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);

    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();

    const hour = d.getHours();
    const minute = d.getMinutes();

    return `${weekday} the ${dayNum} of ${month} ${year} at ${hour}:${minute}`;
  };

  const parsedWorkout: CompletedSession = JSON.parse(workout);

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
    const exercise = day?.exercises.find((ex) => ex.exerciseId === exerciseId);

    if (!exercise) return exerciseId;

    return hydrateExercise(exercise).name;
  };

  // ============================================================
  // SET DURATION
  // ============================================================

  const getSetDuration = (set: any) => {
    // Skipped sets do not contribute to time under tension.
    if (set.status === "skipped") {
      return 0;
    }

    // NORMAL HOLD
    if (set.durationSeconds !== undefined) {
      return set.durationSeconds;
    }

    // PHASE-BASED
    if (set.phaseDurations) {
      return set.phaseDurations.reduce(
        (total: number, duration: number) => total + duration,
        0,
      );
    }

    // ALTERNATING HOLD
    if (set.durationLeft !== undefined && set.durationRight !== undefined) {
      return set.durationLeft + set.durationRight;
    }

    // Fallback for old data shape
    if (set.duration?.left !== undefined) {
      return set.duration.left + set.duration.right;
    }

    return 0;
  };

  // ============================================================
  // WORKOUT TOTALS
  // ============================================================

  const calculateWorkoutTotals = (workout: CompletedSession) => {
    let timeUnderTension = 0;
    let totalReps = 0;
    let totalSets = 0;
    let completedSets = 0;
    let skippedSets = 0;

    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set: any) => {
        totalSets += 1;

        if (set.status === "skipped") {
          skippedSets += 1;
          return;
        }

        completedSets += 1;

        timeUnderTension += getSetDuration(set);

        totalReps +=
          set.repsCompleted ?? (set.repsLeft ?? 0) + (set.repsRight ?? 0);
      });
    });

    return {
      timeUnderTension,
      totalReps,
      totalSets,
      completedSets,
      skippedSets,
    };
  };

  // ============================================================
  // EXERCISE TOTALS
  // ============================================================

  const calculateExerciseTotals = (exercise: any) => {
    let totalTime = 0;

    let totalReps = 0;

    let totalLeft = 0;
    let totalRight = 0;

    let totalLeftTime = 0;
    let totalRightTime = 0;

    let completedSets = 0;
    let skippedSets = 0;

    exercise.sets.forEach((set: any) => {
      // Skipped sets should not contribute to performance totals.
      if (set.status === "skipped") {
        skippedSets += 1;
        return;
      }

      completedSets += 1;

      // Total time
      totalTime += getSetDuration(set);

      // NORMAL REPS
      if (set.repsCompleted !== undefined) {
        totalReps += set.repsCompleted;
      }

      // ALTERNATING REPS
      else if (set.repsLeft !== undefined && set.repsRight !== undefined) {
        totalLeft += set.repsLeft;
        totalRight += set.repsRight;
      }

      // ALTERNATING HOLD
      else if (
        set.durationLeft !== undefined &&
        set.durationRight !== undefined
      ) {
        totalLeftTime += set.durationLeft;
        totalRightTime += set.durationRight;
      }

      // Fallback old shape
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
      completedSets,
      skippedSets,
    };
  };

  const totals = calculateWorkoutTotals(parsedWorkout);

  const warmup = parsedWorkout.warmup;
  const stretch = parsedWorkout.stretch;

  // ============================================================
  // OVERALL WORKOUT DURATION
  // ============================================================

  const totalWorkoutDuration =
    (parsedWorkout.endWorkoutTime - parsedWorkout.startWorkoutTime) / 1000;

  // ============================================================
  // SECTION EXERCISE NAMES
  // ============================================================

  const getSectionExerciseName = (exerciseId: string) => {
    const exercise = day?.exercises.find((ex) => ex.exerciseId === exerciseId);

    if (!exercise) return exerciseId;

    return hydrateExercise(exercise).name;
  };

  const mainWorkoutDuration =
    parsedWorkout.mainStartedAt !== undefined &&
    parsedWorkout.mainCompletedAt !== undefined
      ? (parsedWorkout.mainCompletedAt - parsedWorkout.mainStartedAt) / 1000
      : 0;

  // ============================================================
  // UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* ==========================================================
              HEADER
          ========================================================== */}

          <Text style={styles.title}>Workout Detail</Text>

          <Text style={styles.header}>
            {formatDateTime(parsedWorkout.startWorkoutTime)}
          </Text>

          <Text style={styles.subHeader}>
            {parsedWorkout.programId.toUpperCase()}
          </Text>

          <Text style={styles.subHeader}>Day: {getDayName()}</Text>

          <View style={styles.sectionDivider} />

          {/* ==========================================================
              GENERAL WORKOUT STATISTICS
          ========================================================== */}

          <Text style={styles.subHeader}>Workout Statistics</Text>

          <Text style={styles.totalWorkout}>
            Started: {formatClockTime(parsedWorkout.startWorkoutTime)}
          </Text>

          <Text style={styles.totalWorkout}>
            Finished: {formatClockTime(parsedWorkout.endWorkoutTime)}
          </Text>

          <Text style={styles.totalWorkout}>
            Total Workout Duration: {formatTime(totalWorkoutDuration)}
          </Text>

          {/* ==========================================================
              DYNAMIC WARM-UP
          ========================================================== */}

          {warmup && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.subHeader}>🔥 Dynamic Warm-up</Text>

              {/* Summary */}

              <Text style={styles.totalWorkout}>
                Completed: {warmup.completed.length}
              </Text>

              <Text style={styles.totalWorkout}>
                Skipped: {warmup.skipped.length}
              </Text>

              <Text style={styles.totalWorkout}>
                Section skipped: {warmup.sectionSkipped ? "Yes" : "No"}
              </Text>

              {parsedWorkout.warmupStartedAt !== undefined &&
                parsedWorkout.warmupCompletedAt !== undefined && (
                  <Text style={styles.totalWorkout}>
                    Duration:{" "}
                    {formatTime(
                      (parsedWorkout.warmupCompletedAt -
                        parsedWorkout.warmupStartedAt) /
                        1000,
                    )}
                  </Text>
                )}

              {/* Details */}
              <View style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>Details</Text>

                {warmup.completed.length > 0 && (
                  <>
                    <Text style={styles.exerciseTotal}>
                      Completed Exercises:
                    </Text>

                    {warmup.completed.map((exerciseId) => (
                      <Text
                        key={`warmup-completed-${exerciseId}`}
                        style={styles.setText}
                      >
                        ✓ {getSectionExerciseName(exerciseId)}
                      </Text>
                    ))}
                  </>
                )}

                {warmup.skipped.length > 0 && (
                  <>
                    <Text style={[styles.exerciseTotal, { marginTop: 8 }]}>
                      Skipped Exercises:
                    </Text>

                    {warmup.skipped.map((exerciseId) => (
                      <Text
                        key={`warmup-skipped-${exerciseId}`}
                        style={styles.setText}
                      >
                        ✕ {getSectionExerciseName(exerciseId)}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            </>
          )}

          {/* ==========================================================
              STATIC STRETCH
          ========================================================== */}

          {stretch && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.subHeader}>🧘 Static Stretch</Text>

              {/* Summary */}

              <Text style={styles.totalWorkout}>
                Completed: {stretch.completed.length}
              </Text>

              <Text style={styles.totalWorkout}>
                Skipped: {stretch.skipped.length}
              </Text>

              <Text style={styles.totalWorkout}>
                Section skipped: {stretch.sectionSkipped ? "Yes" : "No"}
              </Text>

              {parsedWorkout.stretchStartedAt !== undefined &&
                parsedWorkout.stretchCompletedAt !== undefined && (
                  <Text style={styles.totalWorkout}>
                    Duration:{" "}
                    {formatTime(
                      (parsedWorkout.stretchCompletedAt -
                        parsedWorkout.stretchStartedAt) /
                        1000,
                    )}
                  </Text>
                )}

              {/* Details */}
              <View style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>Details</Text>

                {stretch.completed.length > 0 && (
                  <>
                    <Text style={styles.exerciseTotal}>
                      Completed Stretches:
                    </Text>

                    {stretch.completed.map((exerciseId) => (
                      <Text
                        key={`stretch-completed-${exerciseId}`}
                        style={styles.setText}
                      >
                        ✓ {getSectionExerciseName(exerciseId)}
                      </Text>
                    ))}
                  </>
                )}

                {stretch.skipped.length > 0 && (
                  <>
                    <Text style={[styles.exerciseTotal, { marginTop: 8 }]}>
                      Skipped Stretches:
                    </Text>

                    {stretch.skipped.map((exerciseId) => (
                      <Text
                        key={`stretch-skipped-${exerciseId}`}
                        style={styles.setText}
                      >
                        ✕ {getSectionExerciseName(exerciseId)}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            </>
          )}

          {/* ==========================================================
              MAIN EXERCISES
          ========================================================== */}
          <View style={styles.sectionDivider} />

          <Text style={styles.subHeader}>💪 Main Exercises</Text>

          {parsedWorkout.mainStartedAt !== undefined &&
            parsedWorkout.mainCompletedAt !== undefined && (
              <Text style={styles.totalWorkout}>
                 Workout Duration: {formatTime(mainWorkoutDuration)}
              </Text>
            )}

          <Text style={styles.totalWorkout}>
            Total Sets: {totals.totalSets} sets
          </Text>

          <Text style={styles.totalWorkout}>
            Completed Sets: {totals.completedSets} sets
          </Text>

          <Text style={styles.totalWorkout}>
            Skipped Sets: {totals.skippedSets} sets
          </Text>

          <Text style={styles.totalWorkout}>
            Total Reps: {totals.totalReps} reps
          </Text>

          {parsedWorkout.exercises.map((exercise) => {
            const exerciseTotals = calculateExerciseTotals(exercise);

            const repImbalance = Math.abs(
              exerciseTotals.totalLeft - exerciseTotals.totalRight,
            );

            const timeImbalance = Math.abs(
              exerciseTotals.totalLeftTime - exerciseTotals.totalRightTime,
            );

            return (
              <View key={exercise.exerciseId} style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>
                  {getExerciseName(exercise.exerciseId)}
                </Text>

                {/* Summary */}

                <Text style={styles.exerciseTotal}>
                  Sets: {exerciseTotals.totalSets} | Completed:{" "}
                  {exerciseTotals.completedSets} | Skipped:{" "}
                  {exerciseTotals.skippedSets}
                </Text>

                {exerciseTotals.totalTime > 0 && (
                  <Text style={styles.exerciseTotal}>
                    Total Time: {formatTime(exerciseTotals.totalTime)}
                  </Text>
                )}

                {(exerciseTotals.totalLeftTime > 0 ||
                  exerciseTotals.totalRightTime > 0) && (
                  <Text style={styles.exerciseTotal}>
                    Total Time: L:{exerciseTotals.totalLeftTime}s | R:
                    {exerciseTotals.totalRightTime}s
                  </Text>
                )}

                {exerciseTotals.totalReps > 0 && (
                  <Text style={styles.exerciseTotal}>
                    Total Reps: {exerciseTotals.totalReps}
                  </Text>
                )}

                {(exerciseTotals.totalLeft > 0 ||
                  exerciseTotals.totalRight > 0) && (
                  <Text style={styles.exerciseTotal}>
                    Total Reps: L:{exerciseTotals.totalLeft} | R:
                    {exerciseTotals.totalRight}
                  </Text>
                )}

                {/* Rep imbalance */}

                {repImbalance > 0 &&
                  exerciseTotals.totalLeft + exerciseTotals.totalRight > 0 && (
                    <Text style={{ color: "#FF6B6B" }}>
                      Imbalance: {repImbalance} reps (
                      {(
                        (repImbalance /
                          (exerciseTotals.totalLeft +
                            exerciseTotals.totalRight)) *
                        100
                      ).toFixed(1)}
                      %)
                    </Text>
                  )}

                {/* Time imbalance */}

                {timeImbalance > 0 &&
                  exerciseTotals.totalLeftTime + exerciseTotals.totalRightTime >
                    0 && (
                    <Text style={{ color: "#FF6B6B" }}>
                      Imbalance: {timeImbalance}s (
                      {(
                        (timeImbalance /
                          (exerciseTotals.totalLeftTime +
                            exerciseTotals.totalRightTime)) *
                        100
                      ).toFixed(1)}
                      %)
                    </Text>
                  )}

                {/* Details */}

                {exercise.sets.map((set: any, index: number) => {
                  let value = "";

                  // SKIPPED SET
                  if (set.status === "skipped") {
                    value = "Skipped";
                  }

                  // NORMAL REPS
                  else if (set.repsCompleted !== undefined) {
                    value = `${set.repsCompleted} reps`;
                  }

                  // ALTERNATING REPS
                  else if (
                    set.repsLeft !== undefined &&
                    set.repsRight !== undefined
                  ) {
                    value = `L:${set.repsLeft} | R:${set.repsRight}`;
                  }

                  // ALTERNATING HOLD
                  else if (
                    set.durationLeft !== undefined &&
                    set.durationRight !== undefined
                  ) {
                    value = `L:${set.durationLeft} sec | R:${set.durationRight} sec`;
                  }

                  // FALLBACK OLD SHAPE
                  else if (set.duration?.left !== undefined) {
                    value = `L:${set.duration.left} sec | R:${set.duration.right} sec`;
                  }

                  // NORMAL HOLD
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
          <View style={styles.sectionDivider} />

          {/* ==========================================================
              WORKOUT FEEDBACK
          ========================================================== */}

          <Text style={styles.subHeader}>Workout Feedback</Text>

          <Text style={styles.totalWorkout}>
            Rating: {"⭐".repeat(parsedWorkout.feedback?.rating ?? 0)}
          </Text>

          <Text style={styles.totalWorkout}>
            Tags:{" "}
            {parsedWorkout.feedback?.tags?.length
              ? parsedWorkout.feedback.tags.join(", ")
              : "None"}
          </Text>

          <Text style={styles.totalWorkout}>Feedback:</Text>

          <Text
            style={{
              color: "#ccc",
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            {parsedWorkout.feedback?.comment || "No comments"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// app/screens/WorkoutSummary.tsx
import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { saveWorkoutSession } from "../../storage/workoutStorage";
import { appStyles as styles } from "../../styles/appStyles";
import { useProgress } from "@/hooks/useProgress";
import { FeedbackCard } from "@/components/FeedbackCard";
import { hydrateExercise } from "@/utils/hydrateExercise";
import { evaluateProgramLifecycle } from "@/engine/ProgramLifecycleEngine";
import PrimaryButton from "@/components/PrimaryButton";
import { WorkoutStatus } from "@/models/WorkoutStatus";
import { calculateWorkoutProgress } from "@/utils/workoutProgress";
import WorkoutProgress from "@/components/WorkoutProgress";
import { CompletedSession } from "@/models/WorkoutLog";

export default function WorkoutSummary() {
  const [feedback, setFeedback] = React.useState<{
    rating: number | null;
    tags: string[];
    comment: string;
  } | null>(null);

  const params = useLocalSearchParams();

  console.log("WorkoutSummary params:", params);
  // start and end times
  const startWorkoutTime = Number(params.startWorkoutTime);
  const endWorkoutTime = React.useRef(Date.now()).current;
  const totalWorkoutDuration = Math.max(
    0,
    Math.floor((endWorkoutTime - startWorkoutTime) / 1000),
  );

  // for testing
  console.log("SUMMARY startWorkoutTime param:", params.startWorkoutTime);
  console.log("SUMMARY parsed startWorkoutTime:", startWorkoutTime);
  console.log("SUMMARY endWorkoutTime:", endWorkoutTime);
  console.log("SUMMARY totalWorkoutDuration:", totalWorkoutDuration);

  const session = JSON.parse(params.session as string);

  console.log(
    "Final Session Results:",
    JSON.stringify(session.results, null, 2),
  );

  const {
    program,
    completeWorkout,
    saveWorkoutProgress,
    programIndex,
    week,
    day,
  } = useProgress();

  const workout = session.results?.workout;

  // -----------------------------------
  // SECTION DATA
  // -----------------------------------

  const warmupBlock = session.blocks.find((b: any) => b.type === "warmup");

  const mainBlock = session.blocks.find((b: any) => b.type === "main");

  const stretchBlock = session.blocks.find((b: any) => b.type === "stretch");

  const warmupResult = session.results?.warmup;
  const stretchResult = session.results?.stretch;

  // -----------------------------------
  // WARM-UP COUNTS
  // -----------------------------------

  const warmupCompletedCount = warmupResult?.completed?.length ?? 0;

  const warmupSkippedCount = warmupResult?.skipped?.length ?? 0;

  const warmupSectionSkipped = warmupResult?.sectionSkipped === true;

  // -----------------------------------
  // STRETCH COUNTS
  // -----------------------------------

  const stretchCompletedCount = stretchResult?.completed?.length ?? 0;

  const stretchSkippedCount = stretchResult?.skipped?.length ?? 0;

  const stretchSectionSkipped = stretchResult?.sectionSkipped === true;

  // -----------------------------------
  // BLOCK DURATIONS
  // -----------------------------------

  const getBlockDuration = (block?: any) => {
    if (!block?.startedAt || !block?.completedAt) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor((block.completedAt - block.startedAt) / 1000),
    );
  };

  const warmupDuration = getBlockDuration(warmupBlock);
  const mainWorkoutDuration = getBlockDuration(mainBlock);
  const stretchDuration = getBlockDuration(stretchBlock);

  // -----------------------------------
  // MAIN WORKOUT SET COUNTS
  // -----------------------------------

  const mainExercises = workout?.exercises ?? [];

  const exerciseCount = mainExercises.length;

  const totalSets = mainExercises.reduce(
    (sum: number, exercise: any) => sum + (exercise.sets?.length ?? 0),
    0,
  );

  const completedSets = mainExercises.reduce(
    (sum: number, exercise: any) =>
      sum +
      (exercise.sets ?? []).filter((set: any) => set.status === "completed")
        .length,
    0,
  );

  const skippedSets = mainExercises.reduce(
    (sum: number, exercise: any) =>
      sum +
      (exercise.sets ?? []).filter((set: any) => set.status === "skipped")
        .length,
    0,
  );

  const mainSectionSkipped = workout?.sectionSkipped === true;

  const totalReps = mainExercises.reduce(
    (sum: number, exercise: any) =>
      sum +
      (exercise.sets ?? []).reduce(
        (setSum: number, set: any) =>
          setSum + (set.status === "completed" ? (set.repsCompleted ?? 0) : 0),
        0,
      ),
    0,
  );

  // -----------------------------------
  // TIME UNDER TENSION
  // -----------------------------------

  const getSetDuration = (set: any) => {
    // Skipped sets contribute no time under tension.
    if (set.status === "skipped") {
      return 0;
    }

    if (set.durationSeconds !== undefined) {
      return set.durationSeconds;
    }

    if (set.phaseDurations) {
      return set.phaseDurations.reduce(
        (total: number, phase: number) => total + phase,
        0,
      );
    }

    if (set.durationLeft !== undefined && set.durationRight !== undefined) {
      return set.durationLeft + set.durationRight;
    }

    if (set.duration?.left !== undefined) {
      return set.duration.left + set.duration.right;
    }

    return 0;
  };

  const timeUnderTension = mainExercises.reduce(
    (workoutTotal: number, exercise: any) =>
      workoutTotal +
      (exercise.sets ?? []).reduce(
        (exerciseTotal: number, set: any) =>
          exerciseTotal + getSetDuration(set),
        0,
      ),
    0,
  );

  const enrichedWorkout = workout
    ? {
        ...workout,

        status: WorkoutStatus.Completed,

        feedback,

        // -----------------------------------
        // OVERALL WORKOUT TIMING
        // -----------------------------------

        startWorkoutTime,
        endWorkoutTime,
        workoutDuration: totalWorkoutDuration,

        // -----------------------------------
        // MAIN WORKOUT PERFORMANCE
        // -----------------------------------

        timeUnderTension,

        // -----------------------------------
        // DYNAMIC WARM-UP
        // -----------------------------------

        warmup: warmupResult
          ? {
              completed: warmupResult.completed ?? [],
              skipped: warmupResult.skipped ?? [],
              sectionSkipped: warmupResult.sectionSkipped === true,
            }
          : undefined,

        warmupStartedAt: warmupBlock?.startedAt,
        warmupCompletedAt: warmupBlock?.completedAt,

        // -----------------------------------
        // STATIC STRETCH
        // -----------------------------------

        stretch: stretchResult
          ? {
              completed: stretchResult.completed ?? [],
              skipped: stretchResult.skipped ?? [],
              sectionSkipped: stretchResult.sectionSkipped === true,
            }
          : undefined,

        stretchStartedAt: stretchBlock?.startedAt,
        stretchCompletedAt: stretchBlock?.completedAt,
      }
    : null;

  // -----------------------------------
  // MOTIVATIONAL MESSAGE
  // -----------------------------------

  const messages = [
    "Great work today. Consistency builds strength.",
    "Another step forward. Your future self thanks you.",
    "Discipline beats motivation. You showed both today.",
    "Progress happens one workout at a time.",
    "Every rep you complete is an investment in yourself.",
    "Small improvements add up to remarkable results.",
    "You kept your promise to yourself today.",
    "Strength is earned one workout at a time.",
    "Today's effort becomes tomorrow's confidence.",
    "The hardest part was showing up. You did it.",
    "Your consistency is becoming your superpower.",
    "You are stronger today than you were yesterday.",
    "Every workout is another brick in the foundation.",
    "You didn't need perfection—just progress.",
    "Keep stacking wins. They compound over time.",
    "The work you do today shapes the person you'll become.",
    "Progress isn't always visible, but it's always happening.",
    "One more session complete. Keep building momentum.",
    "You chose growth over comfort today.",
    "This session moved you closer to your goals.",
    "Your body remembers every quality rep.",
    "The results come later. The habit starts now.",
    "Consistency always beats intensity in the long run.",
    "Strong habits create strong people.",
    "You are proving to yourself what you're capable of.",
    "Stay patient. Stay consistent. Stay strong.",
    "Success is built one workout at a time.",
    "Every completed workout is a victory.",
    "The next workout starts with finishing this one.",
    "Keep showing up. That's where the magic happens.",
    "You did something today that many people didn't.",
    "Strength grows through repeated effort.",
    "Your future self will thank you for today's discipline.",
    "Trust the process. It's working.",
    "Champions are built through ordinary days done well.",
    "The goal isn't easy. That's why it's worth pursuing.",
    "Every session is another chance to improve.",
    "Your dedication is becoming your identity.",
    "The strongest version of you is under construction.",
    "You earned this feeling. Enjoy it.",
    "Another workout complete. Keep the streak alive.",
    "You are becoming more resilient every session.",
    "Your effort today matters more than you realize.",
    "One more reason to believe in yourself.",
    "Keep moving forward. Progress rewards persistence.",
    "Every workout strengthens both body and mind.",
    "The only bad workout is the one you didn't do.",
    "Be proud of today's effort, then come back stronger.",
    "Great things are built through consistent action.",
    "You finished what you started. That's real discipline.",
  ];

  const [message] = React.useState(
    () => messages[Math.floor(Math.random() * messages.length)],
  );

  // -----------------------------------
  // GUARD
  // -----------------------------------

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text>No workout data available</Text>
      </View>
    );
  }

  // -----------------------------------
  // FORMAT HELPERS
  // -----------------------------------

  const formatDate = (date: string) => {
    const d = new Date(date);

    const weekday = d.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const dayNum = d.getDate();

    const month = d.toLocaleDateString("en-US", {
      month: "long",
    });

    const year = d.getFullYear();

    return `${weekday} the ${dayNum} of ${month} ${year}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds} sec`;
    }

    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }

    return `${minutes} min ${remainingSeconds} sec`;
  };

  // -----------------------------------
  // EXERCISE NAME
  // -----------------------------------

  const getExerciseName = (exerciseId: string) => {
    const programExercise = program.days
      .flatMap((d) => d.exercises)
      .find((e) => e.exerciseId === exerciseId);

    if (!programExercise) {
      return exerciseId;
    }

    const hydrated = hydrateExercise(programExercise);

    return hydrated.name;
  };

  // -----------------------------------
  // RENDER MAIN EXERCISE
  // -----------------------------------

  const renderExercise = ({ item }: any) => {
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.exerciseTitle}>
          {getExerciseName(item.exerciseId)}
        </Text>

        {item.sets.map((set: any, index: number) => {
          let value = "-";

          // SKIPPED
          if (set.status === "skipped") {
            value = "Skipped";
          }

          // NORMAL REPS
          else if (set.repsCompleted !== undefined) {
            value = `${set.repsCompleted} reps`;
          }

          // ALTERNATING REPS
          else if (set.repsLeft !== undefined && set.repsRight !== undefined) {
            value = `L:${set.repsLeft} | R:${set.repsRight}`;
          }

          // HOLD - LEFT / RIGHT
          else if (
            set.durationLeft !== undefined &&
            set.durationRight !== undefined
          ) {
            value = `L:${set.durationLeft} sec | R:${set.durationRight} sec`;
          }

          // OLD HOLD FORMAT
          else if (set.duration?.left !== undefined) {
            value = `L:${set.duration.left} sec | R:${set.duration.right} sec`;
          }

          // NORMAL HOLD
          else if (set.durationSeconds !== undefined) {
            value = `${set.durationSeconds} sec`;
          }

          return (
            <Text key={index} style={styles.setText}>
              Set {index + 1}: {value}
            </Text>
          );
        })}
      </View>
    );
  };

  // -----------------------------------
  // COMPLETE WORKOUT
  // -----------------------------------

  const handleCompleteWorkout = async () => {
    if (!enrichedWorkout) return;

    // console.log("FINAL WORKOUT:", JSON.stringify(enrichedWorkout, null, 2));

    // await saveWorkoutSession(enrichedWorkout);
    const completedSession: CompletedSession = {
      ...enrichedWorkout,

      // -----------------------------------
      // PROGRAM LIFECYCLE IDENTITY
      // -----------------------------------

      programId: program.id,

      /**
       * useProgress uses zero-based indexes,
       * so preserve them exactly as-is.
       */
      weekIndex: week,
      dayIndex: day,

      /**
       * Stable program-day identifier.
       */
      dayId: program.days[day].id,

      // -----------------------------------
      // WARM-UP
      // -----------------------------------

      warmup: session.results?.warmup
        ? {
            completed: session.results.warmup.completed ?? [],
            skipped: session.results.warmup.skipped ?? [],
            sectionSkipped: session.results.warmup.sectionSkipped === true,
          }
        : undefined,

      // -----------------------------------
      // STRETCH
      // -----------------------------------

      stretch: session.results?.stretch
        ? {
            completed: session.results.stretch.completed ?? [],
            skipped: session.results.stretch.skipped ?? [],
            sectionSkipped: session.results.stretch.sectionSkipped === true,
          }
        : undefined,

      // -----------------------------------
      // BLOCK TIMINGS
      // -----------------------------------

      warmupStartedAt: warmupBlock?.startedAt,
      warmupCompletedAt: warmupBlock?.completedAt,

      mainStartedAt: mainBlock?.startedAt,
      mainCompletedAt: mainBlock?.completedAt,

      stretchStartedAt: stretchBlock?.startedAt,
      stretchCompletedAt: stretchBlock?.completedAt,

      // Main workout section status
      sectionSkipped: workout.sectionSkipped === true,
    };

    console.log("💾 COMPLETED WORKOUT IDENTITY", {
      programId: completedSession.programId,
      weekIndex: completedSession.weekIndex,
      dayIndex: completedSession.dayIndex,
      dayId: completedSession.dayId,
    });

    await saveWorkoutSession(completedSession);

    console.log("FINAL WORKOUT DATA:", enrichedWorkout);

    const currentBlock = week;

    // default setting for coach
    const lifecycleResult = await evaluateProgramLifecycle(
      workout.programId,
      currentBlock,
    );

    // temporarly chn aged to test  with coach disabled
    // const lifecycleResult = await evaluateProgramLifecycle(
    //   workout.programId,
    //   currentBlock,
    //   {
    //     coachEnabled: false,
    //   },
    // );

    // console.log("🧪 LIFECYCLE RESULT (COACHING OFF):", lifecycleResult);

    // -----------------------------------
    // BLOCK EVALUATION
    // -----------------------------------
    if (lifecycleResult?.blockComplete) {
      const report = lifecycleResult.readinessReport;

      if (report) {
        console.log("🏁 BLOCK COMPLETE");
        console.log("Recommendation:", report.recommendation);

        if (report.recommendation === "advance") {
          console.log("⬆️ Advance to next level");

          // TODO:
          // move to next program
          // reset week/day
          // preserve athlete profile
        }

        if (report.recommendation === "repeat") {
          console.log("🔁 Repeat current block");

          // TODO:
          // repeat same program
          // keep progression data
        }

        if (report.recommendation === "deload") {
          console.log("⬇️ Deload recommended");

          // TODO:
          // reduce volume
          // reduce sets
          // increase rest periods
        }
      }
    }

    // -----------------------------------
    // WORKOUT PROGRESS
    // -----------------------------------

    const totalSetsPlanned =
      mainBlock?.exercises.reduce(
        (acc: number, ex: any) => acc + (ex.sets ?? 0),
        0,
      ) ?? 0;

    const progress = calculateWorkoutProgress(completedSets, totalSetsPlanned);

    saveWorkoutProgress(programIndex, week, day, {
      completedSets: progress.completedSets,
      totalSets: progress.totalSets,
      completed: progress.completedSets === progress.totalSets,
    });

    completeWorkout();

    router.replace("/");
  };

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        data={workout.exercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={renderExercise}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Workout Complete</Text>

            <WorkoutProgress blocks={session.blocks} />

            <Text style={styles.summaryDate}>{formatDate(workout.date)}</Text>

            <Text style={styles.sectionTitle}>Session Summary</Text>

            {/* -------------------------------- */}
            {/* WARM-UP */}
            {/* -------------------------------- */}

            {warmupResult && (
              <View style={styles.summaryCard}>
                <Text style={styles.exerciseTitle}>🔥 Warm-up</Text>

                <Text style={styles.setText}>
                  {warmupCompletedCount} completed
                </Text>

                <Text style={styles.setText}>{warmupSkippedCount} skipped</Text>

                <Text style={styles.setText}>
                  Section skipped: {warmupSectionSkipped ? "Yes" : "No"}
                </Text>

                <Text style={styles.setText}>
                  Duration: {formatDuration(warmupDuration)}
                </Text>
              </View>
            )}

            {/* -------------------------------- */}
            {/* MAIN WORKOUT */}
            {/* -------------------------------- */}

            {session.results?.workout && (
              <View style={styles.summaryCard}>
                <Text style={styles.exerciseTitle}>💪 Main Workout</Text>

                <Text style={styles.setText}>{exerciseCount} exercises</Text>

                <Text style={styles.setText}>
                  {completedSets} completed sets
                </Text>

                <Text style={styles.setText}>{skippedSets} skipped sets</Text>

                <Text style={styles.setText}>{totalSets} total sets</Text>

                <Text style={styles.setText}>{totalReps} reps</Text>

                <Text style={styles.setText}>
                  Section skipped: {mainSectionSkipped ? "Yes" : "No"}
                </Text>

                <Text style={styles.setText}>
                  Workout: {formatDuration(mainWorkoutDuration)}
                </Text>

                <Text style={styles.setText}>
                  Time Under Tension: {formatDuration(timeUnderTension)}
                </Text>
              </View>
            )}

            {/* -------------------------------- */}
            {/* STRETCH */}
            {/* -------------------------------- */}

            {stretchResult && (
              <View style={styles.summaryCard}>
                <Text style={styles.exerciseTitle}>🧘 Stretch</Text>

                <Text style={styles.setText}>
                  {stretchCompletedCount} completed
                </Text>

                <Text style={styles.setText}>
                  {stretchSkippedCount} skipped
                </Text>

                <Text style={styles.setText}>
                  Section skipped: {stretchSectionSkipped ? "Yes" : "No"}
                </Text>

                <Text style={styles.setText}>
                  Duration: {formatDuration(stretchDuration)}
                </Text>
              </View>
            )}

            {/* -------------------------------- */}
            {/* EXERCISE RESULTS */}
            {/* -------------------------------- */}

            <Text style={styles.sectionTitle}>Exercise Results</Text>
          </>
        }
        ListFooterComponent={
          <>
            <Text style={styles.summaryMessage}>{message}</Text>

            <FeedbackCard onChange={(data) => setFeedback(data)} />

            <PrimaryButton
              title="Complete Workout"
              onPress={handleCompleteWorkout}
            />
          </>
        }
      />
    </SafeAreaView>
  );
}

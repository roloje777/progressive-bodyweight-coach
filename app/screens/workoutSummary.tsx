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
import { getDeloadWorkoutContext } from "@/engine/DeloadEngine";

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
    pendingGraduation,
    recordGraduationEligibility,
    suspendGraduationEligibility,
    activeDeload,
    activateDeload,
    beginVerificationPhase,
    clearDeload,
  } = useProgress();

  const workout = session.results?.workout;

  const deloadContext = getDeloadWorkoutContext(activeDeload, program.id, week);

  const isDeloadWorkout = deloadContext?.phase === "deload";
  const isVerificationWorkout = deloadContext?.phase === "verification";

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

  const formatDate = (date?: string) => {
    if (!date) {
      return "";
    }

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

  const formatRecoveryActivity = (activity?: { type?: string }) => {
    switch (activity?.type) {
      case "guided-mobility":
        return "Guided mobility / stretch";
      case "walking":
        return "Light walk";
      case "easy-cycling":
        return "Easy cycling";
      case "mobility":
        return "Gentle mobility";
      case "other":
        return "Other light recovery";
      default:
        return "Recovery work completed";
    }
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

      // -----------------------------------
      // TRAINING MODE / DELOAD HISTORY
      // -----------------------------------

      trainingMode: deloadContext?.trainingMode ?? "normal",
      deload: deloadContext?.metadata,

      // Pain-recovery sessions are real history even though the
      // normal strength block is intentionally empty.
      recoveryActivity: workout.recoveryActivity,
    };

    const reportedJointDiscomfort =
      completedSession.feedback?.tags?.includes("Joint discomfort ⚠️") === true;

    console.log("💾 COMPLETED WORKOUT IDENTITY", {
      programId: completedSession.programId,

      weekIndex: completedSession.weekIndex,

      dayIndex: completedSession.dayIndex,

      dayId: completedSession.dayId,
    });

    // -----------------------------------
    // SAVE COMPLETED WORKOUT
    // -----------------------------------

    await saveWorkoutSession(completedSession);

    console.log("FINAL WORKOUT DATA:", enrichedWorkout);

    // -----------------------------------
    // PROGRAM LIFECYCLE
    // -----------------------------------

    const currentWeekIndex = week;

    const lifecycleResult = await evaluateProgramLifecycle(
      program.id,
      currentWeekIndex,
      {
        // A deload week proves recovery work was completed; it does
        // not prove progression readiness. The following verification
        // week is the point where readiness is evaluated again.
        coachEnabled: !isDeloadWorkout,
      },
    );
    // -----------------------------------
    // LIFECYCLE / GRADUATION DECISION
    // -----------------------------------

    const report = lifecycleResult.readinessReport;

    const graduation = lifecycleResult.graduation;

    if (lifecycleResult?.blockComplete && report) {
      console.log("🏁 WEEK COMPLETE");

      console.log("Recommendation:", report.recommendation);

      // -----------------------------------
      // PROGRESSION ELIGIBILITY
      // -----------------------------------
      //
      // The Coach only permits progression when:
      //
      // - readiness recommends advance
      // - progression candidate is true
      // - no progression blocker exists
      // - no deload is required
      //
      // This applies to both:
      //
      // - the original graduation week
      // - optional weeks after graduation
      //
      // Therefore an optional week can temporarily
      // suspend previously-earned progression
      // eligibility.
      // -----------------------------------

      const progressionAllowed =
        report.recommendation === "advance" &&
        report.progressionCandidate === true &&
        report.progressionBlocked === false &&
        report.deloadCandidate === false;

      const nextProgramId =
        graduation?.nextProgramId ?? pendingGraduation?.nextProgramId;

      // -----------------------------------
      // COACH ALLOWS PROGRESSION
      // -----------------------------------

      if (progressionAllowed && nextProgramId) {
        recordGraduationEligibility(nextProgramId);

        console.log("🎓 GRADUATION ELIGIBILITY ACTIVE", {
          programId: program.id,

          nextProgramId,

          currentWeekIndex,

          recommendation: report.recommendation,

          averageDifficulty: report.averageDifficulty,
        });
      }

      // -----------------------------------
      // COACH BLOCKS PROGRESSION
      // -----------------------------------
      else if (pendingGraduation?.programId === program.id) {
        suspendGraduationEligibility();

        console.log("⏸️ GRADUATION ELIGIBILITY SUSPENDED", {
          programId: program.id,

          currentWeekIndex,

          recommendation: report.recommendation,

          averageDifficulty: report.averageDifficulty,

          progressionBlocked: report.progressionBlocked,

          deloadCandidate: report.deloadCandidate,
        });
      }

      // -----------------------------------
      // COACH MESSAGE
      // -----------------------------------

      if (report.recommendation === "advance") {
        console.log("⬆️ Coach permits progression");
      }

      if (report.recommendation === "repeat") {
        console.log("🔁 Coach recommends more time at the current level");
      }

      if (report.recommendation === "deload") {
        const deloadReason = report.deloadReason ?? "recovery";

        activateDeload(deloadReason);

        console.log("⬇️ Coach recommends a deload", {
          reason: deloadReason,
          currentWeekIndex,
        });
    } else if (
        isVerificationWorkout &&
        !reportedJointDiscomfort
      ) {
        clearDeload();
      }
    }

    // -----------------------------------
    // WORKOUT PROGRESS
    // -----------------------------------

    const totalSetsPlanned = isDeloadWorkout
      ? deloadContext?.reason === "pain"
        ? 0
        : (mainBlock?.exercises.reduce(
            (acc: number, ex: any) => acc + Math.max(1, (ex.sets ?? 1) - 1),
            0,
          ) ?? 0)
      : (mainBlock?.exercises.reduce(
          (acc: number, ex: any) => acc + (ex.sets ?? 0),
          0,
        ) ?? 0);

    const progress =
      totalSetsPlanned === 0
        ? { completedSets: 0, totalSets: 0 }
        : calculateWorkoutProgress(completedSets, totalSetsPlanned);

    saveWorkoutProgress(programIndex, week, day, {
      completedSets: progress.completedSets,

      totalSets: progress.totalSets,

      completed: progress.completedSets === progress.totalSets,
    });

    // -----------------------------------
    // WORKOUT CURSOR
    // -----------------------------------

    completeWorkout();

    // -----------------------------------
// IMMEDIATE PAIN INTERCEPTION
// -----------------------------------
//
// A pain report must reach the Coach immediately.
//
// This does NOT wait for:
// - week completion
// - recurring-pain thresholds
// - graduation/readiness routing
//
// Cycle-level readiness still runs above and remains a second
// safety net for recurring pain.
//
if (reportedJointDiscomfort) {
  const lifecycleRequiresRecovery =
    lifecycleResult?.blockComplete === true &&
    report?.recommendation === "deload" &&
    (report.deloadReason ?? "recovery") === "pain";

  router.replace({
    pathname: "./painCoach",
    params: {
      triggeredAtWeekIndex: String(currentWeekIndex),
      lifecycleRequiresRecovery:
        lifecycleRequiresRecovery ? "true" : "false",
    },
  });

  return;
}

    // -----------------------------------
    // DELOAD -> VERIFICATION TRANSITION
    // -----------------------------------

    if (isDeloadWorkout && lifecycleResult?.blockComplete === true) {
      const movedToVerification = beginVerificationPhase();

      if (movedToVerification) {
        console.log("✅ DELOAD CYCLE COMPLETE → VERIFICATION", {
          programId: program.id,
          deloadWeekIndex: week,
          verificationWeekIndex:
            activeDeload?.deloadWeekIndex != null
              ? activeDeload.deloadWeekIndex + 1
              : undefined,
        });

        // Give the Coach a chance to explain the purpose of the
        // verification week before the user returns to normal-looking
        // training. The deload state has already moved to verification.
        router.replace("/screens/graduationCoach");
        return;
      }

      router.replace("/");
      return;
    }

    // -----------------------------------
    // POST-WORKOUT ROUTING
    // -----------------------------------
    //
    // Graduation has already been:
    //
    // - calculated
    // - recorded in ProgressContext
    //
    // Do NOT accept graduation here.
    //
    // The Coach screen presents the user's choice.
    // -----------------------------------

    // -----------------------------------
    // POST-WORKOUT ROUTING
    // -----------------------------------
    //
    // The Graduation Coach is only shown at the
    // completion of a full program week.
    //
    // During an optional week:
    //
    // Day 1 → Day 2
    // Day 2 → Day 3
    // Day 3 → Day 4
    //
    // Only after Day 4 is complete do we return
    // to the Coach for another progression decision.
    // -----------------------------------

    const graduationEarnedNow =
      graduation?.graduate === true && graduation.nextProgramId != null;

    const graduationAlreadyExists = pendingGraduation?.programId === program.id;

    const hasGraduationPath = graduationEarnedNow || graduationAlreadyExists;

    const deloadRecommended =
      lifecycleResult?.blockComplete === true &&
      report?.recommendation === "deload";

    const shouldShowGraduationCoach =
      lifecycleResult?.blockComplete === true &&
      (hasGraduationPath || deloadRecommended);

    if (shouldShowGraduationCoach) {
      router.replace("/screens/graduationCoach");

      return;
    }

    // -----------------------------------
    // NORMAL POST-WORKOUT FLOW
    // -----------------------------------

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
            <Text style={styles.title}>
              {isVerificationWorkout
                ? "Verification Workout Complete"
                : isDeloadWorkout
                  ? "Recovery Workout Complete"
                  : "Workout Complete"}
            </Text>

            {deloadContext && (
              <View
                style={{
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 14,
                  backgroundColor: isVerificationWorkout
                    ? "#1B2A16"
                    : "#10242D",
                  borderWidth: 1,
                  borderColor: isVerificationWorkout ? "#7CB342" : "#4FC3F7",
                }}
              >
                <Text
                  style={{
                    color: isVerificationWorkout ? "#C5E1A5" : "#B3E5FC",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  {isVerificationWorkout
                    ? "Verification • 80% of healthy pre-deload MB"
                    : deloadContext.reason === "pain"
                      ? "Pain Recovery • normal strength work paused"
                      : `Deload • ${Math.round(deloadContext.targetScale * 100)}% recovery targets`}
                </Text>
              </View>
            )}

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
                <Text style={styles.exerciseTitle}>
                  {isDeloadWorkout && deloadContext?.reason === "pain"
                    ? "🛡️ Recovery Activity"
                    : "💪 Main Workout"}
                </Text>

                {isDeloadWorkout && deloadContext?.reason === "pain" ? (
                  <>
                    <Text style={styles.setText}>Strength work: Paused</Text>
                    <Text style={styles.setText}>
                      Recovery:{" "}
                      {formatRecoveryActivity(workout.recoveryActivity)}
                    </Text>
                    {workout.recoveryActivity?.durationMinutes != null && (
                      <Text style={styles.setText}>
                        Duration: {workout.recoveryActivity.durationMinutes} min
                      </Text>
                    )}
                    {workout.recoveryActivity?.distance != null && (
                      <Text style={styles.setText}>
                        Distance: {workout.recoveryActivity.distance}{" "}
                        {workout.recoveryActivity.distanceUnit ?? "km"}
                      </Text>
                    )}
                    {workout.recoveryActivity?.notes && (
                      <Text style={styles.setText}>
                        Notes: {workout.recoveryActivity.notes}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.setText}>
                      {exerciseCount} exercises
                    </Text>

                    <Text style={styles.setText}>
                      {completedSets} completed sets
                    </Text>

                    <Text style={styles.setText}>
                      {skippedSets} skipped sets
                    </Text>

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
                  </>
                )}
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

            {!(isDeloadWorkout && deloadContext?.reason === "pain") && (
              <Text style={styles.sectionTitle}>Exercise Results</Text>
            )}
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

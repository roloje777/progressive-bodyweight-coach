// app/screens/workoutDetail.tsx
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { CompletedSession, TrainingMode, WorkoutReason } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";
import { appStyles as styles } from "../../styles/appStyles";
import { hydrateExercise } from "@/utils/hydrateExercise";
import { WORKOUT_FEEDBACK_OPTIONS_BY_RATING } from "@/models/WorkoutFeedback";
import {
  exportWorkoutReport,
  WorkoutExportFormat,
} from "@/utils/workoutExport";

const TRAINING_MODE_LABELS: Record<TrainingMode, string> = {
  normal: "Standard workout",
  "deload-fatigue": "Fatigue deload",
  "deload-pain": "Pain recovery / deload",
  "deload-form": "Form deload",
  "deload-recovery": "Recovery deload",
  verification: "Verification workout",
};



const WORKOUT_REASON_LABELS: Record<WorkoutReason, string> = {
  scheduled: "Scheduled workout",
  repeat: "Repeat workout",
};

const RECOVERY_ACTIVITY_LABELS = {
  "guided-mobility": "Guided mobility",
  walking: "Walking",
  "easy-cycling": "Easy cycling",
  mobility: "Mobility",
  other: "Other recovery activity",
} as const;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function WorkoutDetailScreen() {
  const { workout } = useLocalSearchParams();

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
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

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (!workout || typeof workout !== "string") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No workout data found.</Text>
      </View>
    );
  }

  let parsedWorkout: CompletedSession;

  try {
    parsedWorkout = JSON.parse(workout);
  } catch {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to read this workout.</Text>
      </View>
    );
  }

  const program = programs.find((p) => p.id === parsedWorkout.programId);
  const day = program?.days.find((d) => d.id === parsedWorkout.dayId);

  const dayTitle = day?.title ?? parsedWorkout.dayId;
  const focus = dayTitle.replace(/^Day\s+\d+\s*[-–—:]\s*/i, "").trim();
  const weekLabel =
    parsedWorkout.weekIndex != null
      ? `Week ${parsedWorkout.weekIndex + 1}`
      : "Week not recorded";
  const dayLabel =
    parsedWorkout.dayIndex != null
      ? `Day ${parsedWorkout.dayIndex + 1}`
      : dayTitle;
  const trainingMode = parsedWorkout.trainingMode ?? "normal";
  const trainingModeLabel = TRAINING_MODE_LABELS[trainingMode];
  const workoutReason = parsedWorkout.workoutReason ?? "scheduled";
  const workoutReasonLabel = WORKOUT_REASON_LABELS[workoutReason];

  const getExerciseName = (exerciseId: string) => {
    const configured = day?.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId,
    );

    return configured ? hydrateExercise(configured).name : exerciseId;
  };

  const getSetDuration = (set: any) => {
    if (set.status === "skipped") return 0;
    if (set.durationSeconds !== undefined) return set.durationSeconds;
    if (set.phaseDurations) {
      return set.phaseDurations.reduce(
        (total: number, duration: number) => total + duration,
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

  const getSetValue = (set: any) => {
    if (set.status === "skipped") return "Skipped";
    if (set.repsCompleted !== undefined) return `${set.repsCompleted} reps`;
    if (set.repsLeft !== undefined && set.repsRight !== undefined) {
      return `L:${set.repsLeft} | R:${set.repsRight}`;
    }
    if (set.durationLeft !== undefined && set.durationRight !== undefined) {
      return `L:${set.durationLeft}s | R:${set.durationRight}s`;
    }
    if (set.duration?.left !== undefined) {
      return `L:${set.duration.left}s | R:${set.duration.right}s`;
    }
    if (set.durationSeconds !== undefined) return `${set.durationSeconds}s`;
    return "-";
  };

  const calculateWorkoutTotals = () => {
    let timeUnderTension = 0;
    let totalReps = 0;
    let totalSets = 0;
    let completedSets = 0;
    let skippedSets = 0;

    parsedWorkout.exercises.forEach((exercise) => {
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
      if (set.status === "skipped") {
        skippedSets += 1;
        return;
      }

      completedSets += 1;
      totalTime += getSetDuration(set);

      if (set.repsCompleted !== undefined) {
        totalReps += set.repsCompleted;
      } else if (set.repsLeft !== undefined && set.repsRight !== undefined) {
        totalLeft += set.repsLeft;
        totalRight += set.repsRight;
      } else if (
        set.durationLeft !== undefined &&
        set.durationRight !== undefined
      ) {
        totalLeftTime += set.durationLeft;
        totalRightTime += set.durationRight;
      } else if (set.duration?.left !== undefined) {
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

  const totals = calculateWorkoutTotals();
  const totalWorkoutDuration =
    (parsedWorkout.endWorkoutTime - parsedWorkout.startWorkoutTime) / 1000;
  const mainWorkoutDuration =
    parsedWorkout.mainStartedAt !== undefined &&
    parsedWorkout.mainCompletedAt !== undefined
      ? (parsedWorkout.mainCompletedAt - parsedWorkout.mainStartedAt) / 1000
      : undefined;

  const feedbackLabels = (parsedWorkout.feedback?.tags ?? []).map((tag) => {
    const options = Object.values(WORKOUT_FEEDBACK_OPTIONS_BY_RATING).flat();
    return options.find((option) => option.id === tag)?.label ?? tag;
  });

  const recoveryActivity = parsedWorkout.recoveryActivity;
  const recoveryActivityLabel = recoveryActivity
    ? RECOVERY_ACTIVITY_LABELS[recoveryActivity.type]
    : undefined;

  const buildExportReport = () => {
    const programName = program?.level ?? program?.name ?? parsedWorkout.programId;
    const date = formatDate(parsedWorkout.startWorkoutTime);

    const exerciseText = parsedWorkout.exercises
      .map((exercise) => {
        const exerciseTotals = calculateExerciseTotals(exercise);
        const sets = exercise.sets
          .map((set: any) => `  Set ${set.setNumber}: ${getSetValue(set)}`)
          .join("\n");

        return `${getExerciseName(exercise.exerciseId)}\nSets: ${exerciseTotals.completedSets}/${exerciseTotals.totalSets} completed\n${sets}`;
      })
      .join("\n\n");

    const recoveryLines = recoveryActivity
      ? [
          `Recovery activity: ${recoveryActivityLabel}`,
          recoveryActivity.durationMinutes != null
            ? `Recovery duration: ${recoveryActivity.durationMinutes} min`
            : undefined,
          recoveryActivity.distance != null
            ? `Recovery distance: ${recoveryActivity.distance} ${recoveryActivity.distanceUnit ?? "km"}`
            : undefined,
          recoveryActivity.notes ? `Recovery notes: ${recoveryActivity.notes}` : undefined,
        ].filter(Boolean)
      : [];

    const lines = [
      "WORKOUT DETAIL",
      "==============",
      `Program: ${programName}`,
      `${weekLabel} · ${dayLabel}`,
      `Focus: ${focus || dayTitle}`,
      `Workout reason: ${workoutReasonLabel}`,
      `Training mode: ${trainingModeLabel}`,
      `Date: ${date}`,
      `Started: ${formatClockTime(parsedWorkout.startWorkoutTime)}`,
      `Finished: ${formatClockTime(parsedWorkout.endWorkoutTime)}`,
      "",
      "PERFORMANCE SUMMARY",
      "-------------------",
      `Total workout duration: ${formatTime(totalWorkoutDuration)}`,
      mainWorkoutDuration != null
        ? `Main workout duration: ${formatTime(mainWorkoutDuration)}`
        : undefined,
      `Time under tension: ${formatTime(totals.timeUnderTension)}`,
      `Exercises: ${parsedWorkout.exercises.length}`,
      `Sets: ${totals.completedSets}/${totals.totalSets} completed`,
      `Skipped sets: ${totals.skippedSets}`,
      `Total reps: ${totals.totalReps}`,
      ...recoveryLines,
      "",
      "MAIN EXERCISES",
      "--------------",
      exerciseText,
      "",
      "WORKOUT FEEDBACK",
      "----------------",
      `Rating: ${parsedWorkout.feedback?.rating ?? "Not recorded"}/5`,
      `Tags: ${feedbackLabels.length ? feedbackLabels.join(", ") : "None"}`,
      `Comment: ${parsedWorkout.feedback?.comment || "No comments"}`,
    ].filter((line): line is string => line !== undefined);

    const text = lines.join("\n");
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1d1d1f; padding: 28px; line-height: 1.45; }
    h1 { margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin: 14px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
    .label { color: #666; font-size: 12px; text-transform: uppercase; }
    .value { font-weight: 600; margin-bottom: 8px; }
    h2 { margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    .exercise { margin-bottom: 18px; }
    .set { margin-left: 12px; }
  </style>
</head>
<body>
  <h1>Workout Detail</h1>
  <div class="subtitle">${escapeHtml(date)} · ${escapeHtml(programName)}</div>
  <div class="card grid">
    <div><div class="label">Program week</div><div class="value">${escapeHtml(weekLabel)}</div></div>
    <div><div class="label">Workout</div><div class="value">${escapeHtml(dayTitle)}</div></div>
    <div><div class="label">Focus</div><div class="value">${escapeHtml(focus || dayTitle)}</div></div>
    <div><div class="label">Workout reason</div><div class="value">${escapeHtml(workoutReasonLabel)}</div></div>
    <div><div class="label">Training mode</div><div class="value">${escapeHtml(trainingModeLabel)}</div></div>
  </div>
  <h2>Performance summary</h2>
  <div class="card grid">
    <div><div class="label">Total duration</div><div class="value">${formatTime(totalWorkoutDuration)}</div></div>
    <div><div class="label">Time under tension</div><div class="value">${formatTime(totals.timeUnderTension)}</div></div>
    <div><div class="label">Completed sets</div><div class="value">${totals.completedSets} / ${totals.totalSets}</div></div>
    <div><div class="label">Total reps</div><div class="value">${totals.totalReps}</div></div>
  </div>
  ${
    recoveryActivity
      ? `<h2>Recovery context</h2><div class="card">${recoveryLines
          .map((line) => `<div>${escapeHtml(String(line))}</div>`)
          .join("")}</div>`
      : ""
  }
  <h2>Main exercises</h2>
  ${parsedWorkout.exercises
    .map(
      (exercise) => `<div class="exercise"><strong>${escapeHtml(
        getExerciseName(exercise.exerciseId),
      )}</strong>${exercise.sets
        .map(
          (set: any) =>
            `<div class="set">Set ${set.setNumber}: ${escapeHtml(getSetValue(set))}</div>`,
        )
        .join("")}</div>`,
    )
    .join("")}
  <h2>Workout feedback</h2>
  <div class="card">
    <div><strong>Rating:</strong> ${parsedWorkout.feedback?.rating ?? "Not recorded"}/5</div>
    <div><strong>Tags:</strong> ${escapeHtml(feedbackLabels.length ? feedbackLabels.join(", ") : "None")}</div>
    <div><strong>Comment:</strong> ${escapeHtml(parsedWorkout.feedback?.comment || "No comments")}</div>
  </div>
</body>
</html>`;

    const safeDate = new Date(parsedWorkout.startWorkoutTime)
      .toISOString()
      .slice(0, 10);

    return {
      filenameBase: `workout-${safeDate}-${parsedWorkout.programId}-${parsedWorkout.dayId}`,
      title: "Workout Detail",
      subtitle: `${date} · ${programName}`,
      text,
      html,
    };
  };

  const handleExport = async (format: WorkoutExportFormat) => {
    try {
      await exportWorkoutReport(buildExportReport(), format);
    } catch (error) {
      console.error("Workout export failed:", error);
      Alert.alert(
        "Export failed",
        error instanceof Error
          ? error.message
          : "The workout could not be exported.",
      );
    }
  };

  const renderStat = (label: string, value: string | number) => (
    <View style={styles.detailStatItem}>
      <Text style={styles.detailStatLabel}>{label}</Text>
      <Text style={styles.detailStatValue}>{value}</Text>
    </View>
  );

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
          <Text style={styles.title}>Workout Detail</Text>
          <Text style={styles.summaryDate}>
            {formatDate(parsedWorkout.startWorkoutTime)}
          </Text>

          <View style={styles.detailOverviewCard}>
            <Text style={styles.detailProgramLabel}>
              {program?.level ?? program?.name ?? parsedWorkout.programId.toUpperCase()}
            </Text>
            <Text style={styles.detailWorkoutTitle}>{dayTitle}</Text>
            <Text style={styles.detailContextText}>
              {weekLabel} · {dayLabel} · {focus || dayTitle}
            </Text>
            <View style={styles.detailModeBadge}>
              <Text style={styles.detailModeBadgeText}>
                {workoutReason === "repeat" ? workoutReasonLabel : trainingModeLabel}
              </Text>
            </View>
            <Text style={styles.detailContextText}>
              Workout reason: {workoutReasonLabel}
            </Text>
            {workoutReason === "repeat" && (
              <Text style={styles.detailContextText}>
                Training mode: {trainingModeLabel}
              </Text>
            )}
          </View>

          <Text style={styles.detailSectionTitle}>Performance Summary</Text>
          <View style={styles.detailStatsGrid}>
            {renderStat("Total duration", formatTime(totalWorkoutDuration))}
            {renderStat("Time under tension", formatTime(totals.timeUnderTension))}
            {renderStat("Completed sets", `${totals.completedSets} / ${totals.totalSets}`)}
            {renderStat("Total reps", totals.totalReps)}
            {renderStat("Exercises", parsedWorkout.exercises.length)}
            {renderStat("Skipped sets", totals.skippedSets)}
          </View>

          <View style={styles.detailInfoCard}>
            <Text style={styles.detailInfoRow}>
              Started: {formatClockTime(parsedWorkout.startWorkoutTime)}
            </Text>
            <Text style={styles.detailInfoRow}>
              Finished: {formatClockTime(parsedWorkout.endWorkoutTime)}
            </Text>
            {mainWorkoutDuration != null && (
              <Text style={styles.detailInfoRow}>
                Main workout: {formatTime(mainWorkoutDuration)}
              </Text>
            )}
          </View>

          {(parsedWorkout.deload || recoveryActivity) && (
            <>
              <Text style={styles.detailSectionTitle}>Recovery & Coaching Context</Text>
              <View style={styles.detailInfoCard}>
                {parsedWorkout.deload && (
                  <>
                    <Text style={styles.detailInfoRow}>
                      Reason: {parsedWorkout.deload.reason}
                    </Text>
                    <Text style={styles.detailInfoRow}>
                      Phase: {parsedWorkout.deload.phase}
                    </Text>
                    <Text style={styles.detailInfoRow}>
                      Target scale: {Math.round(parsedWorkout.deload.targetScale * 100)}%
                    </Text>
                  </>
                )}
                {recoveryActivity && (
                  <>
                    <Text style={styles.detailInfoRow}>
                      Activity: {recoveryActivityLabel}
                    </Text>
                    {recoveryActivity.durationMinutes != null && (
                      <Text style={styles.detailInfoRow}>
                        Duration: {recoveryActivity.durationMinutes} min
                      </Text>
                    )}
                    {recoveryActivity.distance != null && (
                      <Text style={styles.detailInfoRow}>
                        Distance: {recoveryActivity.distance} {recoveryActivity.distanceUnit ?? "km"}
                      </Text>
                    )}
                    {recoveryActivity.notes && (
                      <Text style={styles.detailInfoRow}>
                        Notes: {recoveryActivity.notes}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </>
          )}

          <Text style={styles.detailSectionTitle}>Main Exercises</Text>
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
                <Text style={styles.exerciseTotal}>
                  Sets: {exerciseTotals.completedSets}/{exerciseTotals.totalSets} completed
                </Text>
                {exerciseTotals.totalReps > 0 && (
                  <Text style={styles.exerciseTotal}>
                    Total Reps: {exerciseTotals.totalReps}
                  </Text>
                )}
                {(exerciseTotals.totalLeft > 0 || exerciseTotals.totalRight > 0) && (
                  <Text style={styles.exerciseTotal}>
                    Total Reps: L:{exerciseTotals.totalLeft} | R:{exerciseTotals.totalRight}
                  </Text>
                )}
                {exerciseTotals.totalTime > 0 && (
                  <Text style={styles.exerciseTotal}>
                    Time Under Tension: {formatTime(exerciseTotals.totalTime)}
                  </Text>
                )}
                {repImbalance > 0 && (
                  <Text style={styles.detailWarningText}>
                    Side imbalance: {repImbalance} reps
                  </Text>
                )}
                {timeImbalance > 0 && (
                  <Text style={styles.detailWarningText}>
                    Side imbalance: {timeImbalance}s
                  </Text>
                )}
                <View style={styles.detailSetList}>
                  {exercise.sets.map((set: any, index: number) => (
                    <Text
                      key={`${exercise.exerciseId}-${set.setNumber}-${index}`}
                      style={styles.setText}
                    >
                      Set {set.setNumber}: {getSetValue(set)}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}

          <Text style={styles.detailSectionTitle}>Workout Feedback</Text>
          <View style={styles.detailInfoCard}>
            <Text style={styles.detailInfoRow}>
              Rating: {"⭐".repeat(parsedWorkout.feedback?.rating ?? 0) || "Not recorded"}
            </Text>
            <Text style={styles.detailInfoRow}>
              Tags: {feedbackLabels.length ? feedbackLabels.join(", ") : "None"}
            </Text>
            <Text style={styles.detailFeedbackComment}>
              {parsedWorkout.feedback?.comment || "No comments"}
            </Text>
          </View>

          {parsedWorkout.warmup && (
            <>
              <Text style={styles.detailSectionTitle}>Dynamic Warm-up</Text>
              <View style={styles.detailInfoCard}>
                <Text style={styles.detailInfoRow}>
                  Completed: {parsedWorkout.warmup.completed.length} · Skipped: {parsedWorkout.warmup.skipped.length}
                </Text>
                <Text style={styles.detailInfoRow}>
                  Section skipped: {parsedWorkout.warmup.sectionSkipped ? "Yes" : "No"}
                </Text>
                {parsedWorkout.warmupStartedAt != null && parsedWorkout.warmupCompletedAt != null && (
                  <Text style={styles.detailInfoRow}>
                    Duration: {formatTime((parsedWorkout.warmupCompletedAt - parsedWorkout.warmupStartedAt) / 1000)}
                  </Text>
                )}
              </View>
            </>
          )}

          {parsedWorkout.stretch && (
            <>
              <Text style={styles.detailSectionTitle}>Static Stretch</Text>
              <View style={styles.detailInfoCard}>
                <Text style={styles.detailInfoRow}>
                  Completed: {parsedWorkout.stretch.completed.length} · Skipped: {parsedWorkout.stretch.skipped.length}
                </Text>
                <Text style={styles.detailInfoRow}>
                  Section skipped: {parsedWorkout.stretch.sectionSkipped ? "Yes" : "No"}
                </Text>
                {parsedWorkout.stretchStartedAt != null && parsedWorkout.stretchCompletedAt != null && (
                  <Text style={styles.detailInfoRow}>
                    Duration: {formatTime((parsedWorkout.stretchCompletedAt - parsedWorkout.stretchStartedAt) / 1000)}
                  </Text>
                )}
              </View>
            </>
          )}

          <Text style={styles.detailSectionTitle}>Export Workout</Text>
          <Text style={styles.detailExportHint}>
            Export the complete workout record to another app or save it externally.
          </Text>
          <View style={styles.detailExportRow}>
            {(["pdf", "html", "txt"] as WorkoutExportFormat[]).map((format) => (
              <Pressable
                key={format}
                style={styles.detailExportButton}
                onPress={() => handleExport(format)}
              >
                <Text style={styles.detailExportButtonText}>
                  {format.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

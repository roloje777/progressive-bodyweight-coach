import { abortReasonLabel, abortStageLabel } from "@/utils/abortPresentation";
// app/screens/workoutDetail.tsx
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CompletedSession, WorkoutReason } from "../../models/WorkoutLog";
import { programs } from "../../data/programs";
import { useAppStyles } from "../../styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
import { formatLocalizedDate, formatLocalizedTime } from "@/utils/localizedDate";
import { localizeHistoryText, localizeWeek, localizeDay } from "@/i18n/historyPresentation";
import { localizeAnalyticsText } from "@/i18n/analyticsPresentation";
import { getWorkoutStatusPresentation } from "../../utils/workoutPresentation";
import { hydrateExercise } from "@/utils/hydrateExercise";
import { WORKOUT_FEEDBACK_OPTIONS_BY_RATING } from "@/models/WorkoutFeedback";
import {
  exportWorkoutReport,
  WorkoutExportFormat,
} from "@/utils/workoutExport";

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
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { language, workoutTitle: localizeWorkoutTitle, exerciseName: localizeExerciseName } = useTranslation();
  const h = (text: string) => localizeHistoryText(language, text);
  const { workout } = useLocalSearchParams();
  const [recoveryExpanded, setRecoveryExpanded] = React.useState(false);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatClockTime = (timestamp: number) =>
    formatLocalizedTime(timestamp, language, { hour: "2-digit", minute: "2-digit" });

  const formatDate = (timestamp: number) =>
    formatLocalizedDate(timestamp, language, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (!workout || typeof workout !== "string") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{h("No workout data found.")}</Text>
      </View>
    );
  }

  let parsedWorkout: CompletedSession;

  try {
    parsedWorkout = JSON.parse(workout);
  } catch {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{h("Unable to read this workout.")}</Text>
      </View>
    );
  }

  const abort = parsedWorkout.abortAttempt;
  const program = programs.find((p) => p.id === parsedWorkout.programId);
  const day = program?.days.find((d) => d.id === parsedWorkout.dayId);

  const rawDayTitle = day?.title ?? (parsedWorkout.dayId && parsedWorkout.dayId !== "unknown" ? parsedWorkout.dayId : (language === "pt-PT" ? "Dia não registado" : "Day not recorded"));
  const dayTitle = localizeWorkoutTitle(rawDayTitle);
  const rawFocus = rawDayTitle.replace(/^Day\s+\d+\s*[-–—:]\s*/i, "").trim();
  const focus = localizeWorkoutTitle(`Day 1 - ${rawFocus}`).replace(/^Dia\s+1\s*[-–—:]\s*/i, "").replace(/^Day\s+1\s*[-–—:]\s*/i, "").trim();
  const weekLabel =
    parsedWorkout.weekIndex != null
      ? localizeWeek(language, parsedWorkout.weekIndex + 1)
      : h("Week not recorded");
  const dayLabel =
    parsedWorkout.dayIndex != null
      ? localizeDay(language, parsedWorkout.dayIndex + 1)
      : dayTitle;
  const trainingMode = parsedWorkout.trainingMode ?? "normal";
  const workoutReason = parsedWorkout.workoutReason ?? "scheduled";
  const workoutReasonLabel = h(WORKOUT_REASON_LABELS[workoutReason]);
  const workoutStatus = getWorkoutStatusPresentation(parsedWorkout, program);
  const trainingModeLabel = h(workoutStatus.label);

  const getExerciseName = (exerciseId: string) => {
    const configured = day?.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId,
    );

    const fallback = configured ? hydrateExercise(configured).name : exerciseId;
    return localizeExerciseName(exerciseId, fallback);
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
    if (set.status === "skipped") return h("Skipped");
    if (set.repsCompleted !== undefined) return `${set.repsCompleted} ${h("reps")}`;
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

  const getSectionDuration = (
    trustedDuration: number | undefined,
    startedAt: number | undefined,
    completedAt: number | undefined,
  ) => {
    if (trustedDuration !== undefined) {
      return Math.max(0, trustedDuration);
    }

    if (startedAt !== undefined && completedAt !== undefined) {
      return Math.max(0, (completedAt - startedAt) / 1000);
    }

    return undefined;
  };

  // Prefer trusted active durations saved at workout completion. Timestamp
  // fallbacks keep older workout history entries readable.
  const totalWorkoutDuration =
    parsedWorkout.workoutDuration !== undefined
      ? parsedWorkout.workoutDuration
      : (parsedWorkout.endWorkoutTime - parsedWorkout.startWorkoutTime) / 1000;

  const warmupDuration = getSectionDuration(
    parsedWorkout.warmupDuration,
    parsedWorkout.warmupStartedAt,
    parsedWorkout.warmupCompletedAt,
  );

  const mainWorkoutDuration = getSectionDuration(
    parsedWorkout.mainWorkoutDuration,
    parsedWorkout.mainStartedAt,
    parsedWorkout.mainCompletedAt,
  );

  const stretchDuration = getSectionDuration(
    parsedWorkout.stretchDuration,
    parsedWorkout.stretchStartedAt,
    parsedWorkout.stretchCompletedAt,
  );

  const feedbackLabels = (parsedWorkout.feedback?.tags ?? []).map((tag) => {
    const options = Object.values(WORKOUT_FEEDBACK_OPTIONS_BY_RATING).flat();
    const label = options.find((option) => option.id === tag)?.label ?? tag;
    return localizeAnalyticsText(language, label);
  });

  const recoveryActivity = parsedWorkout.recoveryActivity;
  const recoveryActivityLabel = recoveryActivity
    ? h(RECOVERY_ACTIVITY_LABELS[recoveryActivity.type])
    : undefined;

  const recovery = parsedWorkout.recovery;
  const recoveryMethodLabel =
    recovery?.method === "manual"
      ? h("Completed manually after interruption")
      : recovery?.method === "mixed"
        ? h("Resumed with manual recovered results")
        : h("Resumed after interruption");
  const recoveryInterruptionLabel =
    recovery?.interruptionKind === "processRestart"
      ? h("App restart / closed app")
      : recovery?.interruptionKind === "extendedBackground"
        ? h("Extended background interruption")
        : recovery?.interruptionKind === "briefBackground"
          ? h("Brief background interruption")
          : undefined;

  const buildExportReport = () => {
    const programName = localizeWorkoutTitle(program?.level ?? program?.name ?? parsedWorkout.programId);
    const date = formatDate(parsedWorkout.startWorkoutTime);

    const exerciseText = parsedWorkout.exercises
      .map((exercise) => {
        const exerciseTotals = calculateExerciseTotals(exercise);
        const sets = exercise.sets
          .map((set: any) => `  ${h("Set")} ${set.setNumber}: ${getSetValue(set)}`)
          .join("\n");

        return `${getExerciseName(exercise.exerciseId)}\nSets: ${exerciseTotals.completedSets}/${exerciseTotals.totalSets} completed\n${sets}`;
      })
      .join("\n\n");

    const warmupLines = parsedWorkout.warmup
      ? [
          "",
          h("Dynamic Warm-up").toUpperCase(),
          "---------------",
          `${h("Completed")}: ${parsedWorkout.warmup.completed.length}`,
          `${h("Skipped")}: ${parsedWorkout.warmup.skipped.length}`,
          `${h("Section skipped")}: ${parsedWorkout.warmup.sectionSkipped ? h("Yes") : h("No")}`,
          warmupDuration != null ? `${h("Duration")}: ${formatTime(warmupDuration)}` : undefined,
        ].filter((line): line is string => line !== undefined)
      : [];

    const stretchLines = parsedWorkout.stretch
      ? [
          "",
          h("Static Stretch").toUpperCase(),
          "--------------",
          `${h("Completed")}: ${parsedWorkout.stretch.completed.length}`,
          `${h("Skipped")}: ${parsedWorkout.stretch.skipped.length}`,
          `${h("Section skipped")}: ${parsedWorkout.stretch.sectionSkipped ? h("Yes") : h("No")}`,
          stretchDuration != null ? `${h("Duration")}: ${formatTime(stretchDuration)}` : undefined,
        ].filter((line): line is string => line !== undefined)
      : [];

    const recoveryLines = recoveryActivity
      ? [
          `${h("Recovery activity")}: ${recoveryActivityLabel}`,
          recoveryActivity.durationMinutes != null
            ? `${h("Recovery duration")}: ${recoveryActivity.durationMinutes} min`
            : undefined,
          recoveryActivity.distance != null
            ? `${h("Recovery distance")}: ${recoveryActivity.distance} ${recoveryActivity.distanceUnit ?? "km"}`
            : undefined,
          recoveryActivity.notes ? `${h("Recovery notes")}: ${recoveryActivity.notes}` : undefined,
        ].filter(Boolean)
      : [];

    const lines = [
      h("Workout Detail").toUpperCase(),
      "==============",
      `${h("Program")}: ${programName}`,
      `${weekLabel} · ${dayLabel}`,
      `${h("Focus")}: ${focus || dayTitle}`,
      `${h("Workout reason")}: ${workoutReasonLabel}`,
      `${h("Training mode")}: ${trainingModeLabel}`,
      recovery ? `${h("Recovered workout")}: ${recoveryMethodLabel}` : undefined,
      recoveryInterruptionLabel
        ? `${h("Recovery interruption")}: ${recoveryInterruptionLabel}`
        : undefined,
      recovery?.manualSetCount
        ? `${h("Manually recovered sets")}: ${recovery.manualSetCount}`
        : undefined,
      recovery?.excludedFromProgressionCount
        ? `${h("Recovered sets excluded from progression")}: ${recovery.excludedFromProgressionCount}`
        : undefined,
      `${h("Date")}: ${date}`,
      `${h("Started")}: ${formatClockTime(parsedWorkout.startWorkoutTime)}`,
      `${h("Finished")}: ${formatClockTime(parsedWorkout.endWorkoutTime)}`,
      "",
      h("Performance Summary").toUpperCase(),
      "-------------------",
      `${h("Total workout duration")}: ${formatTime(totalWorkoutDuration)}`,
      mainWorkoutDuration != null
        ? `${h("Main workout duration")}: ${formatTime(mainWorkoutDuration)}`
        : undefined,
      `${h("Time under tension")}: ${formatTime(totals.timeUnderTension)}`,
      `${h("Exercises")}: ${parsedWorkout.exercises.length}`,
      `${h("Sets")}: ${totals.completedSets}/${totals.totalSets} ${h("completed")}`,
      `${h("Skipped sets")}: ${totals.skippedSets}`,
      `${h("Total reps")}: ${totals.totalReps}`,
      ...recoveryLines,
      ...warmupLines,
      "",
      h("Main Exercises").toUpperCase(),
      "--------------",
      exerciseText,
      ...stretchLines,
      "",
      h("Workout Feedback").toUpperCase(),
      "----------------",
      `${h("Rating")}: ${parsedWorkout.feedback?.rating ?? h("Not recorded")}/5`,
      `${h("Tags")}: ${feedbackLabels.length ? feedbackLabels.join(", ") : h("None")}`,
      `${h("Comment")}: ${parsedWorkout.feedback?.comment || h("No comments")}`,
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
  <h1>${h("Workout Detail")}</h1>
  <div class="subtitle">${escapeHtml(date)} · ${escapeHtml(programName)}</div>
  <div class="card grid">
    <div><div class="label">${h("Program week")}</div><div class="value">${escapeHtml(weekLabel)}</div></div>
    <div><div class="label">${h("Workout")}</div><div class="value">${escapeHtml(dayTitle)}</div></div>
    <div><div class="label">${h("Focus")}</div><div class="value">${escapeHtml(focus || dayTitle)}</div></div>
    <div><div class="label">${h("Workout reason")}</div><div class="value">${escapeHtml(workoutReasonLabel)}</div></div>
    <div><div class="label">${h("Training mode")}</div><div class="value">${escapeHtml(trainingModeLabel)}</div></div>
  </div>
  ${
    recovery
      ? `<h2>${h("Recovery history")}</h2><div class="card">
          <div><strong>${h("Method")}:</strong> ${escapeHtml(recoveryMethodLabel)}</div>
          ${recoveryInterruptionLabel ? `<div><strong>${h("Interruption")}:</strong> ${escapeHtml(recoveryInterruptionLabel)}</div>` : ""}
          <div><strong>${h("Manual recovered sets")}:</strong> ${recovery.manualSetCount}</div>
          <div><strong>${h("Unusual results confirmed")}:</strong> ${recovery.advisoryConfirmedCount}</div>
          <div><strong>${h("Excluded from progression")}:</strong> ${recovery.excludedFromProgressionCount}</div>
        </div>`
      : ""
  }
  <h2>${h("Performance Summary")}</h2>
  <div class="card grid">
    <div><div class="label">${h("Total duration")}</div><div class="value">${formatTime(totalWorkoutDuration)}</div></div>
    ${mainWorkoutDuration != null ? `<div><div class="label">${h("Main workout duration")}</div><div class="value">${formatTime(mainWorkoutDuration)}</div></div>` : ""}
    <div><div class="label">${h("Time under tension")}</div><div class="value">${formatTime(totals.timeUnderTension)}</div></div>
    <div><div class="label">${h("Completed sets")}</div><div class="value">${totals.completedSets} / ${totals.totalSets}</div></div>
    <div><div class="label">${h("Total reps")}</div><div class="value">${totals.totalReps}</div></div>
  </div>
  ${
    recoveryActivity
      ? `<h2>${h("Recovery context")}</h2><div class="card">${recoveryLines
          .map((line) => `<div>${escapeHtml(String(line))}</div>`)
          .join("")}</div>`
      : ""
  }
  ${
    parsedWorkout.warmup
      ? `<h2>${h("Dynamic Warm-up")}</h2><div class="card">
          <div><strong>${h("Completed")}:</strong> ${parsedWorkout.warmup.completed.length}</div>
          <div><strong>${h("Skipped")}:</strong> ${parsedWorkout.warmup.skipped.length}</div>
          <div><strong>${h("Section skipped")}:</strong> ${parsedWorkout.warmup.sectionSkipped ? h("Yes") : h("No")}</div>
          ${warmupDuration != null ? `<div><strong>${h("Duration")}:</strong> ${formatTime(warmupDuration)}</div>` : ""}
        </div>`
      : ""
  }
  <h2>${h("Main Exercises")}</h2>
  ${parsedWorkout.exercises
    .map(
      (exercise) => `<div class="exercise"><strong>${escapeHtml(
        getExerciseName(exercise.exerciseId),
      )}</strong>${exercise.sets
        .map(
          (set: any) =>
            `<div class="set">${h("Set")} ${set.setNumber}: ${escapeHtml(getSetValue(set))}</div>`,
        )
        .join("")}</div>`,
    )
    .join("")}
  ${
    parsedWorkout.stretch
      ? `<h2>${h("Static Stretch")}</h2><div class="card">
          <div><strong>${h("Completed")}:</strong> ${parsedWorkout.stretch.completed.length}</div>
          <div><strong>${h("Skipped")}:</strong> ${parsedWorkout.stretch.skipped.length}</div>
          <div><strong>${h("Section skipped")}:</strong> ${parsedWorkout.stretch.sectionSkipped ? h("Yes") : h("No")}</div>
          ${stretchDuration != null ? `<div><strong>${h("Duration")}:</strong> ${formatTime(stretchDuration)}</div>` : ""}
        </div>`
      : ""
  }
  <h2>${h("Workout Feedback")}</h2>
  <div class="card">
    <div><strong>${h("Rating")}:</strong> ${parsedWorkout.feedback?.rating ?? h("Not recorded")}/5</div>
    <div><strong>${h("Tags")}:</strong> ${escapeHtml(feedbackLabels.length ? feedbackLabels.join(", ") : h("None"))}</div>
    <div><strong>${h("Comment")}:</strong> ${escapeHtml(parsedWorkout.feedback?.comment || h("No comments"))}</div>
  </div>
</body>
</html>`;

    const safeDate = new Date(parsedWorkout.startWorkoutTime)
      .toISOString()
      .slice(0, 10);

    return {
      filenameBase: `workout-${safeDate}-${parsedWorkout.programId}-${parsedWorkout.dayId}`,
      title: h("Workout Detail"),
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
        h("Export failed"),
        error instanceof Error
          ? error.message
          : h("The workout could not be exported."),
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
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContainer}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              paddingVertical: 8,
              marginBottom: 8,
            }}
          >
            <MaterialIcons name="arrow-back" size={19} color={palette.text} />
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: "700" }}>{h("Back")}</Text>
          </Pressable>
          <Text style={styles.title}>{h("Workout Detail")}</Text>
          {abort && <View style={{padding:16,borderWidth:1,borderColor:palette.danger,borderRadius:12,marginVertical:12}}>
            <Text style={{color:palette.danger,fontWeight:"bold",fontSize:18}}>{language === "pt-PT" ? "TREINO INTERROMPIDO" : "WORKOUT ABORTED"}</Text>
            <Text style={{color:palette.text,marginTop:8}}>{language === "pt-PT" ? "Motivo" : "Reason"}: {abortReasonLabel(abort.reason, language)}</Text>
            {abort.notes && <Text style={{color:palette.text,marginTop:5}}>{abort.notes}</Text>}
            <Text style={{color:palette.text,marginTop:8}}>{language === "pt-PT" ? "Etapa" : "Stage"}: {abortStageLabel(abort.stage, language)}</Text>
            <Text style={{color:palette.text}}>{language === "pt-PT" ? "Séries" : "Sets"}: {abort.completedSets}/{abort.plannedSets} ({abort.completionPercent}%)</Text>
            <Text style={{color:palette.text}}>{language === "pt-PT" ? "Tentativa" : "Attempt"}: {abort.attemptId}</Text>
            <Text style={{color:palette.text,marginTop:8}}>{language === "pt-PT" ? "Esta tentativa não conta para a progressão." : "This attempt does not count toward progression."}</Text>
          </View>}
          <Text style={styles.summaryDate}>
            {formatDate(parsedWorkout.startWorkoutTime)}
          </Text>

          <View style={styles.detailOverviewCard}>
            <Text style={styles.detailProgramLabel}>
              {localizeWorkoutTitle(program?.level ?? program?.name ?? (parsedWorkout.programId && parsedWorkout.programId !== "unknown" ? parsedWorkout.programId.toUpperCase() : (language === "pt-PT" ? "Programa não registado" : "Program not recorded")))}
            </Text>
            <Text style={styles.detailWorkoutTitle}>{dayTitle}</Text>
            <Text style={styles.detailContextText}>
              {weekLabel} · {dayLabel} · {focus || dayTitle}
            </Text>
            <View style={styles.detailModeBadge}>
              <Text style={styles.detailModeBadgeText}>
                {workoutStatus.label}
              </Text>
            </View>
            <Text style={styles.detailContextText}>
              {h("Workout reason")}: {workoutReasonLabel}
            </Text>
            {workoutReason === "repeat" && (
              <Text style={styles.detailContextText}>
                {h("Training mode")}: {trainingModeLabel}
              </Text>
            )}
          </View>

          {!abort && trainingMode === "normal" && (
            <View style={{
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              padding: 16,
              marginBottom: 18,
              backgroundColor: palette.surfaceAlt,
            }}>
              <Text style={{ color: palette.text, fontSize: 17, fontWeight: "700" }}>
                {language === "pt-PT" ? "Resultado da tentativa" : "Attempt outcome"}
              </Text>
              {parsedWorkout.progressionResult?.status === "available" &&
               typeof parsedWorkout.progressionResult.completionPercent === "number" ? (
                <>
                  <Text style={{ color: palette.text, marginTop: 10, fontWeight: "600" }}>
                    {parsedWorkout.progressionResult.advanceDay
                      ? (language === "pt-PT" ? "Progressão alcançada" : "Progression achieved")
                      : (language === "pt-PT" ? "Progressão não alcançada" : "Progression not achieved")}
                  </Text>
                  <Text style={{ color: palette.textMuted, marginTop: 8 }}>
                    {language === "pt-PT" ? "Séries obrigatórias concluídas" : "Required sets completed"}: {parsedWorkout.progressionResult.requiredCompletedSets} / {parsedWorkout.progressionResult.requiredTotalSets} ({parsedWorkout.progressionResult.completionPercent}%)
                  </Text>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: palette.border, overflow: "hidden", marginTop: 9 }}>
                    <View style={{
                      height: "100%",
                      width: `${Math.max(0, Math.min(100, parsedWorkout.progressionResult.completionPercent))}%`,
                      backgroundColor: parsedWorkout.progressionResult.advanceDay ? palette.info : palette.textMuted,
                    }} />
                  </View>
                  {!parsedWorkout.progressionResult.advanceDay && parsedWorkout.progressionResult.reasons?.includes("primary_exercise_missing") && (
                    <Text style={{ color: palette.textMuted, marginTop: 9 }}>
                      {language === "pt-PT" ? "Faltam séries de um exercício principal obrigatório." : "A required primary exercise has no completed sets."}
                    </Text>
                  )}
                  {!parsedWorkout.progressionResult.advanceDay && parsedWorkout.progressionResult.reasons?.includes("below_proposed_85_percent") && (
                    <Text style={{ color: palette.textMuted, marginTop: 6 }}>
                      {language === "pt-PT" ? "Menos de 85% das séries obrigatórias foram concluídas." : "Fewer than 85% of required sets were completed."}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={{ color: palette.textMuted, marginTop: 8 }}>
                  {language === "pt-PT" ? "Resultado da progressão indisponível para este registo." : "Progression outcome unavailable for this record."}
                </Text>
              )}
            </View>
          )}

          {recovery?.occurred && (
            <View
              style={{
                borderWidth: 1,
                borderColor: palette.textMuted,
                borderRadius: 12,
                padding: 14,
                marginBottom: 18,
              }}
            >
              <Pressable onPress={() => setRecoveryExpanded((value) => !value)}>
                <Text style={{ color: palette.text, fontWeight: "700", fontSize: 16 }}>
                  ↻ {h("Recovered Workout")}
                </Text>
                <Text style={{ color: palette.textMuted, marginTop: 5 }}>
                  {recoveryMethodLabel}
                </Text>
                {recovery.manualSetCount > 0 && (
                  <Text style={{ color: palette.textMuted, marginTop: 3 }}>
                    {recovery.manualSetCount} manually recovered set{recovery.manualSetCount === 1 ? "" : "s"}
                  </Text>
                )}
                <Text style={{ color: palette.textMuted, marginTop: 8, fontWeight: "600" }}>
                  {recoveryExpanded ? h("Hide recovery details") : h("Recovery details")}
                </Text>
              </Pressable>

              {recoveryExpanded && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.border }}>
                  <Text style={styles.detailInfoRow}>
                    {h("Recovery method")}: {recoveryMethodLabel}
                  </Text>
                  {recoveryInterruptionLabel && (
                    <Text style={styles.detailInfoRow}>
                      {h("Interruption")}: {recoveryInterruptionLabel}
                    </Text>
                  )}
                  <Text style={styles.detailInfoRow}>
                    {h("Manual recovered sets")}: {recovery.manualSetCount}
                  </Text>
                  <Text style={styles.detailInfoRow}>
                    {h("Unusual results confirmed")}: {recovery.advisoryConfirmedCount}
                  </Text>
                  <Text style={styles.detailInfoRow}>
                    {h("Excluded from progression")}: {recovery.excludedFromProgressionCount}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.detailSectionTitle}>{h("Performance Summary")}</Text>
          <View style={styles.detailStatsGrid}>
            {renderStat(h("Total duration"), formatTime(totalWorkoutDuration))}
            {renderStat(h("Time under tension"), formatTime(totals.timeUnderTension))}
            {renderStat(h("Completed sets"), `${totals.completedSets} / ${totals.totalSets}`)}
            {renderStat(h("Total reps"), totals.totalReps)}
            {renderStat(h("Exercises"), parsedWorkout.exercises.length)}
            {renderStat(h("Skipped sets"), totals.skippedSets)}
          </View>

          <View style={styles.detailInfoCard}>
            <Text style={styles.detailInfoRow}>
              {h("Started")}: {formatClockTime(parsedWorkout.startWorkoutTime)}
            </Text>
            <Text style={styles.detailInfoRow}>
              {h("Finished")}: {formatClockTime(parsedWorkout.endWorkoutTime)}
            </Text>
            {mainWorkoutDuration != null && (
              <Text style={styles.detailInfoRow}>
                {h("Main workout")}: {formatTime(mainWorkoutDuration)}
              </Text>
            )}
          </View>

          {(parsedWorkout.deload || recoveryActivity) && (
            <>
              <Text style={styles.detailSectionTitle}>{h("Recovery & Coaching Context")}</Text>
              <View style={styles.detailInfoCard}>
                {parsedWorkout.deload && (
                  <>
                    <Text style={styles.detailInfoRow}>
                      {h("Reason")}: {localizeAnalyticsText(language, parsedWorkout.deload.reason)}
                    </Text>
                    <Text style={styles.detailInfoRow}>
                      {h("Phase")}: {localizeAnalyticsText(language, parsedWorkout.deload.phase)}
                    </Text>
                    <Text style={styles.detailInfoRow}>
                      {h("Target scale")}: {Math.round(parsedWorkout.deload.targetScale * 100)}%
                    </Text>
                  </>
                )}
                {recoveryActivity && (
                  <>
                    <Text style={styles.detailInfoRow}>
                      {h("Activity")}: {recoveryActivityLabel}
                    </Text>
                    {recoveryActivity.durationMinutes != null && (
                      <Text style={styles.detailInfoRow}>
                        {h("Duration")}: {recoveryActivity.durationMinutes} min
                      </Text>
                    )}
                    {recoveryActivity.distance != null && (
                      <Text style={styles.detailInfoRow}>
                        {h("Distance")}: {recoveryActivity.distance} {recoveryActivity.distanceUnit ?? "km"}
                      </Text>
                    )}
                    {recoveryActivity.notes && (
                      <Text style={styles.detailInfoRow}>
                        {h("Notes")}: {recoveryActivity.notes}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </>
          )}

          <Text style={styles.detailSectionTitle}>{h("Main Exercises")}</Text>
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
                  {h("Sets")}: {exerciseTotals.completedSets}/{exerciseTotals.totalSets} {h("completed")}
                </Text>
                {exerciseTotals.totalReps > 0 && (
                  <Text style={styles.exerciseTotal}>
                    {h("Total Reps")}: {exerciseTotals.totalReps}
                  </Text>
                )}
                {(exerciseTotals.totalLeft > 0 || exerciseTotals.totalRight > 0) && (
                  <Text style={styles.exerciseTotal}>
                    {h("Total Reps")}: L:{exerciseTotals.totalLeft} | R:{exerciseTotals.totalRight}
                  </Text>
                )}
                {exerciseTotals.totalTime > 0 && (
                  <Text style={styles.exerciseTotal}>
                    {h("Time Under Tension")}: {formatTime(exerciseTotals.totalTime)}
                  </Text>
                )}
                {repImbalance > 0 && (
                  <Text style={styles.detailWarningText}>
                    {h("Side imbalance")}: {repImbalance} {h("reps")}
                  </Text>
                )}
                {timeImbalance > 0 && (
                  <Text style={styles.detailWarningText}>
                    {h("Side imbalance")}: {timeImbalance}s
                  </Text>
                )}
                <View style={styles.detailSetList}>
                  {exercise.sets.map((set: any, index: number) => (
                    <Text
                      key={`${exercise.exerciseId}-${set.setNumber}-${index}`}
                      style={styles.setText}
                    >
                      {h("Set")} {set.setNumber}: {getSetValue(set)}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}

          <Text style={styles.detailSectionTitle}>{h("Workout Feedback")}</Text>
          <View style={styles.detailInfoCard}>
            <Text style={styles.detailInfoRow}>
              {h("Rating")}: {"⭐".repeat(parsedWorkout.feedback?.rating ?? 0) || h("Not recorded")}
            </Text>
            <Text style={styles.detailInfoRow}>
              {h("Tags")}: {feedbackLabels.length ? feedbackLabels.join(", ") : h("None")}
            </Text>
            <Text style={styles.detailFeedbackComment}>
              {parsedWorkout.feedback?.comment || h("No comments")}
            </Text>
          </View>

          {parsedWorkout.warmup && (
            <>
              <Text style={styles.detailSectionTitle}>{h("Dynamic Warm-up")}</Text>
              <View style={styles.detailInfoCard}>
                <Text style={styles.detailInfoRow}>
                  {h("Completed")}: {parsedWorkout.warmup.completed.length} · {h("Skipped")}: {parsedWorkout.warmup.skipped.length}
                </Text>
                <Text style={styles.detailInfoRow}>
                  {h("Section skipped")}: {parsedWorkout.warmup.sectionSkipped ? h("Yes") : h("No")}
                </Text>
                {warmupDuration != null && (
                  <Text style={styles.detailInfoRow}>
                    {h("Duration")}: {formatTime(warmupDuration)}
                  </Text>
                )}
              </View>
            </>
          )}

          {parsedWorkout.stretch && (
            <>
              <Text style={styles.detailSectionTitle}>{h("Static Stretch")}</Text>
              <View style={styles.detailInfoCard}>
                <Text style={styles.detailInfoRow}>
                  {h("Completed")}: {parsedWorkout.stretch.completed.length} · {h("Skipped")}: {parsedWorkout.stretch.skipped.length}
                </Text>
                <Text style={styles.detailInfoRow}>
                  {h("Section skipped")}: {parsedWorkout.stretch.sectionSkipped ? h("Yes") : h("No")}
                </Text>
                {stretchDuration != null && (
                  <Text style={styles.detailInfoRow}>
                    {h("Duration")}: {formatTime(stretchDuration)}
                  </Text>
                )}
              </View>
            </>
          )}

          <Text style={styles.detailSectionTitle}>{h("Export Workout")}</Text>
          <Text style={styles.detailExportHint}>
            {h("Export the complete workout record to another app or save it externally.")}
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

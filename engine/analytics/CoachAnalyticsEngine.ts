import { CoachAnalytics, CoachAnalyticsEvidence } from "@/models/analytics/CoachAnalytics";
import { AnalyticsTrend } from "@/models/analytics/AnalyticsTrend";

export type CoachAnalyticsInput = {
  overview: {
    workoutsCompleted: number;
    averageWorkoutRating: number | null;
    matchOrBeatSuccessRate: number | null;
    adherenceRate: number | null;
    readiness: { current: number | null; trend: AnalyticsTrend };
  };
  matchOrBeat: {
    eligibleTargets: number;
    successRate: number | null;
    trend: AnalyticsTrend;
  };
  recovery: {
    workoutsConsidered: number;
    averageWorkoutRating: number | null;
    painOccurrences: number;
    lowEnergyOccurrences: number;
    formBreakdownOccurrences: number;
    couldntFinishOccurrences: number;
    deloadWorkoutCount: number;
    verificationWorkoutCount: number;
    trend: AnalyticsTrend;
  };
  consistency: {
    scheduledWorkouts: number | null;
    completedScheduledWorkouts: number;
    adherenceRate: number | null;
    completedWorkoutCount: number;
  };
  trainingLoad: {
    workoutsCompleted: number;
    workingSetsCompleted: number;
    totalRepsCompleted: number;
    totalHoldSeconds: number;
    totalTimeUnderTensionSeconds: number;
  };
  exercises: Array<{
    sessionsPerformed: number;
    trend: AnalyticsTrend;
  }>;
};

function percent(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function rating(value: number | null) {
  return value == null ? "—" : value.toFixed(1);
}

function trendLabel(value: AnalyticsTrend) {
  switch (value) {
    case "improving":
      return "Improving";
    case "stable":
      return "Stable";
    case "declining":
      return "Declining";
    default:
      return "Building history";
  }
}

function readinessLabel(value: number | null) {
  if (value == null) return "Building";
  if (value <= 0) return "Deload";
  if (value <= 25) return "Blocked";
  if (value <= 50) return "Building";
  if (value < 100) return "Progressing";
  return "Ready";
}

export function buildCoachAnalytics(input: CoachAnalyticsInput): CoachAnalytics {
  const negativeSignals =
    input.recovery.painOccurrences +
    input.recovery.lowEnergyOccurrences +
    input.recovery.formBreakdownOccurrences +
    input.recovery.couldntFinishOccurrences;

  const trainedExercises = input.exercises.filter((item) => item.sessionsPerformed > 0);
  const improvingExercises = trainedExercises.filter((item) => item.trend === "improving").length;
  const decliningExercises = trainedExercises.filter((item) => item.trend === "declining").length;

  const adherence = input.consistency.adherenceRate ?? input.overview.adherenceRate;
  const readiness = input.overview.readiness.current;
  const mbTrend = input.matchOrBeat.trend;
  const recoveryTrend = input.recovery.trend;
  const hasUsefulHistory =
    input.overview.workoutsCompleted >= 3 ||
    input.matchOrBeat.eligibleTargets >= 4 ||
    input.recovery.workoutsConsidered >= 3;

  const evidence: CoachAnalyticsEvidence[] = [
    {
      source: "readiness",
      label: "Graduation readiness",
      value: readinessLabel(readiness),
      interpretation:
        readiness == null
          ? "More completed program-week evaluations are needed."
          : readiness >= 100
            ? "Current readiness criteria have been met."
            : readiness <= 25
              ? "Current program evaluation is blocking progression."
              : "Readiness is still being built in the current program.",
      tone: readiness != null && readiness >= 100 ? "positive" : readiness != null && readiness <= 25 ? "caution" : "neutral",
    },
    {
      source: "match-or-beat",
      label: "Match or Beat",
      value: `${percent(input.matchOrBeat.successRate)} · ${trendLabel(mbTrend)}`,
      interpretation:
        input.matchOrBeat.successRate == null
          ? "There is not enough eligible progression evidence yet."
          : mbTrend === "improving"
            ? "Eligible performance evidence is moving upward."
            : mbTrend === "declining"
              ? "Recent eligible targets are being met less often."
              : "Eligible performance evidence is holding relatively steady.",
      tone: mbTrend === "improving" ? "positive" : mbTrend === "declining" ? "caution" : "neutral",
    },
    {
      source: "recovery",
      label: "Recovery pattern",
      value: `${rating(input.recovery.averageWorkoutRating)}/5 · ${trendLabel(recoveryTrend)}`,
      interpretation:
        input.recovery.workoutsConsidered === 0
          ? "No recovery pattern is available yet."
          : recoveryTrend === "improving"
            ? "Negative training feedback is becoming less frequent."
            : recoveryTrend === "declining"
              ? "Negative training feedback is becoming more frequent."
              : "Recovery-related feedback is relatively stable.",
      tone: recoveryTrend === "improving" ? "positive" : recoveryTrend === "declining" ? "caution" : "neutral",
    },
    {
      source: "consistency",
      label: "Program adherence",
      value: percent(adherence),
      interpretation:
        adherence == null
          ? "Closed program weeks are needed before adherence can be judged."
          : adherence >= 90
            ? "Training consistency is giving the progression engine strong comparable history."
            : adherence < 70
              ? "Inconsistent completion is limiting the reliability of progression evidence."
              : "Training consistency is usable but still has room to improve.",
      tone: adherence != null && adherence >= 90 ? "positive" : adherence != null && adherence < 70 ? "caution" : "neutral",
    },
    {
      source: "exercise",
      label: "Exercise trends",
      value: trainedExercises.length
        ? `${improvingExercises} improving · ${decliningExercises} declining`
        : "—",
      interpretation:
        trainedExercises.length === 0
          ? "Exercise-specific trends will appear after more repeated sessions."
          : improvingExercises > decliningExercises
            ? "More tracked exercises are improving than declining."
            : decliningExercises > improvingExercises
              ? "More tracked exercises are declining than improving."
              : "Exercise trends are mixed or mostly stable.",
      tone: improvingExercises > decliningExercises ? "positive" : decliningExercises > improvingExercises ? "caution" : "neutral",
    },
    {
      source: "training-load",
      label: "Training load",
      value: `${input.trainingLoad.workingSetsCompleted} working sets`,
      interpretation:
        input.trainingLoad.workoutsCompleted === 0
          ? "No completed training load exists in this period."
          : `Workload comes from ${input.trainingLoad.workoutsCompleted} completed workout${input.trainingLoad.workoutsCompleted === 1 ? "" : "s"} in the selected period.`,
      tone: "neutral",
    },
  ];

  if (!hasUsefulHistory) {
    return {
      state: "building-evidence",
      tone: "neutral",
      headline: "Building your training picture",
      summary:
        "There is not enough comparable history yet for a strong cross-signal interpretation. The Coach will become more specific as workouts, eligible Match-or-Beat targets and program-week evaluations accumulate.",
      action: "Keep completing the program normally and recording workout feedback so the app can build reliable evidence.",
      evidence,
    };
  }

  if (readiness != null && readiness >= 100 && recoveryTrend !== "declining") {
    return {
      state: "graduation-ready",
      tone: "positive",
      headline: "Your current program looks ready to progress",
      summary:
        "Graduation readiness has been reached without a worsening recovery pattern. Your performance history is providing enough evidence for the Graduation Coach to guide the next program decision.",
      action: "Follow the Graduation Coach rather than forcing additional progression outside the program flow.",
      evidence,
    };
  }

  if (recoveryTrend === "declining" && negativeSignals > 0 && mbTrend === "improving") {
    return {
      state: "progress-with-recovery-strain",
      tone: "caution",
      headline: "Performance is rising, but recovery signals are worsening",
      summary:
        "You are meeting progression targets more successfully, but negative workout feedback is becoming more frequent. That combination can mean the current progress is costing more recovery than before.",
      action: "Keep quality high, avoid adding extra work, and follow any deload or recovery guidance the app presents.",
      evidence,
    };
  }

  if (recoveryTrend === "declining" && negativeSignals > 0 && (mbTrend === "declining" || (readiness != null && readiness <= 25))) {
    return {
      state: "recovery-priority",
      tone: "caution",
      headline: "Recovery evidence should take priority",
      summary:
        "Performance evidence is not improving while fatigue, pain, form or completion signals are becoming more prominent. The current history supports protecting recovery before pushing progression.",
      action: "Use the app's recovery/deload guidance and focus on completing high-quality prescribed work rather than chasing additional volume.",
      evidence,
    };
  }

  if (adherence != null && adherence < 70) {
    return {
      state: "consistency-priority",
      tone: "neutral",
      headline: "Consistency is the clearest next lever",
      summary:
        "The available performance and recovery data are harder to interpret confidently because too few scheduled sessions in closed program weeks are being completed.",
      action: "Prioritise completing the recommended schedule consistently before changing volume or progression targets.",
      evidence,
    };
  }

  if (mbTrend === "improving" && (recoveryTrend === "improving" || recoveryTrend === "stable")) {
    return {
      state: "sustainable-progress",
      tone: "positive",
      headline: "Progress is moving in a sustainable direction",
      summary:
        "Eligible Match-or-Beat evidence is improving while recovery feedback is stable or improving. That is the pattern we want to see while building toward readiness.",
      action: "Continue following the current progression targets and let the program increase difficulty when its readiness criteria are met.",
      evidence,
    };
  }

  if (mbTrend === "declining" && (recoveryTrend === "stable" || recoveryTrend === "improving")) {
    return {
      state: "performance-plateau",
      tone: "neutral",
      headline: "Performance has slowed without a clear recovery warning",
      summary:
        "Match-or-Beat evidence is declining, but recovery feedback is not worsening. This looks more like a performance plateau or adaptation period than a strong fatigue signal.",
      action: "Stay with the prescribed targets, protect technique, and allow more comparable sessions before changing the plan.",
      evidence,
    };
  }

  return {
    state: "steady-progress",
    tone: "neutral",
    headline: "Your training picture is currently steady",
    summary:
      "No single signal is strong enough to justify changing direction. Performance, recovery, consistency and workload should continue to be interpreted together as more history accumulates.",
    action: "Continue the current program and use the detail screens when you want to inspect the evidence behind this interpretation.",
    evidence,
  };
}

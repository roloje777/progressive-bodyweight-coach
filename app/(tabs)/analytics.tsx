import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AnalyticsLineChart } from "@/components/analytics/AnalyticsLineChart";
import { AnalyticsMetric, formatTrend } from "@/components/analytics/AnalyticsMetric";
import { AnalyticsRangeSelector } from "@/components/analytics/AnalyticsRangeSelector";
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { programs } from "@/data/programs";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ProgramLifecycleEvent } from "@/models/analytics/ProgramLifecycleEvent";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProgress } from "@/hooks/useProgress";
import { appTokens } from "@/styles/appStyles";

function formatPercent(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function formatRating(value: number | null) {
  return value == null ? "—" : value.toFixed(1);
}

function programName(programId: string) {
  return programs.find((program) => program.id === programId)?.level ?? programId;
}

function lifecycleLabel(event: ProgramLifecycleEvent) {
  switch (event.type) {
    case "program-started":
      return "Program started";
    case "graduation-earned":
      return "Graduation earned";
    case "graduated":
      return event.nextProgramId
        ? `Graduated to ${programName(event.nextProgramId)}`
        : "Graduated";
    case "repeat-week-started":
      return "Repeat week started";
    case "deload-triggered":
      return "Deload recommended";
    case "deload-started":
      return event.deloadReason === "pain" ? "Pain recovery started" : "Deload started";
    case "pain-recovery-started":
      return "Pain recovery triggered";
    case "verification-started":
      return "Verification started";
    case "deload-cleared":
      return "Recovery cycle completed";
  }
}

function lifecycleIcon(event: ProgramLifecycleEvent) {
  switch (event.type) {
    case "graduation-earned":
    case "graduated":
      return "emoji-events" as const;
    case "deload-triggered":
    case "deload-started":
    case "pain-recovery-started":
      return "self-improvement" as const;
    case "verification-started":
      return "fact-check" as const;
    case "repeat-week-started":
      return "replay" as const;
    case "deload-cleared":
      return "check-circle" as const;
    default:
      return "flag" as const;
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

function buildCoachInsight(args: {
  mbTrend: ReturnType<typeof formatTrend>;
  recoveryTrend: ReturnType<typeof formatTrend>;
  adherenceRate: number | null;
  readiness: number | null;
}) {
  if (args.readiness != null && args.readiness >= 100) {
    return "You are consistently meeting the current readiness criteria. Keep following the program and let the Graduation Coach guide the next step.";
  }

  if (args.recoveryTrend.label.includes("Improving") && args.mbTrend.label.includes("Improving")) {
    return "Your performance trend is improving while recovery signals are also moving in the right direction. That is a strong pattern for sustainable progression.";
  }

  if (args.mbTrend.label.includes("Improving")) {
    return "Your Match-or-Beat performance is trending upward. Keep using the current progression targets and prioritise consistent, high-quality sets.";
  }

  if (args.adherenceRate != null && args.adherenceRate >= 90) {
    return "Your program adherence is very consistent. That gives the progression engine reliable history to judge adaptation and readiness.";
  }

  return "Keep building consistent training history. As more comparable sessions accumulate, the Coach will be able to interpret your progress with greater confidence.";
}

function formatLifecycleDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalyticsScreen() {
  const [range, setRange] = useState<AnalyticsTimeRange>("12w");
  const [refreshing, setRefreshing] = useState(false);
  const { program, week } = useProgress();
  const { dashboard, isLoaded, refresh } = useAnalytics(range);

  const latestJourneyEvents = useMemo(
    () => [...dashboard.lifecycleEvents].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 6),
    [dashboard.lifecycleEvents],
  );

  const topExercises = dashboard.exercises
    .filter((exercise) => exercise.sessionsPerformed > 0)
    .slice(0, 4);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTokens.colors.primary} />
          <Text style={styles.loadingText}>Building your progress view…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const readinessTrend = formatTrend(dashboard.overview.readiness.trend);
  const mbTrend = formatTrend(dashboard.matchOrBeat.trend);
  const recoveryTrend = formatTrend(dashboard.recovery.trend);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appTokens.colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>PROGRESS</Text>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>
              Where you are, how you are progressing, and what your training history is telling us.
            </Text>
          </View>
          <MaterialIcons name="insights" size={34} color={appTokens.colors.primary} />
        </View>

        <AnalyticsRangeSelector value={range} onChange={setRange} />

        <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>
        <AnalyticsCard
          title={program.level}
          subtitle={`Current program • Week ${week + 1}`}
        >
          <View style={styles.currentJourney}>
            <View style={styles.journeyMarker} />
            <View style={{ flex: 1 }}>
              <Text style={styles.journeyCurrent}>You are here</Text>
              <Text style={styles.journeyProgram}>{program.name}</Text>
            </View>
            <Text style={styles.weekBadge}>W{week + 1}</Text>
          </View>

          {latestJourneyEvents.length ? (
            <View style={styles.timeline}>
              {latestJourneyEvents.map((event) => (
                <View key={event.id} style={styles.timelineRow}>
                  <View style={styles.timelineIcon}>
                    <MaterialIcons
                      name={lifecycleIcon(event)}
                      size={18}
                      color={appTokens.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineTitle}>{lifecycleLabel(event)}</Text>
                    <Text style={styles.timelineMeta}>
                      {programName(event.programId)}
                      {event.weekIndex != null ? ` • Week ${event.weekIndex + 1}` : ""}
                      {` • ${formatLifecycleDate(event.occurredAt)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Major program milestones will appear here as your journey continues.
            </Text>
          )}
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>PROGRESS OVERVIEW</Text>
        <AnalyticsCard title="Current training picture" subtitle="Based on the selected period">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric
              label="Workouts"
              value={`${dashboard.overview.workoutsCompleted}`}
            />
            <AnalyticsMetric
              label="Adherence"
              value={formatPercent(dashboard.overview.adherenceRate)}
              helper="Closed program weeks"
              accent
            />
            <AnalyticsMetric
              label="Match or Beat"
              value={formatPercent(dashboard.overview.matchOrBeatSuccessRate)}
            />
            <AnalyticsMetric
              label="Avg rating"
              value={formatRating(dashboard.overview.averageWorkoutRating)}
              helper="Out of 5"
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Graduation readiness" subtitle="Completed program-week evaluations">
          <View style={styles.trendHeader}>
            <Text style={styles.largeValue}>
              {readinessLabel(dashboard.overview.readiness.current)}
            </Text>
            <Text style={[styles.trendText, { color: readinessTrend.color }]}>
              {readinessTrend.label}
            </Text>
          </View>
          <AnalyticsLineChart
            points={dashboard.readinessHistory.map((point) => ({
              label: `W${point.weekIndex + 1}`,
              value: point.score,
            }))}
          />
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>MATCH OR BEAT</Text>
        <AnalyticsCard title="Progressive overload" subtitle="Eligible Match-or-Beat targets only">
          <View style={styles.trendHeader}>
            <Text style={styles.largeValue}>{formatPercent(dashboard.matchOrBeat.successRate)}</Text>
            <Text style={[styles.trendText, { color: mbTrend.color }]}>{mbTrend.label}</Text>
          </View>
          <AnalyticsLineChart
            valueSuffix="%"
            points={dashboard.matchOrBeat.weekly.map((point) => ({
              label: `W${point.weekIndex + 1}`,
              value: point.successRate,
            }))}
          />
          <View style={styles.miniStatsRow}>
            <Text style={styles.miniStat}>Exceeded {dashboard.matchOrBeat.exceeded}</Text>
            <Text style={styles.miniStat}>Matched {dashboard.matchOrBeat.matched}</Text>
            <Text style={styles.miniStat}>Missed {dashboard.matchOrBeat.missed}</Text>
          </View>
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>EXERCISE PROGRESS</Text>
        <AnalyticsCard title="Most trained exercises" subtitle="Best performance and current trend">
          {topExercises.length ? (
            topExercises.map((exercise, index) => {
              const trend = formatTrend(exercise.trend);
              const name = exerciseRegistry[exercise.exerciseId]?.name ?? exercise.exerciseId;
              return (
                <View
                  key={exercise.exerciseId}
                  style={[styles.exerciseRow, index < topExercises.length - 1 && styles.rowDivider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.sessionsPerformed} sessions • {trend.label}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.exerciseBest}>
                      {exercise.bestPerformance == null ? "—" : Math.round(exercise.bestPerformance)}
                    </Text>
                    <Text style={styles.exerciseUnit}>
                      {exercise.unit === "seconds" ? "sec best" : "reps best"}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Complete workouts to build exercise trends.</Text>
          )}
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>RECOVERY</Text>
        <AnalyticsCard title="Recovery & fatigue" subtitle="Historical training signals, not medical diagnosis">
          <View style={styles.trendHeader}>
            <Text style={styles.largeValue}>{formatRating(dashboard.recovery.averageWorkoutRating)}</Text>
            <Text style={[styles.trendText, { color: recoveryTrend.color }]}>
              {recoveryTrend.label}
            </Text>
          </View>
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Pain reports" value={`${dashboard.recovery.painOccurrences}`} />
            <AnalyticsMetric label="Low energy" value={`${dashboard.recovery.lowEnergyOccurrences}`} />
            <AnalyticsMetric label="Form breakdown" value={`${dashboard.recovery.formBreakdownOccurrences}`} />
            <AnalyticsMetric label="Deload workouts" value={`${dashboard.recovery.deloadWorkoutCount}`} />
          </View>
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>TRAINING LOAD</Text>
        <AnalyticsCard title="Work completed" subtitle="Volume accumulated in the selected period">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Working sets" value={`${dashboard.trainingLoad.workingSetsCompleted}`} accent />
            <AnalyticsMetric label="Total reps" value={`${Math.round(dashboard.trainingLoad.totalRepsCompleted)}`} />
            <AnalyticsMetric label="Hold time" value={`${Math.round(dashboard.trainingLoad.totalHoldSeconds)}s`} />
            <AnalyticsMetric
              label="Time under tension"
              value={`${Math.round(dashboard.trainingLoad.totalTimeUnderTensionSeconds / 60)}m`}
            />
          </View>
        </AnalyticsCard>

        <AnalyticsCard title="Coach insight" subtitle="Data → interpretation → action">
          <View style={styles.coachRow}>
            <MaterialIcons name="psychology" size={28} color={appTokens.colors.primary} />
            <Text style={styles.coachText}>
              {buildCoachInsight({
                mbTrend,
                recoveryTrend,
                adherenceRate: dashboard.overview.adherenceRate,
                readiness: dashboard.overview.readiness.current,
              })}
            </Text>
          </View>
        </AnalyticsCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTokens.colors.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    color: appTokens.colors.muted,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  eyebrow: {
    color: appTokens.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: appTokens.colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: appTokens.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  sectionLabel: {
    color: appTokens.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 8,
  },
  currentJourney: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3A3A3A",
  },
  journeyMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: appTokens.colors.primary,
    marginRight: 10,
  },
  journeyCurrent: {
    color: appTokens.colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  journeyProgram: {
    color: appTokens.colors.text,
    fontSize: 14,
    marginTop: 2,
  },
  weekBadge: {
    color: "#111",
    backgroundColor: appTokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontWeight: "900",
  },
  timeline: {
    marginTop: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717",
  },
  timelineTitle: {
    color: appTokens.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  timelineMeta: {
    color: appTokens.colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: appTokens.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 10,
  },
  largeValue: {
    color: appTokens.colors.primary,
    fontSize: 32,
    fontWeight: "900",
  },
  trendText: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  miniStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 8,
  },
  miniStat: {
    color: appTokens.colors.muted,
    fontSize: 11,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3A3A3A",
  },
  exerciseName: {
    color: appTokens.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: appTokens.colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  exerciseBest: {
    color: appTokens.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  exerciseUnit: {
    color: appTokens.colors.muted,
    fontSize: 10,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 12,
  },
  coachText: {
    flex: 1,
    color: appTokens.colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});

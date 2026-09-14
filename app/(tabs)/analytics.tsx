import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
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
import { AnalyticsScenarioPanel } from "@/components/analytics/AnalyticsScenarioPanel";
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { programs } from "@/data/programs";
import { AnalyticsTimeRange } from "@/models/analytics/AnalyticsTimeRange";
import { ProgramLifecycleEvent } from "@/models/analytics/ProgramLifecycleEvent";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProgress } from "@/hooks/useProgress";
import { appTokens } from "@/styles/appStyles";
import { formatAnalyticsDuration } from "@/utils/analyticsFormatting";

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

function formatLifecycleDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalyticsScreen() {
  const [range, setRange] = useState<AnalyticsTimeRange>("12w");
  const [refreshing, setRefreshing] = useState(false);
  const { program, week, refreshProgressState } = useProgress();
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

        {__DEV__ ? (
          <AnalyticsScenarioPanel
            onSeeded={async () => {
              await refreshProgressState();
              await refresh();
            }}
          />
        ) : null}

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
            <Text style={styles.miniStat}>Excluded {dashboard.matchOrBeat.excluded}</Text>
          </View>
          <Text style={styles.exclusionNote}>
            Excluded performances stay in workout history but are not counted against Match-or-Beat progression.
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/screens/matchOrBeatAnalytics",
                params: { range },
              })
            }
            style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
          >
            <Text style={styles.detailsButtonText}>View Match-or-Beat details</Text>
            <MaterialIcons name="chevron-right" size={20} color={appTokens.colors.primary} />
          </Pressable>
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>EXERCISE PROGRESS</Text>
        <AnalyticsCard title="Most trained exercises" subtitle="Best performance and current trend">
          {topExercises.length ? (
            topExercises.map((exercise, index) => {
              const trend = formatTrend(exercise.trend);
              const name = exerciseRegistry[exercise.exerciseId]?.name ?? exercise.exerciseId;
              return (
                <Pressable
                  key={exercise.exerciseId}
                  onPress={() =>
                    router.push({
                      pathname: "/screens/exerciseAnalytics",
                      params: { exerciseId: exercise.exerciseId, range },
                    })
                  }
                  style={({ pressed }) => [
                    styles.exerciseRow,
                    index < topExercises.length - 1 && styles.rowDivider,
                    pressed && styles.exerciseRowPressed,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.sessionsPerformed} sessions
                    </Text>
                    <Text style={[styles.exerciseTrend, { color: trend.color }]}>
                      {trend.label}
                    </Text>
                  </View>
                  <View style={styles.exerciseRight}>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.exerciseBest}>
                        {exercise.bestPerformance == null ? "—" : Math.round(exercise.bestPerformance)}
                      </Text>
                      <Text style={styles.exerciseUnit}>
                        {exercise.unit === "seconds" ? "sec best" : "reps best"}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={appTokens.colors.muted} />
                  </View>
                </Pressable>
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
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/screens/recoveryAnalytics",
                params: { range },
              })
            }
            style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
          >
            <Text style={styles.detailsButtonText}>View recovery & fatigue details</Text>
            <MaterialIcons name="chevron-right" size={20} color={appTokens.colors.primary} />
          </Pressable>
        </AnalyticsCard>

        <Text style={styles.sectionLabel}>TRAINING LOAD</Text>
        <AnalyticsCard title="Work completed" subtitle="Volume accumulated in the selected period">
          <View style={styles.metricsGrid}>
            <AnalyticsMetric label="Working sets" value={`${dashboard.trainingLoad.workingSetsCompleted}`} accent />
            <AnalyticsMetric label="Total reps" value={`${Math.round(dashboard.trainingLoad.totalRepsCompleted)}`} />
            <AnalyticsMetric label="Hold time" value={formatAnalyticsDuration(dashboard.trainingLoad.totalHoldSeconds)} />
            <AnalyticsMetric
              label="Time under tension"
              value={formatAnalyticsDuration(dashboard.trainingLoad.totalTimeUnderTensionSeconds)}
            />
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/screens/trainingLoadAnalytics",
                params: { range },
              })
            }
            style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
          >
            <Text style={styles.detailsButtonText}>View training load & body-part details</Text>
            <MaterialIcons name="chevron-right" size={20} color={appTokens.colors.primary} />
          </Pressable>
        </AnalyticsCard>

        <AnalyticsCard title="Coach interpretation" subtitle="Data → interpretation → action">
          <View style={styles.coachRow}>
            <MaterialIcons name="psychology" size={28} color={appTokens.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.coachHeadline}>{dashboard.coach.headline}</Text>
              <Text style={styles.coachText}>{dashboard.coach.summary}</Text>
              <Text style={styles.coachActionLabel}>NEXT ACTION</Text>
              <Text style={styles.coachAction}>{dashboard.coach.action}</Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/screens/coachAnalytics",
                params: { range },
              })
            }
            style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
          >
            <Text style={styles.detailsButtonText}>View Coach analysis</Text>
            <MaterialIcons name="chevron-right" size={20} color={appTokens.colors.primary} />
          </Pressable>
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 8,
  },
  miniStat: {
    color: appTokens.colors.muted,
    fontSize: 11,
    minWidth: "44%",
  },
  exclusionNote: {
    color: appTokens.colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
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
  exerciseRowPressed: {
    opacity: 0.7,
  },
  exerciseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  exerciseTrend: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
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
  coachHeadline: {
    color: appTokens.colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  coachActionLabel: {
    color: appTokens.colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 10,
  },
  coachAction: {
    color: appTokens.colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
    fontWeight: "600",
  },
  coachText: {
    flex: 1,
    color: appTokens.colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#3A3A3A",
  },
  detailsButtonPressed: {
    opacity: 0.65,
  },
  detailsButtonText: {
    color: appTokens.colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});

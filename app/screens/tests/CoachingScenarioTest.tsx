import React from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  CoachingScenario,
  DirectCoachingScenario,
  coachingScenarios,
  directCoachingScenarios,
} from "@/tests/coachingScenarios";
import {
  TrainingScheduleScenario,
  trainingScheduleScenarios,
} from "@/tests/trainingScheduleScenarios";
import {
  ImmediatePainScenario,
  immediatePainScenarios,
} from "@/tests/immediatePainScenarios";

import {
  CoachingSeedResult,
  resetCoachingTestData,
  seedCoachingScenario,
  seedDirectCoachingScenario,
} from "@/utils/testing/CoachingScenarioSeeder";
import {
  TrainingScheduleSeedResult,
  seedTrainingScheduleScenario,
} from "@/utils/testing/TrainingScheduleScenarioSeeder";
import { runImmediatePainScenario } from "@/utils/testing/ImmediatePainScenarioRunner";
import {
  FeedbackCompatibilityScenario,
  FeedbackRatingAvailabilityScenario,
  FeedbackValidationScenario,
  feedbackCompatibilityScenarios,
  feedbackRatingAvailabilityScenarios,
  feedbackValidationScenarios,
} from "@/tests/feedbackRatingScenarios";
import {
  runFeedbackCompatibilityScenario,
  runFeedbackRatingAvailabilityScenario,
  runFeedbackValidationScenario,
} from "@/utils/testing/FeedbackRatingScenarioRunner";
import { useProgress } from "@/hooks/useProgress";
import { useTrainingScheduleSettings } from "@/hooks/useTrainingScheduleSettings";
import { runAdaptiveVolumeDirectScenarios } from "@/tests/adaptiveVolumeScenarios";
import {
  AdaptiveVolumeLiveScenarioKind,
  AdaptiveVolumeLiveSeedResult,
  seedAdaptiveVolumeWeek3Scenario,
} from "@/utils/testing/AdaptiveVolumeScenarioSeeder";
import {
  Week2StartLevel,
  Week2StartSeedResult,
  seedWeek2StartScenario,
} from "@/utils/testing/Week2StartScenarioSeeder";
import {
  AdaptiveRestV2Level,
  AdaptiveRestV2Profile,
  AdaptiveRestV2SeedResult,
  seedAdaptiveRestV2Scenario,
} from "@/utils/testing/AdaptiveRestV2ScenarioSeeder";

export default function CoachingScenarioTest() {
  const [runningScenario, setRunningScenario] = React.useState<string | null>(
    null,
  );

  const {
    program,
    programIndex,
    week,
    day,
    pendingGraduation,
    activeDeload,
    acceptGraduation,
    trainAnotherWeek,
    refreshProgressState,
  } = useProgress();

  const { restoreTrainingScheduleDefaults } = useTrainingScheduleSettings();

  React.useEffect(() => {
    console.log("🧪 PROGRESS TRANSITION STATE", {
      programIndex,
      activeProgramId: program.id,
      week,
      day,
      pendingGraduation,
      activeDeload,
    });
  }, [programIndex, program.id, week, day, pendingGraduation, activeDeload]);

  const [lastSeedResult, setLastSeedResult] =
    React.useState<CoachingSeedResult | null>(null);

  const [lastScheduleSeedResult, setLastScheduleSeedResult] =
    React.useState<TrainingScheduleSeedResult | null>(null);

  const [lastAdaptiveLiveSeedResult, setLastAdaptiveLiveSeedResult] =
    React.useState<AdaptiveVolumeLiveSeedResult | null>(null);

  const [lastWeek2StartSeedResult, setLastWeek2StartSeedResult] =
    React.useState<Week2StartSeedResult | null>(null);

  const [lastAdaptiveRestV2SeedResult, setLastAdaptiveRestV2SeedResult] =
    React.useState<AdaptiveRestV2SeedResult | null>(null);

  // -----------------------------------
  // SEED — READINESS
  // -----------------------------------

  const handleSeedScenario = async (scenario: CoachingScenario) => {
    try {
      setRunningScenario(scenario.id);
      setLastScheduleSeedResult(null);

      const result = await seedCoachingScenario(scenario, "level1");

      setLastSeedResult(result);

      Alert.alert(
        "Scenario ready",
        [
          scenario.title,
          "",
          `Seeded ${result.seededWorkoutCount} workouts.`,
          "",
          `Next workout: Week ${result.targetWeek}, Day ${result.targetDay}`,
          "",
          `Performance: ${getPerformanceInstruction(scenario)}`,
          "",
          `Feedback: ${getFeedbackInstruction(scenario)}`,
          "",
          `Expected: ${scenario.expected.recommendation.toUpperCase()}`,
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Failed to seed coaching scenario", error);

      Alert.alert(
        "Seed failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // SEED — DIRECT DELOAD
  // -----------------------------------

  const handleSeedDirectScenario = async (scenario: DirectCoachingScenario) => {
    try {
      setRunningScenario(scenario.id);
      setLastScheduleSeedResult(null);

      const result = await seedDirectCoachingScenario(scenario, "level1");

      await refreshProgressState();

      setLastSeedResult(result);

      if (scenario.phase === "verification") {
        router.push({
          pathname: "/screens/graduationCoach",
          params: {
            verificationIntro: "true",
          },
        });

        return;
      }

      Alert.alert(
        "Direct test ready",
        [
          scenario.title,
          "",
          `Seeded ${result.seededWorkoutCount} workouts.`,
          "",
          `Open: Week ${result.targetWeek}, Day ${result.targetDay}`,
          "",
          "The deload state and required history have already been created.",
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Failed to seed direct coaching scenario", error);

      Alert.alert(
        "Direct seed failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // RUN — IMMEDIATE PAIN
  // -----------------------------------

  const handleRunImmediatePainScenario = (scenario: ImmediatePainScenario) => {
    try {
      setRunningScenario(scenario.id);

      const result = runImmediatePainScenario(scenario);

      Alert.alert(
        "Immediate pain test passed",
        [
          scenario.title,
          "",
          `Expected: ${result.expectedStatus}`,
          `Actual: ${result.actualStatus}`,
          "",
          `Recovery required: ${result.actualRecoveryRequired ? "YES" : "NO"}`,
          `Continue program: ${result.actualCanContinueProgram ? "YES" : "NO"}`,
          "",
          "Direct engine assertion passed.",
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Immediate pain scenario failed", error);

      Alert.alert(
        "Immediate pain test failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // SEED — TRAINING SCHEDULE
  // -----------------------------------

  const handleSeedTrainingScheduleScenario = async (
    scenario: TrainingScheduleScenario,
  ) => {
    try {
      setRunningScenario(scenario.id);
      setLastSeedResult(null);

      /**
       * Phase 5.7 direct scheduling assertions are defined against the product
       * defaults: normal guidance ON and pain minimum rest = 2 days.
       *
       * Resetting only scheduling preferences here keeps the test deterministic
       * if Settings was previously changed during Phase 5.6 testing.
       */
      restoreTrainingScheduleDefaults();

      const result = await seedTrainingScheduleScenario(scenario, "level1");

      setLastScheduleSeedResult(result);

      Alert.alert(
        "Scheduling test ready",
        [
          scenario.title,
          "",
          `Open: Week ${result.targetWeek}, Day ${result.targetDay}`,
          "",
          `Expected status: ${result.expectedStatus}`,
          `Expected canTrain: ${result.expectedCanTrain ? "YES" : "NO"}`,
          "",
          `Engine status: ${result.actualStatus}`,
          `Engine canTrain: ${result.actualCanTrain ? "YES" : "NO"}`,
          `Rest days: ${result.restDaysCompleted}/${
            result.minimumRestDaysRequired ?? "-"
          }`,
          ...(result.expectedConsecutiveTrainingSessions != null
            ? [
                `Consecutive sessions: ${result.actualConsecutiveTrainingSessions}/${result.expectedConsecutiveTrainingSessions}`,
              ]
            : []),
          ...(result.expectedSessionsToday != null
            ? [
                `Sessions today: ${result.actualSessionsToday}/${result.expectedSessionsToday}`,
              ]
            : []),
          ...(result.nextEligibleDate
            ? ["", `Next eligible: ${result.nextEligibleDate}`]
            : []),
          "",
          "The engine assertion passed. Go Home to verify the real card lock/availability.",
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Failed to seed scheduling scenario", error);

      Alert.alert(
        "Scheduling seed failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // RUN — FEEDBACK RATING AVAILABILITY
  // -----------------------------------

  const handleRunFeedbackRatingScenario = (
    scenario: FeedbackRatingAvailabilityScenario,
  ) => {
    try {
      setRunningScenario(scenario.id);

      const result = runFeedbackRatingAvailabilityScenario(scenario);

      Alert.alert(
        "Feedback rating test passed",
        [
          scenario.title,
          "",
          `Expected: ${result.expectedAllowedRatings.join(", ")}`,
          `Actual: ${result.actualAllowedRatings.join(", ")}`,
          `Mode: ${result.mode}`,
          "",
          "Direct engine assertion passed.",
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Feedback rating scenario failed", error);

      Alert.alert(
        "Feedback rating test failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // RUN — FEEDBACK VALIDATION
  // -----------------------------------

  const handleRunFeedbackValidationScenario = (
    scenario: FeedbackValidationScenario,
  ) => {
    try {
      setRunningScenario(scenario.id);

      const result = runFeedbackValidationScenario(scenario);

      Alert.alert(
        "Feedback validation test passed",
        [
          scenario.title,
          "",
          `Expected complete: ${result.expectedComplete ? "YES" : "NO"}`,
          `Actual complete: ${result.actualComplete ? "YES" : "NO"}`,
          "",
          "This is the same completeness helper used by Workout Summary.",
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Feedback validation scenario failed", error);

      Alert.alert(
        "Feedback validation test failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // RUN — FEEDBACK ID COMPATIBILITY
  // -----------------------------------

  const handleRunFeedbackCompatibilityScenario = (
    scenario: FeedbackCompatibilityScenario,
  ) => {
    try {
      setRunningScenario(scenario.id);

      const result = runFeedbackCompatibilityScenario(scenario);

      Alert.alert(
        "Feedback compatibility test passed",
        [
          scenario.title,
          "",
          `Pain: ${result.pain ? "YES" : "NO"}`,
          `Fatigue: ${result.fatigue ? "YES" : "NO"}`,
          `Form breakdown: ${result.formBreakdown ? "YES" : "NO"}`,
          "",
          "Stable/legacy feedback interpretation passed.",
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Feedback compatibility scenario failed", error);

      Alert.alert(
        "Feedback compatibility test failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // RUN — ADAPTIVE VOLUME
  // -----------------------------------

  const handleRunAdaptiveVolumeScenarios = () => {
    try {
      setRunningScenario("adaptive-volume-direct");

      const passed = runAdaptiveVolumeDirectScenarios();

      Alert.alert(
        "Adaptive Volume tests passed",
        [
          `Passed ${passed.length} direct assertions.`,
          "",
          ...passed.map((message) => `✓ ${message}`),
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Adaptive Volume direct tests failed", error);

      Alert.alert(
        "Adaptive Volume test failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // SEED — ADAPTIVE VOLUME LIVE WEEK 3
  // -----------------------------------

  const handleSeedAdaptiveVolumeLiveScenario = async (
    kind: AdaptiveVolumeLiveScenarioKind,
  ) => {
    const scenarioId = `adaptive-volume-week3-${kind}`;

    try {
      setRunningScenario(scenarioId);
      setLastSeedResult(null);
      setLastScheduleSeedResult(null);

      const result = await seedAdaptiveVolumeWeek3Scenario(kind, "level1");

      await refreshProgressState();
      setLastAdaptiveLiveSeedResult(result);

      Alert.alert(
        "Adaptive Volume live test ready",
        [
          `Seeded ${result.seededWorkoutCount} healthy workouts.`,
          "",
          `Open: Week ${result.targetWeek}, Day ${result.targetDay}`,
          "",
          ...result.instructions,
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Failed to seed Adaptive Volume live scenario", error);

      Alert.alert(
        "Adaptive Volume seed failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // SEED — QUICK WEEK-2 START
  // -----------------------------------

  const handleSeedWeek2StartScenario = async (level: Week2StartLevel) => {
    const scenarioId = `level-${level}-week2-start`;

    try {
      setRunningScenario(scenarioId);
      setLastSeedResult(null);
      setLastScheduleSeedResult(null);
      setLastAdaptiveLiveSeedResult(null);

      const result = await seedWeek2StartScenario(level);

      await refreshProgressState();
      setLastWeek2StartSeedResult(result);

      Alert.alert(
        "Week 2 test state ready",
        [
          `${result.programName} (Level ${level})`,
          "",
          `Seeded ${result.seededWorkoutCount} Week-1 workouts.`,
          "",
          `Open: Week ${result.targetWeek}, Day ${result.targetDay}`,
          "",
          ...result.instructions,
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Failed to seed Week-2 start scenario", error);

      Alert.alert(
        "Week-2 seed failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // SEED — ADAPTIVE REST V2 PERSONALIZED
  // -----------------------------------

  const handleSeedAdaptiveRestV2Scenario = async (
    level: AdaptiveRestV2Level,
    profile: AdaptiveRestV2Profile,
  ) => {
    const scenarioId = `adaptive-rest-v2-level-${level}-${profile}`;

    try {
      setRunningScenario(scenarioId);
      setLastSeedResult(null);
      setLastScheduleSeedResult(null);
      setLastAdaptiveLiveSeedResult(null);
      setLastWeek2StartSeedResult(null);

      const result = await seedAdaptiveRestV2Scenario(level, profile);

      await refreshProgressState();
      setLastAdaptiveRestV2SeedResult(result);

      Alert.alert(
        "Adaptive Rest V2 ready",
        [
          `${result.programName} (Level ${level})`,
          "",
          `Profile: ${
            profile === "stable"
              ? "Stable (~10% normal drop)"
              : "Fatigue-Tolerant (~20-25% normal drop)"
          }`,
          "",
          `Seeded ${result.seededWorkoutCount} workouts across Weeks 1-3.`,
          `Comparable history available: ${result.comparableHistoryCount}`,
          "",
          `Open: Week ${result.targetWeek}, Day ${result.targetDay}`,
          "",
          ...result.instructions,
        ].join("\n"),
      );
    } catch (error) {
      console.error("❌ Failed to seed Adaptive Rest V2 scenario", error);

      Alert.alert(
        "Adaptive Rest V2 seed failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRunningScenario(null);
    }
  };

  // -----------------------------------
  // RESET
  // -----------------------------------

  const handleReset = async () => {
    try {
      await resetCoachingTestData();

      setLastSeedResult(null);
      setLastScheduleSeedResult(null);
      setLastAdaptiveLiveSeedResult(null);
      setLastWeek2StartSeedResult(null);
      setLastAdaptiveRestV2SeedResult(null);

      Alert.alert(
        "Reset complete",
        "Workout history, program evaluations and progress were cleared.",
      );
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#111",
      }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 60,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 26,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        Coaching Scenario Tests
      </Text>

      <Text
        style={{
          color: "#aaa",
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 20,
        }}
      >
        Standard scenarios test readiness from Week 4 Day 4. Direct scenarios
        jump straight into deload, verification, scheduling, or immediate-pain
        decisions for faster regression testing.
      </Text>

      {lastScheduleSeedResult && (
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Scheduling Scenario Ready
          </Text>

          <Text style={{ color: "#fff", marginBottom: 4 }}>
            {lastScheduleSeedResult.scenarioId}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 4 }}>
            Week {lastScheduleSeedResult.targetWeek}
            {" • "}
            Day {lastScheduleSeedResult.targetDay}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 4 }}>
            Status: {lastScheduleSeedResult.actualStatus}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 4 }}>
            Can train: {lastScheduleSeedResult.actualCanTrain ? "YES" : "NO"}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 4 }}>
            Rest days: {lastScheduleSeedResult.restDaysCompleted}/
            {lastScheduleSeedResult.minimumRestDaysRequired ?? "-"}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 4 }}>
            Consecutive sessions:{" "}
            {lastScheduleSeedResult.actualConsecutiveTrainingSessions}
          </Text>

          <Text style={{ color: "#bbb" }}>
            Sessions today: {lastScheduleSeedResult.actualSessionsToday}
          </Text>

          {lastScheduleSeedResult.nextEligibleDate && (
            <Text style={{ color: "#bbb", marginTop: 4 }}>
              Next eligible: {lastScheduleSeedResult.nextEligibleDate}
            </Text>
          )}

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {lastSeedResult && (
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Scenario Ready
          </Text>

          <Text style={{ color: "#fff", marginBottom: 4 }}>
            {lastSeedResult.scenarioId}
          </Text>

          <Text style={{ color: "#bbb" }}>
            Week {lastSeedResult.targetWeek}
            {" • "}
            Day {lastSeedResult.targetDay}
          </Text>

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>
              Go to Workout
            </Text>
          </TouchableOpacity>

          {/* TEMPORARY DIRECT-ROUTE TEST */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screens/preWorkoutOverView",
                params: {
                  dayIndex: "0",
                  includeWarmup: "true",
                  includeStretch: "true",
                },
              })
            }
            style={{
              backgroundColor: "#444",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Test Completed Day Route
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!pendingGraduation}
            onPress={() => {
              const result = acceptGraduation();

              console.log("🧪 ACCEPT GRADUATION TEST", {
                result,
                programIndex,
                activeProgramId: program.id,
                week,
                day,
                pendingGraduation,
              });
            }}
            style={{
              backgroundColor: "#444",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 12,
              alignItems: "center",
              opacity: pendingGraduation ? 1 : 0.5,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Test Accept Graduation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!pendingGraduation}
            onPress={() => {
              const result = trainAnotherWeek();

              console.log("🧪 TRAIN ANOTHER WEEK TEST", {
                result,
                programIndex,
                activeProgramId: program.id,
                week,
                day,
                pendingGraduation,
              });
            }}
            style={{
              backgroundColor: "#444",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 12,
              alignItems: "center",
              opacity: pendingGraduation ? 1 : 0.5,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Test Train Another Week
            </Text>
          </TouchableOpacity>
          {/* END OF TEMPORARY DIRECT-ROUTE TEST */}
        </View>
      )}

      {lastAdaptiveRestV2SeedResult && (
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Adaptive Rest V2 Scenario Ready
          </Text>

          <Text style={{ color: "#fff", marginBottom: 4 }}>
            Level {lastAdaptiveRestV2SeedResult.level}
            {" • "}
            {lastAdaptiveRestV2SeedResult.profile === "stable"
              ? "Stable baseline"
              : "Fatigue-Tolerant baseline"}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 10 }}>
            Week {lastAdaptiveRestV2SeedResult.targetWeek}
            {" • "}
            Day {lastAdaptiveRestV2SeedResult.targetDay}
            {" • "}
            {lastAdaptiveRestV2SeedResult.comparableHistoryCount} comparable histories
          </Text>

          {lastAdaptiveRestV2SeedResult.instructions.map(
            (instruction, index) => (
              <Text
                key={`${lastAdaptiveRestV2SeedResult.scenarioId}-${index}`}
                style={{ color: "#aaa", lineHeight: 19, marginBottom: 4 }}
              >
                {index + 1}. {instruction}
              </Text>
            ),
          )}

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>
              Go to Week 4 Day 1
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Adaptive Rest V2 — Personalized
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        These scenarios populate Weeks 1-3 with three healthy comparable
        histories and position the selected level at Week 4 Day 1. Use Stable
        to test an athlete who normally preserves set performance well; use
        Fatigue-Tolerant to prove that the same larger drop can be normal for
        a different athlete.
      </Text>

      {([1, 2, 3] as AdaptiveRestV2Level[]).map((level) => (
        <View
          key={`adaptive-rest-v2-level-${level}`}
          style={{
            backgroundColor: "#1c1c1c",
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Level {level} — V2 Ready
          </Text>

          <Text style={{ color: "#aaa", lineHeight: 19, marginBottom: 12 }}>
            Seeds Weeks 1-3 and opens Week 4 Day 1 with exactly three
            comparable normal-workout histories.
          </Text>

          {(["stable", "fatigue-tolerant"] as AdaptiveRestV2Profile[]).map(
            (profile) => {
              const id = `adaptive-rest-v2-level-${level}-${profile}`;
              const running = runningScenario === id;

              return (
                <TouchableOpacity
                  key={id}
                  disabled={runningScenario !== null}
                  onPress={() =>
                    handleSeedAdaptiveRestV2Scenario(level, profile)
                  }
                  style={{
                    backgroundColor: running ? "#555" : "#333",
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  {running ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {profile === "stable"
                        ? "Seed Stable (~10%)"
                        : "Seed Fatigue-Tolerant (~20-25%)"}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            },
          )}
        </View>
      ))}

      {lastWeek2StartSeedResult && (
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Quick Week 2 Scenario Ready
          </Text>

          <Text style={{ color: "#fff", marginBottom: 4 }}>
            {lastWeek2StartSeedResult.programName}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 10 }}>
            Week {lastWeek2StartSeedResult.targetWeek}
            {" • "}
            Day {lastWeek2StartSeedResult.targetDay}
          </Text>

          {lastWeek2StartSeedResult.instructions.map((instruction, index) => (
            <Text
              key={`${lastWeek2StartSeedResult.scenarioId}-${index}`}
              style={{ color: "#aaa", lineHeight: 19, marginBottom: 4 }}
            >
              {index + 1}. {instruction}
            </Text>
          ))}

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>
              Go to Week 2 Day 1
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Quick Week 2 Test States
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        Completes Week 1 automatically and positions the selected level at
        Week 2 Day 1. Current Settings are preserved, so these shortcuts are
        useful for live Adaptive Rest testing.
      </Text>

      {([1, 2, 3] as Week2StartLevel[]).map((level) => {
        const id = `level-${level}-week2-start`;
        const running = runningScenario === id;

        return (
          <View
            key={id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              Level {level} — Start Week 2
            </Text>

            <Text style={{ color: "#aaa", lineHeight: 19, marginBottom: 12 }}>
              Seeds every required Level {level} Week-1 workout with healthy
              completed performance and opens Week 2 Day 1.
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleSeedWeek2StartScenario(level)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Seed Level {level} Week 1
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      {lastAdaptiveLiveSeedResult && (
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Adaptive Volume Live Scenario Ready
          </Text>

          <Text style={{ color: "#fff", marginBottom: 4 }}>
            {lastAdaptiveLiveSeedResult.scenarioId}
          </Text>

          <Text style={{ color: "#bbb", marginBottom: 10 }}>
            Week {lastAdaptiveLiveSeedResult.targetWeek}
            {" • "}
            Day {lastAdaptiveLiveSeedResult.targetDay}
          </Text>

          {lastAdaptiveLiveSeedResult.instructions.map((instruction, index) => (
            <Text
              key={`${lastAdaptiveLiveSeedResult.scenarioId}-${index}`}
              style={{ color: "#aaa", lineHeight: 19, marginBottom: 4 }}
            >
              {index + 1}. {instruction}
            </Text>
          ))}

          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>
              Go to Week 3 Day 1
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Adaptive Volume Live Tests
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        Seeds healthy Level 1 Weeks 1–2 and positions the app at Week 3 Day 1.
        Complete the next two workouts live to test the real Coach flow.
      </Text>

      {(["rating-4", "rating-5"] as AdaptiveVolumeLiveScenarioKind[]).map(
        (kind) => {
          const id = `adaptive-volume-week3-${kind}`;
          const running = runningScenario === id;
          const isRating5 = kind === "rating-5";

          return (
            <View
              key={id}
              style={{
                backgroundColor: "#1c1c1c",
                borderRadius: 16,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {isRating5
                  ? "Seed Week 3 – Rating 5 Test"
                  : "Seed Week 3 – Rating 4 Test"}
              </Text>

              <Text style={{ color: "#aaa", lineHeight: 19, marginBottom: 12 }}>
                {isRating5
                  ? "Use Rating 5 on the first live qualifying day to test optional-exercise activation, then reach the weekly threshold on Day 2."
                  : "Use Rating 4 on both live Day 1 and Day 2 workouts to test the normal two-rating weekly threshold."}
              </Text>

              <TouchableOpacity
                disabled={runningScenario !== null}
                onPress={() => handleSeedAdaptiveVolumeLiveScenario(kind)}
                style={{
                  backgroundColor: running ? "#555" : "#333",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                {running ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Seed Week 3 State
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        },
      )}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Direct Adaptive Volume Tests
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        Runs the pure Phase A adaptive-volume assertions. This does not seed
        workout history or change your real program progress.
      </Text>

      <View
        style={{
          backgroundColor: "#1c1c1c",
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 6,
          }}
        >
          Adaptive Volume Phase A
        </Text>

        <Text
          style={{
            color: "#aaa",
            lineHeight: 19,
            marginBottom: 12,
          }}
        >
          Tests candidate selection, weekly qualification, accumulated and
          late-week adaptations, Rating-5 optional activation, duplicate
          protection, excluded training modes, and Adaptive Volume OFF.
        </Text>

        <TouchableOpacity
          disabled={runningScenario !== null}
          onPress={handleRunAdaptiveVolumeScenarios}
          style={{
            backgroundColor:
              runningScenario === "adaptive-volume-direct" ? "#555" : "#333",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          {runningScenario === "adaptive-volume-direct" ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Run Adaptive Volume Assertions
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Direct Feedback Rating Tests
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        These assertions test Week/MB/main-completion rating availability
        directly, including exact threshold boundaries and weaker-signal
        control.
      </Text>

      {feedbackRatingAvailabilityScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text
              style={{
                color: "#aaa",
                lineHeight: 19,
                marginBottom: 8,
              }}
            >
              {scenario.description}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Week: {scenario.weekIndex + 1}
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              MB: {(scenario.mbSuccessRate * 100).toFixed(1)}%
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Main: {(scenario.mainCompletion * 100).toFixed(1)}%
            </Text>
            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Expected ratings: {scenario.expectedAllowedRatings.join(", ")}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleRunFeedbackRatingScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Run Direct Assertion
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginTop: 8,
          marginBottom: 10,
        }}
      >
        Direct Feedback Validation Tests
      </Text>

      {feedbackValidationScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Rating: {scenario.rating ?? "none"}
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Reasons: {scenario.tags.length}
            </Text>
            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Complete Workout should be:{" "}
              {scenario.expectedComplete ? "ENABLED" : "DISABLED"}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleRunFeedbackValidationScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Run Direct Assertion
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginTop: 8,
          marginBottom: 10,
        }}
      >
        Direct Feedback Compatibility Tests
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        These assertions prove that new stable IDs and legacy persisted display
        strings produce the same pain, fatigue, and form-breakdown signals.
      </Text>

      {feedbackCompatibilityScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text style={{ color: "#aaa", marginBottom: 10 }}>
              Stored tag: {scenario.tags.join(", ")}
            </Text>

            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Expected: pain {scenario.expected.pain ? "YES" : "NO"} • fatigue{" "}
              {scenario.expected.fatigue ? "YES" : "NO"} • form{" "}
              {scenario.expected.formBreakdown ? "YES" : "NO"}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleRunFeedbackCompatibilityScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Run Direct Assertion
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Direct Immediate Pain Tests
      </Text>

      {immediatePainScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text
              style={{
                color: "#aaa",
                lineHeight: 19,
                marginBottom: 10,
              }}
            >
              {scenario.description}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Pain still present:{" "}
              {scenario.answers.painStillPresent ? "YES" : "NO"}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Affected good form:{" "}
              {scenario.answers.affectedGoodForm ? "YES" : "NO"}
            </Text>

            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Expected: {scenario.expected.status}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleRunImmediatePainScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Run Direct Assertion
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginTop: 8,
          marginBottom: 10,
        }}
      >
        Direct Scheduling Tests
      </Text>

      <Text
        style={{
          color: "#888",
          fontSize: 13,
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        Scheduling tests automatically restore scheduling defaults first so the
        direct expectations remain deterministic: guidance ON and pain minimum
        rest = 2 days.
      </Text>

      {trainingScheduleScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text
              style={{
                color: "#aaa",
                lineHeight: 19,
                marginBottom: 10,
              }}
            >
              {scenario.description}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Expected status: {scenario.expected.status}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Can train: {scenario.expected.canTrain ? "YES" : "NO"}
            </Text>

            <Text style={{ color: "#FFD700", marginBottom: 4 }}>
              Rest days: {scenario.expected.restDaysCompleted}/
              {scenario.expected.minimumRestDaysRequired ?? "-"}
            </Text>

            {scenario.expected.consecutiveTrainingSessions != null && (
              <Text style={{ color: "#FFD700", marginBottom: 4 }}>
                Consecutive sessions:{" "}
                {scenario.expected.consecutiveTrainingSessions}
              </Text>
            )}

            {scenario.expected.sessionsToday != null && (
              <Text style={{ color: "#FFD700", marginBottom: 12 }}>
                Sessions today: {scenario.expected.sessionsToday}
              </Text>
            )}

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleSeedTrainingScheduleScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Seed Scheduling State
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginTop: 8,
          marginBottom: 10,
        }}
      >
        Direct Deload Tests
      </Text>

      {directCoachingScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text
              style={{
                color: "#aaa",
                lineHeight: 19,
                marginBottom: 12,
              }}
            >
              {scenario.description}
            </Text>

            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Opens Week {scenario.targetWeek} Day {scenario.targetDay}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleSeedDirectScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Seed Direct State
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: "700",
          marginTop: 8,
          marginBottom: 10,
        }}
      >
        Readiness Scenarios
      </Text>

      {coachingScenarios.map((scenario) => {
        const running = runningScenario === scenario.id;

        return (
          <View
            key={scenario.id}
            style={{
              backgroundColor: "#1c1c1c",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              {scenario.title}
            </Text>

            <Text
              style={{
                color: "#aaa",
                lineHeight: 19,
                marginBottom: 12,
              }}
            >
              {scenario.description}
            </Text>

            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Final workout:
            </Text>

            <Text style={{ color: "#aaa", marginBottom: 4 }}>
              {getPerformanceInstruction(scenario)}
            </Text>

            <Text style={{ color: "#aaa", marginBottom: 10 }}>
              {getFeedbackInstruction(scenario)}
            </Text>

            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Expected: {scenario.expected.recommendation.toUpperCase()}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleSeedScenario(scenario)}
              style={{
                backgroundColor: running ? "#555" : "#333",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              {running ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Seed Scenario
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity
        disabled={runningScenario !== null}
        onPress={handleReset}
        style={{
          borderWidth: 1,
          borderColor: "#666",
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text style={{ color: "#ddd", fontWeight: "600" }}>
          Clear Test Data
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getPerformanceInstruction(scenario: CoachingScenario): string {
  if (scenario.finalPerformance === "meetOrBeat") {
    return "Meet or beat the displayed MB targets.";
  }

  return "Fail most of the displayed MB targets.";
}

function getFeedbackInstruction(scenario: CoachingScenario): string {
  const { rating, tags } = scenario.finalFeedback;

  if (!tags.length) {
    return `Select rating ${rating} with no safety tags.`;
  }

  return `Select rating ${rating} and tag: ${tags.join(", ")}`;
}

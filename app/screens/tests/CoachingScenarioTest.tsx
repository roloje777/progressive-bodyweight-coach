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
  CoachingSeedResult,
  resetCoachingTestData,
  seedCoachingScenario,
  seedDirectCoachingScenario,
} from "@/utils/testing/CoachingScenarioSeeder";
import {
  TrainingScheduleSeedResult,
  seedTrainingScheduleScenario,
} from "@/utils/testing/TrainingScheduleScenarioSeeder";
import { useProgress } from "@/hooks/useProgress";

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
  } = useProgress();

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

      setLastSeedResult(result);

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
  // SEED — TRAINING SCHEDULE
  // -----------------------------------

  const handleSeedTrainingScheduleScenario = async (
    scenario: TrainingScheduleScenario,
  ) => {
    try {
      setRunningScenario(scenario.id);
      setLastSeedResult(null);

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
  // RESET
  // -----------------------------------

  const handleReset = async () => {
    try {
      await resetCoachingTestData();

      setLastSeedResult(null);
      setLastScheduleSeedResult(null);

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
        jump straight into deload, verification, or scheduling states for faster
        debugging.
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

          <Text style={{ color: "#bbb" }}>
            Rest days: {lastScheduleSeedResult.restDaysCompleted}/
            {lastScheduleSeedResult.minimumRestDaysRequired ?? "-"}
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
            <Text style={{ color: "#000", fontWeight: "700" }}>
              Go to Home
            </Text>
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

      <Text
        style={{
          color: "#FFD700",
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Direct Scheduling Tests
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

            <Text style={{ color: "#FFD700", marginBottom: 12 }}>
              Rest days: {scenario.expected.restDaysCompleted}/
              {scenario.expected.minimumRestDaysRequired ?? "-"}
            </Text>

            <TouchableOpacity
              disabled={runningScenario !== null}
              onPress={() => handleSeedTrainingScheduleScenario(scenario)}
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

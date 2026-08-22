// app/screens/tests/CoachingScenarioTest.tsx

import React from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  CoachingScenario,
  coachingScenarios,
} from "@/tests/coachingScenarios";

import {
  CoachingSeedResult,
  resetCoachingTestData,
  seedCoachingScenario,
} from "@/utils/testing/CoachingScenarioSeeder";

export default function CoachingScenarioTest() {
  const [
    runningScenario,
    setRunningScenario,
  ] =
    React.useState<
      string | null
    >(null);

  const [
    lastSeedResult,
    setLastSeedResult,
  ] =
    React.useState<
      CoachingSeedResult | null
    >(null);

  // -----------------------------------
  // SEED
  // -----------------------------------

  const handleSeedScenario =
    async (
      scenario:
        CoachingScenario,
    ) => {
      try {
        setRunningScenario(
          scenario.id,
        );

        const result =
          await seedCoachingScenario(
            scenario,
            "level1",
          );

        setLastSeedResult(
          result,
        );

        Alert.alert(
          "Scenario ready",
          [
            scenario.title,
            "",
            `Seeded ${result.seededWorkoutCount} workouts.`,
            "",
            `Next workout: Week ${result.targetWeek}, Day ${result.targetDay}`,
            "",
            `Performance: ${getPerformanceInstruction(
              scenario,
            )}`,
            "",
            `Feedback: ${getFeedbackInstruction(
              scenario,
            )}`,
            "",
            `Expected: ${scenario.expected.recommendation.toUpperCase()}`,
          ].join("\n"),
        );
      } catch (error) {
        console.error(
          "❌ Failed to seed coaching scenario",
          error,
        );

        Alert.alert(
          "Seed failed",
          error instanceof Error
            ? error.message
            : String(error),
        );
      } finally {
        setRunningScenario(
          null,
        );
      }
    };

  // -----------------------------------
  // RESET
  // -----------------------------------

  const handleReset =
    async () => {
      try {
        await resetCoachingTestData();

        setLastSeedResult(
          null,
        );

        Alert.alert(
          "Reset complete",
          "Workout history, program evaluations and progress were cleared.",
        );
      } catch (error) {
        Alert.alert(
          "Reset failed",
          error instanceof Error
            ? error.message
            : String(error),
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
        backgroundColor:
          "#111",
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
        Each scenario clears the existing test data,
        seeds Level 1 through Week 4 Day 3, and positions
        the application at Week 4 Day 4.
      </Text>

      {lastSeedResult && (
        <View
          style={{
            backgroundColor:
              "#1f1f1f",
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

          <Text
            style={{
              color: "#fff",
              marginBottom: 4,
            }}
          >
            {lastSeedResult.scenarioId}
          </Text>

          <Text
            style={{
              color: "#bbb",
            }}
          >
            Week{" "}
            {lastSeedResult.targetWeek}
            {" • "}
            Day{" "}
            {lastSeedResult.targetDay}
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.replace("/")
            }
            style={{
              backgroundColor:
                "#FFD700",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#000",
                fontWeight: "700",
              }}
            >
              Go to Workout
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {coachingScenarios.map(
        (scenario) => {
          const running =
            runningScenario ===
            scenario.id;

          return (
            <View
              key={
                scenario.id
              }
              style={{
                backgroundColor:
                  "#1c1c1c",
                borderRadius: 16,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight:
                    "700",
                  marginBottom: 6,
                }}
              >
                {
                  scenario.title
                }
              </Text>

              <Text
                style={{
                  color: "#aaa",
                  lineHeight: 19,
                  marginBottom: 12,
                }}
              >
                {
                  scenario.description
                }
              </Text>

              <Text
                style={{
                  color: "#ddd",
                  marginBottom: 4,
                }}
              >
                Final workout:
              </Text>

              <Text
                style={{
                  color: "#aaa",
                  marginBottom: 4,
                }}
              >
                {getPerformanceInstruction(
                  scenario,
                )}
              </Text>

              <Text
                style={{
                  color: "#aaa",
                  marginBottom: 10,
                }}
              >
                {getFeedbackInstruction(
                  scenario,
                )}
              </Text>

              <Text
                style={{
                  color: "#FFD700",
                  marginBottom: 12,
                }}
              >
                Expected:{" "}
                {scenario.expected.recommendation.toUpperCase()}
              </Text>

              <TouchableOpacity
                disabled={
                  runningScenario !==
                  null
                }
                onPress={() =>
                  handleSeedScenario(
                    scenario,
                  )
                }
                style={{
                  backgroundColor:
                    running
                      ? "#555"
                      : "#333",

                  borderRadius: 12,

                  paddingVertical: 12,

                  alignItems:
                    "center",
                }}
              >
                {running ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={{
                      color:
                        "#fff",
                      fontWeight:
                        "700",
                    }}
                  >
                    Seed Scenario
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        },
      )}

      <TouchableOpacity
        disabled={
          runningScenario !==
          null
        }
        onPress={
          handleReset
        }
        style={{
          borderWidth: 1,
          borderColor: "#666",
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: "#ddd",
            fontWeight: "600",
          }}
        >
          Clear Test Data
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// -----------------------------------
// DISPLAY HELPERS
// -----------------------------------

function getPerformanceInstruction(
  scenario: CoachingScenario,
): string {
  if (
    scenario.finalPerformance ===
    "meetOrBeat"
  ) {
    return "Meet or beat the displayed MB targets.";
  }

  return "Fail most of the displayed MB targets.";
}

function getFeedbackInstruction(
  scenario: CoachingScenario,
): string {
  const {
    rating,
    tags,
  } =
    scenario.finalFeedback;

  if (!tags.length) {
    return `Select rating ${rating} with no safety tags.`;
  }

  return `Select rating ${rating} and tag: ${tags.join(
    ", ",
  )}`;
}
// app/screens/graduationCoach.tsx

import React, { useEffect, useMemo, useState } from "react";

import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { programs } from "@/data/programs";

import { useProgress } from "@/hooks/useProgress";

import { appStyles as styles } from "@/styles/appStyles";

import PrimaryButton from "@/components/PrimaryButton";

export default function GraduationCoach() {
  const {
    program,

    pendingGraduation,

    acceptGraduation,

    trainAnotherWeek,

    isLoaded,
  } = useProgress();

  const [isProcessing, setIsProcessing] = useState(false);

  // -----------------------------------
  // NEXT PROGRAM
  // -----------------------------------

  const nextProgram = useMemo(() => {
    if (!pendingGraduation) {
      return undefined;
    }

    return programs.find(
      (candidate) => candidate.id === pendingGraduation.nextProgramId,
    );
  }, [pendingGraduation]);

  const progressionEligible = pendingGraduation?.eligible === true;

  // -----------------------------------
  // GUARD
  // -----------------------------------
  //
  // This screen should only exist while there is
  // an earned graduation decision waiting for the
  // user.
  //
  // If someone reaches this route directly without
  // pending graduation, return them safely Home.
  // -----------------------------------

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!pendingGraduation) {
      router.replace("/");
    }
  }, [isLoaded, pendingGraduation]);

  if (!isLoaded || !pendingGraduation) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  // -----------------------------------
  // ACCEPT GRADUATION
  // -----------------------------------

  const handleProgress = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    const success = acceptGraduation();

    if (!success) {
      setIsProcessing(false);

      return;
    }

    /**
     * ProgressContext has now changed to:
     *
     * next program
     * Week 1
     * Day 1
     *
     * pendingGraduation has been cleared.
     */

    router.replace("/");
  };

  // -----------------------------------
  // TRAIN ANOTHER WEEK
  // -----------------------------------

  const handleAnotherWeek = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    const success = trainAnotherWeek();

    if (!success) {
      setIsProcessing(false);

      return;
    }

    /**
     * Current program remains active.
     *
     * Week advances:
     *
     * Week 4 → Week 5
     *
     * Graduation remains earned.
     */

    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.graduationScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* -------------------------------- */}
        {/* BADGE PLACEHOLDER */}
        {/* -------------------------------- */}

        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>🎓</Text>

          <Text style={styles.graduationBadgeLabel}>LEVEL COMPLETE</Text>
        </View>

        {/* -------------------------------- */}
        {/* HEADING */}
        {/* -------------------------------- */}

        <Text style={styles.graduationTitle}>
          {progressionEligible
            ? "You've Earned the Next Step"
            : "The Next Step Is on Hold"}
        </Text>

        <Text style={styles.graduationLead}>
          {progressionEligible
            ? "Your consistency and performance show that you're ready for the next challenge."
            : "You've already reached the progression standard, but your latest training signals suggest staying at this level for now."}
        </Text>

        {/* -------------------------------- */}
        {/* COACH MESSAGE */}
        {/* -------------------------------- */}
        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>

          {progressionEligible ? (
            <>
              <Text style={styles.graduationCoachMessage}>
                You&apos;ve completed the required training period and
                demonstrated that you can meet the performance standard
                consistently.
              </Text>

              <Text style={styles.graduationCoachMessage}>
                You&apos;ve earned progression. I recommend taking the next step
                — but the decision is yours.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.graduationCoachMessage}>
                You&apos;ve already shown that you can reach the progression
                standard, but your latest week suggests that moving forward
                right now is not the best call.
              </Text>

              <Text style={styles.graduationCoachMessage}>
                Stay at this level for another week. Once your performance and
                recovery signals are back where they need to be, progression
                will become available again.
              </Text>
            </>
          )}
        </View>

        {/* -------------------------------- */}
        {/* PROGRAM TRANSITION */}
        {/* -------------------------------- */}

        <View style={styles.graduationTransitionCard}>
          <View style={styles.graduationProgramBlock}>
            <Text style={styles.graduationProgramLabel}>COMPLETED</Text>

            <Text style={styles.graduationProgramLevel}>{program.level}</Text>
          </View>

          <Text style={styles.graduationArrow}>↓</Text>

          <View style={styles.graduationProgramBlock}>
            <Text style={styles.graduationProgramLabel}>NEXT CHALLENGE</Text>

            <Text style={styles.graduationNextProgramLevel}>
              {nextProgram?.level ?? pendingGraduation.nextProgramId}
            </Text>
          </View>
        </View>

        {/* -------------------------------- */}
        {/* PRIMARY ACTION */}
        {/* -------------------------------- */}

        <View style={styles.graduationActions}>
         {progressionEligible && (
          <PrimaryButton
              title={
                nextProgram
                  ? `Progress to ${nextProgram.level}`
                  : "Progress to Next Level"
              }
              onPress={handleProgress}
            />
          )}
          {/* -------------------------------- */}
          {/* SECONDARY ACTION */}
          {/* -------------------------------- */}

          <TouchableOpacity
            disabled={isProcessing}
            onPress={handleAnotherWeek}
            style={styles.graduationSecondaryButton}
          >
            <Text style={styles.graduationSecondaryButtonText}>
              Train Another Week
            </Text>
          </TouchableOpacity>

          <Text style={styles.graduationChoiceNote}>
            {progressionEligible
              ? "Your progression remains earned if you choose to spend another week at this level."
              : "Your previous achievement remains recorded. Progression will become available again when the Coach confirms that the current criteria are met."}
          </Text>
        </View>

        {/* -------------------------------- */}
        {/* FUTURE BADGE NOTE */}
        {/* -------------------------------- */}

        <View style={styles.graduationAchievementPlaceholder}>
          <Text style={styles.graduationAchievementTitle}>
            Achievement Earned
          </Text>

          <Text style={styles.graduationAchievementText}>
            Your graduation badge will appear here when achievements are
            introduced.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// app/screens/recoveryCoach.tsx

import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import { useProgress } from "@/hooks/useProgress";
import { appStyles as styles } from "@/styles/appStyles";

export default function RecoveryCoach() {
  const params = useLocalSearchParams();
  const { trainingScheduleStatus, isLoaded } = useProgress();
  const [isProcessing, setIsProcessing] = useState(false);

  const dayIndex = String(params.dayIndex ?? "0");
  const includeWarmup = String(params.includeWarmup ?? "true");
  const includeStretch = String(params.includeStretch ?? "true");

  const isRecoveryRecommendation =
    trainingScheduleStatus.status === "rest-recommended" &&
    trainingScheduleStatus.reason === "normal-rest-recommended";

  useEffect(() => {
    if (!isLoaded || isRecoveryRecommendation) {
      return;
    }

    router.replace({
      pathname: "/screens/preWorkoutOverView",
      params: {
        dayIndex,
        includeWarmup,
        includeStretch,
      },
    });
  }, [
    isLoaded,
    isRecoveryRecommendation,
    dayIndex,
    includeWarmup,
    includeStretch,
  ]);

  if (!isLoaded || !isRecoveryRecommendation) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  const recommended = trainingScheduleStatus.minimumRestDaysRequired ?? 0;
  const completed = trainingScheduleStatus.restDaysCompleted;
  const remaining = Math.max(recommended - completed, 0);

  const handleRestToday = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Advisory rest never mutates workout/program progress. The same current
    // workout remains available when the user returns later.
    router.replace("/");
  };

  const handleTrainAnyway = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    router.replace({
      pathname: "/screens/preWorkoutOverView",
      params: {
        dayIndex,
        includeWarmup,
        includeStretch,
      },
    });
  };

  return (
    <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.graduationScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>🌙</Text>
          <Text
            style={styles.graduationBadgeLabel}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {"RECOVERY\nRECOMMENDED"}
          </Text>
        </View>

        <Text style={styles.graduationTitle}>
          A Little More Recovery Would Help
        </Text>

        <Text style={styles.graduationLead}>
          Your next workout is available, but your recent training pattern has
          provided less recovery than the program normally recommends.
        </Text>

        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>

          <Text style={styles.graduationCoachMessage}>
            You have completed {completed} of the {recommended} recommended full
            rest {recommended === 1 ? "day" : "days"} before this workout.
          </Text>

          <Text style={styles.graduationCoachMessage}>
            {remaining > 0
              ? `I recommend taking ${remaining} more full rest ${remaining === 1 ? "day" : "days"} before training.`
              : "Your recommended recovery interval is now complete."}
          </Text>

          {trainingScheduleStatus.sessionsToday > 0 && (
            <Text style={styles.graduationCoachMessage}>
              You have already completed {trainingScheduleStatus.sessionsToday}{" "}
              training
              {trainingScheduleStatus.sessionsToday === 1
                ? " session"
                : " sessions"}{" "}
              today.
            </Text>
          )}

          <Text style={styles.graduationCoachMessage}>
            This is guidance, not a safety lock. If your schedule requires it
            and you feel ready, you can continue to the workout.
          </Text>
        </View>

        <View style={styles.graduationActions}>
          <PrimaryButton
            title="Rest Today"
            onPress={handleRestToday}
            disabled={isProcessing}
          />

          <TouchableOpacity
            disabled={isProcessing}
            onPress={handleTrainAnyway}
            style={styles.graduationSecondaryButton}
          >
            <Text style={styles.graduationSecondaryButtonText}>
              Train Anyway
            </Text>
          </TouchableOpacity>

          <Text style={styles.graduationChoiceNote}>
            Choosing Rest Today does not complete or skip this workout. It stays
            available until you choose to train.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

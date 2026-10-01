// app/screens/recoveryCoach.tsx

import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import { useProgress } from "@/hooks/useProgress";
import { useAppStyles } from "@/styles/appStyles";
import { useTranslation } from "@/hooks/useTranslation";

export default function RecoveryCoach() {
  const styles = useAppStyles();
  const { t } = useTranslation();
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
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
            {t("recoveryCoach.badge")}
          </Text>
        </View>

        <Text style={styles.graduationTitle}>
          {t("recoveryCoach.title")}
        </Text>

        <Text style={styles.graduationLead}>
          {t("recoveryCoach.lead")}
        </Text>

        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>

          <Text style={styles.graduationCoachMessage}>
            {t("recoveryCoach.completed", { completed, recommended, dayWord: t(recommended === 1 ? "recoveryCoach.day" : "recoveryCoach.days") })}
          </Text>

          <Text style={styles.graduationCoachMessage}>
            {remaining > 0
              ? t("recoveryCoach.more", { remaining, dayWord: t(remaining === 1 ? "recoveryCoach.day" : "recoveryCoach.days") })
              : t("recoveryCoach.complete")}
          </Text>

          {trainingScheduleStatus.sessionsToday > 0 && (
            <Text style={styles.graduationCoachMessage}>
              {t("recoveryCoach.sessions", { count: trainingScheduleStatus.sessionsToday, sessionWord: t(trainingScheduleStatus.sessionsToday === 1 ? "recoveryCoach.session" : "recoveryCoach.sessionsWord") })}
            </Text>
          )}

          <Text style={styles.graduationCoachMessage}>
            {t("recoveryCoach.guidance")}
          </Text>
        </View>

        <View style={styles.graduationActions}>
          <PrimaryButton
            title={t("recoveryCoach.restToday")}
            onPress={handleRestToday}
            disabled={isProcessing}
          />

          <TouchableOpacity
            disabled={isProcessing}
            onPress={handleTrainAnyway}
            style={styles.graduationSecondaryButton}
          >
            <Text style={styles.graduationSecondaryButtonText}>
              {t("recoveryCoach.trainAnyway")}
            </Text>
          </TouchableOpacity>

          <Text style={styles.graduationChoiceNote}>
            {t("recoveryCoach.note")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </>
  );
}

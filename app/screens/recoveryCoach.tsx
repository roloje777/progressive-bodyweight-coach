// app/screens/recoveryCoach.tsx

import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import { useAppStyles } from "@/styles/appStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { loadCalendarRecovery } from "@/storage/calendarRecoveryStorage";
import { matchesRecovery, recoveryPending, recoveryUnlockDate } from "@/engine/CalendarRecoveryPolicy";
import { useProgress } from "@/hooks/useProgress";

export default function RecoveryCoach() {
  const styles = useAppStyles();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { trainingScheduleStatus, isLoaded, program, week, day } = useProgress();
  const { generalSettings } = useGeneralSettings();
  const [calendarPending, setCalendarPending] = useState(false);
  const [calendarDays, setCalendarDays] = useState(0);
  const [calendarUnlock, setCalendarUnlock] = useState("");
  const calendarKind = String(params.calendarRecoveryKind ?? "");
  useEffect(() => {
    let active = true;
    void loadCalendarRecovery().then(value => {
      if (!active) return;
      const pending = matchesRecovery(value, {programId: program.id, weekIndex: week, dayIndex: day}) && recoveryPending(value, new Date());
      setCalendarPending(pending);
      setCalendarDays(pending ? value!.recoveryDays : 0);
      setCalendarUnlock(pending ? recoveryUnlockDate(value!.sourceDay, value!.recoveryDays) : "");
    });
    return () => { active = false; };
  }, [program.id, week, day]);
  const [isProcessing, setIsProcessing] = useState(false);

  const dayIndex = String(params.dayIndex ?? "0");
  const includeWarmup = String(params.includeWarmup ?? "true");
  const includeStretch = String(params.includeStretch ?? "true");

  const isRecoveryRecommendation =
    trainingScheduleStatus.status === "rest-recommended" &&
    trainingScheduleStatus.reason === "normal-rest-recommended";
  const hasRecovery = isRecoveryRecommendation || calendarPending || !!calendarKind;
  const compulsory = generalSettings.recoveryEnforcement === "compulsory";

  useEffect(() => {
    if (!isLoaded || hasRecovery) {
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
    hasRecovery,
    dayIndex,
    includeWarmup,
    includeStretch,
  ]);

  if (!isLoaded || !hasRecovery) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  const recommended = calendarPending ? calendarDays : (trainingScheduleStatus.minimumRestDaysRequired ?? 0);
  const completed = calendarPending ? 0 : trainingScheduleStatus.restDaysCompleted;
  const remaining = Math.max(recommended - completed, 0);

  const handleRestToday = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Advisory rest never mutates workout/program progress. The same current
    // workout remains available when the user returns later.
    router.replace("/");
  };

  const handleTrainAnyway = () => {
    if (isProcessing || compulsory) return;
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
            {calendarPending
              ? (calendarKind === "extra" ? "Recovery Day +1: additional recovery after scheduled rest." : "Two full calendar recovery days before retrying this workout.")
              : t("recoveryCoach.guidance")}
          </Text>
          <Text style={styles.graduationCoachMessage}>
            {compulsory
              ? `Compulsory recovery: training unlocks ${calendarUnlock || "after the scheduled recovery days"}.`
              : "Suggested recovery: training remains available if you choose to continue."}
          </Text>
        </View>

        <View style={styles.graduationActions}>
          <PrimaryButton
            title={t("recoveryCoach.restToday")}
            onPress={handleRestToday}
            disabled={isProcessing}
          />

          {!compulsory && <TouchableOpacity
            disabled={isProcessing}
            onPress={handleTrainAnyway}
            style={styles.graduationSecondaryButton}
          >
            <Text style={styles.graduationSecondaryButtonText}>
              {t("recoveryCoach.trainAnyway")}
            </Text>
          </TouchableOpacity>}

          <Text style={styles.graduationChoiceNote}>
            {t("recoveryCoach.note")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </>
  );
}

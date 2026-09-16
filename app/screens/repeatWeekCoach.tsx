import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import { useProgress } from "@/hooks/useProgress";
import { appStyles as styles } from "@/styles/appStyles";

function parseReasons(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function RepeatWeekCoach() {
  const params = useLocalSearchParams<{
    completedWeekIndex?: string;
    reasons?: string;
    fatigue?: string;
    form?: string;
    mbSuccessRate?: string;
  }>();

  const { program, startRepeatWeek, isLoaded } = useProgress();
  const [isProcessing, setIsProcessing] = useState(false);

  const completedWeekIndex = Number(params.completedWeekIndex);
  const fatigue = Number(params.fatigue ?? 0);
  const form = Number(params.form ?? 0);
  const mbSuccessRate = Number(params.mbSuccessRate ?? 0);
  const reasons = useMemo(() => parseReasons(params.reasons), [params.reasons]);

  const message = useMemo(() => {
    if (form > 0 || reasons.some((reason) => /form/i.test(reason))) {
      return {
        badge: "TECHNIQUE HOLD",
        title: "Give Your Form Another Week",
        lead: "Your movement quality is telling us that progressing the level now would be premature.",
        body: "Repeat this training week at the current level. If form breakdown keeps recurring, the Adaptive Coach can escalate the next step to a reduced-load deload before verification.",
      };
    }

    if (fatigue > 0 || reasons.some((reason) => /fatigue|low energy/i.test(reason))) {
      return {
        badge: "LOW ENERGY",
        title: "Recovery Needs More Time",
        lead: "Your latest week shows that recovery is limiting progression right now.",
        body: "Repeat the week instead of forcing the next level. If fatigue continues to accumulate to the Adaptive Coach threshold, the app will move you into the reduced-load deload and verification cycle.",
      };
    }

    if (mbSuccessRate < 0.8) {
      return {
        badge: "PROGRESSION HOLD",
        title: "One More Week at This Level",
        lead: "Your Match-or-Beat evidence is not yet strong enough to support progression.",
        body: "Repeat the week and use the existing targets as your next opportunity to reconfirm progression readiness.",
      };
    }

    return {
      badge: "REPEAT WEEK",
      title: "More Time at This Level",
      lead: "The current progression requirements have not all been satisfied.",
      body: "Repeat the week and let the next full week of evidence determine whether progression is ready.",
    };
  }, [fatigue, form, mbSuccessRate, reasons]);

  const handleRepeat = () => {
    if (isProcessing || !Number.isFinite(completedWeekIndex)) return;
    setIsProcessing(true);

    const success = startRepeatWeek(completedWeekIndex);
    if (!success) {
      setIsProcessing(false);
      return;
    }

    router.replace("/");
  };

  if (!isLoaded) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  return (
    <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.graduationScrollContent}>
        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>🔁</Text>
          <Text style={styles.graduationBadgeLabel}>{message.badge}</Text>
        </View>

        <Text style={styles.graduationTitle}>{message.title}</Text>
        <Text style={styles.graduationLead}>{message.lead}</Text>

        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>
          <Text style={styles.graduationCoachMessage}>{message.body}</Text>

          {reasons.slice(0, 3).map((reason) => (
            <Text key={reason} style={styles.graduationCoachMessage}>
              • {reason}
            </Text>
          ))}
        </View>

        <View style={styles.graduationTransitionCard}>
          <View style={styles.graduationProgramBlock}>
            <Text style={styles.graduationProgramLabel}>CURRENT LEVEL</Text>
            <Text style={styles.graduationProgramLevel}>{program.level}</Text>
          </View>

          <Text style={styles.graduationArrow}>↓</Text>

          <View style={styles.graduationProgramBlock}>
            <Text style={styles.graduationProgramLabel}>NEXT PHASE</Text>
            <Text style={styles.graduationNextProgramLevel}>
              Repeat Week {completedWeekIndex + 2}
            </Text>
          </View>
        </View>

        <View style={styles.graduationActions}>
          <PrimaryButton
            title="Repeat Training Week"
            onPress={handleRepeat}
            disabled={isProcessing}
          />
          <Text style={styles.graduationChoiceNote}>
            Progression remains on hold. Repeating is normal training; a deload
            is introduced only when the recovery/form thresholds require it.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

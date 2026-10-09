// app/screens/painCoach.tsx

import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import {
  evaluateImmediatePainInterception,
  ImmediatePainAnswers,
} from "@/engine/ImmediatePainInterceptionEngine";
import { useProgress } from "@/hooks/useProgress";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";

type YesNoChoiceProps = {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

function YesNoChoice({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
}: YesNoChoiceProps) {
  const styles = useAppStyles();
  const palette = useAppPalette();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.graduationCoachMessage}>{label}</Text>

      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginTop: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => onChange(true)}
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 1,
              alignItems: "center",
            },
            value === true
              ? {
                  borderColor: palette.primary,
                  backgroundColor: palette.primarySoft,
                }
              : {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceAlt,
                },
          ]}
        >
          <Text
            style={{
              color: value === true ? palette.primaryText : palette.text,
              fontWeight: "700",
            }}
          >
            {yesLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChange(false)}
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 1,
              alignItems: "center",
            },
            value === false
              ? {
                  borderColor: palette.primary,
                  backgroundColor: palette.primarySoft,
                }
              : {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceAlt,
                },
          ]}
        >
          <Text
            style={{
              color: value === false ? palette.primaryText : palette.text,
              fontWeight: "700",
            }}
          >
            {noLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PainCoach() {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const params = useLocalSearchParams();
  const { t, uiText } = useTranslation();

  const {
    program,
    activeDeload,
    beginPainRecovery,
    startDeloadWeek,
    isLoaded,
  } = useProgress();

  const [answers, setAnswers] = useState<ImmediatePainAnswers>({
    painStillPresent: null,
    affectedGoodForm: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const triggeredAtWeekIndex = Number(params.triggeredAtWeekIndex ?? 0);

  const interruptionDuringRecovery =
    String(params.interruptionDuringRecovery ?? "false") === "true";

  const lifecycleRequiresRecovery =
    String(params.lifecycleRequiresRecovery ?? "false") === "true";

  const decision = useMemo(
    () =>
      evaluateImmediatePainInterception({
        answers,
        lifecycleRequiresRecovery,
      }),
    [answers, lifecycleRequiresRecovery],
  );

  if (!isLoaded) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  const handleBeginRecovery = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    /**
     * If cycle-level readiness already created the same pain deload,
     * simply start it. Otherwise this single action creates AND starts
     * a new pain-recovery cycle from the week where pain was reported.
     */
    const existingPainDeload =
      activeDeload?.programId === program.id &&
      activeDeload.phase === "deload" &&
      activeDeload.reason === "pain";

    if (interruptionDuringRecovery && existingPainDeload) {
      router.replace("/");
      return;
    }

    const success = existingPainDeload
      ? startDeloadWeek()
      : beginPainRecovery(triggeredAtWeekIndex);

    if (!success) {
      setIsProcessing(false);
      return;
    }

    router.replace("/");
  };

  const handleContinueProgram = () => {
    if (
      isProcessing ||
      decision.status !== "continue-allowed"
    ) {
      return;
    }

    setIsProcessing(true);

    /**
     * The completed workout and its pain feedback stay in history.
     * We are only resolving the immediate interception.
     *
     * Cycle-level readiness remains authoritative later and may still
     * block progression if pain becomes recurring.
     */
    router.replace("/");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
      style={styles.graduationScreen}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.graduationScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>🛡️</Text>
          <Text style={styles.graduationBadgeLabel}>{t("painCoach.badge")}</Text>
        </View>

        <Text style={styles.graduationTitle}>
          {t("painCoach.title")}
        </Text>

        <Text style={styles.graduationLead}>
          {t("painCoach.lead")}
        </Text>

        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>{t("painCoach.coach")}</Text>

          <YesNoChoice
            label={t("painCoach.question.present")}
            yesLabel={t("common.yes")}
            noLabel={t("common.no")}
            value={answers.painStillPresent}
            onChange={(value) =>
              setAnswers((current) => ({
                ...current,
                painStillPresent: value,
              }))
            }
          />

          <YesNoChoice
            label={t("painCoach.question.form")}
            yesLabel={t("common.yes")}
            noLabel={t("common.no")}
            value={answers.affectedGoodForm}
            onChange={(value) =>
              setAnswers((current) => ({
                ...current,
                affectedGoodForm: value,
              }))
            }
          />
        </View>

        {decision.status !== "questions-incomplete" && (
          <View style={styles.graduationTransitionCard}>
            <View style={styles.graduationProgramBlock}>
              <Text style={styles.graduationProgramLabel}>{t("painCoach.decision")}</Text>

              <Text style={styles.graduationNextProgramLevel}>
                {decision.recoveryRequired
                  ? t("painCoach.beginPainRecovery")
                  : t("painCoach.continueProgram")}
              </Text>

              {decision.reasons.map((reason) => (
                <Text
                  key={reason}
                  style={[
                    styles.graduationProgramMeta,
                    { marginTop: 8 },
                  ]}
                >
                  {uiText(reason)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {decision.status === "recovery-required" && (
          <View style={styles.graduationActions}>
            <PrimaryButton
              title={t("painCoach.beginRecovery")}
              onPress={handleBeginRecovery}
              disabled={isProcessing}
            />

            <Text style={styles.graduationChoiceNote}>
              {t("painCoach.recoveryNote")}
            </Text>
          </View>
        )}

        {decision.status === "continue-allowed" && (
          <View style={styles.graduationActions}>
            <PrimaryButton
              title={t("painCoach.continueProgramButton")}
              onPress={handleContinueProgram}
              disabled={isProcessing}
            />

            <TouchableOpacity
              onPress={handleBeginRecovery}
              disabled={isProcessing}
              style={{
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: palette.info,
                  fontWeight: "700",
                }}
              >
                {t("painCoach.beginInstead")}
              </Text>
            </TouchableOpacity>

            <Text style={styles.graduationChoiceNote}>
              {t("painCoach.continueNote")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  </>
  );
}

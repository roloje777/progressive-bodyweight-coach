// app/screens/painCoach.tsx

import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import { beginMedicalRecovery, getActiveMedicalRecovery } from "@/storage/medicalRecoveryStorage";
import { getActivePainWeek, beginPainWeekEpisode, escalatePainWeekEpisode } from "@/storage/painWeekStorage";
import { requiresMedicalRecovery } from "@/engine/PainMedicalTriagePolicy";
import {
  evaluateImmediatePainInterception,
  ImmediatePainAnswers,
} from "@/engine/ImmediatePainInterceptionEngine";
import { useProgress } from "@/hooks/useProgress";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";

// Map known policy explanations to localized presentation strings.
const PAIN_REASON_KEYS = {
  "Your recent training history already meets the Coach's recovery threshold.": "painCoach.reason.history",
  "The discomfort is still present after the workout.": "painCoach.reason.persistent",
  "The discomfort affected your ability to complete the movement with good form.": "painCoach.reason.form",
  "The discomfort is no longer present and it did not affect good-form completion.": "painCoach.reason.resolved",
} as const;

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
    week,
    day,
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
  const [severePain, setSeverePain] = useState<boolean | null>(null);
  const [worseningPain, setWorseningPain] = useState<boolean | null>(null);
  const [warningSigns, setWarningSigns] = useState<boolean | null>(null);
  const medicalTriageComplete = severePain !== null && worseningPain !== null && warningSigns !== null;
  const medicalRequired = requiresMedicalRecovery({ severePain, worseningPain, warningSigns });

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

  const handleEnterMedicalRecovery = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const painWeek = await getActivePainWeek();
      if (painWeek) await escalatePainWeekEpisode(painWeek.id);
      const existing = await getActiveMedicalRecovery();
      if (!existing) await beginMedicalRecovery(`medical-${Date.now()}`);
      router.replace("/screens/medicalRecovery");
    } catch {
      setIsProcessing(false);
    }
  };

  const handleBeginRecovery = async () => {
    if (isProcessing || !medicalTriageComplete) return;
    if (medicalRequired || await getActiveMedicalRecovery()) {
      await handleEnterMedicalRecovery();
      return;
    }
    setIsProcessing(true);
    try {
      const current = await getActivePainWeek();
      if (!current) {
        const today = new Date();
        const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
        await beginPainWeekEpisode({
          id: `pain-${Date.now()}`, startedLocalDate: localDate, recommendedDays: 7,
          originalProgramId: program.id,
          originalWeekIndex: activeDeload?.programId === program.id && activeDeload.returnWeekIndex != null
            ? activeDeload.returnWeekIndex : triggeredAtWeekIndex,
          originalDayIndex: activeDeload?.programId === program.id && activeDeload.returnDayIndex != null
            ? activeDeload.returnDayIndex : day,
          status: "active", dailyAssessments: [],
        });
      }
      router.replace("/screens/painWeek");
    } catch { setIsProcessing(false); }
  };

  const handleContinueProgram = async () => {
    if (
      isProcessing ||
      !medicalTriageComplete || medicalRequired ||
      (await getActiveMedicalRecovery()) !== null ||
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

        <View style={styles.graduationCoachCard}>
          <YesNoChoice label={t("painCoach.question.severe")} yesLabel={t("common.yes")} noLabel={t("common.no")} value={severePain} onChange={setSeverePain} />
          <YesNoChoice label={t("painCoach.question.worsening")} yesLabel={t("common.yes")} noLabel={t("common.no")} value={worseningPain} onChange={setWorseningPain} />
          <YesNoChoice label={t("painCoach.question.warningSigns")} yesLabel={t("common.yes")} noLabel={t("common.no")} value={warningSigns} onChange={setWarningSigns} />
        </View>
        {medicalTriageComplete && medicalRequired && (
          <View style={styles.graduationTransitionCard}>
            <Text style={styles.graduationCoachMessage}>{t("painCoach.medicalRequired")}</Text>
            <PrimaryButton title={t("medicalRecovery.enter")} onPress={() => void handleEnterMedicalRecovery()} disabled={isProcessing} />
          </View>
        )}

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
                  {reason in PAIN_REASON_KEYS
                    ? t(PAIN_REASON_KEYS[reason as keyof typeof PAIN_REASON_KEYS])
                    : uiText(reason)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {!medicalRequired && <TouchableOpacity
          disabled={isProcessing}
          onPress={() => void handleEnterMedicalRecovery()}
          style={{ paddingVertical: 16, alignItems: "center" }}
        >
          <Text style={{ color: palette.info, fontWeight: "700", textAlign: "center" }}>
            {t("medicalRecovery.enter")}
          </Text>
        </TouchableOpacity>}

        {medicalTriageComplete && !medicalRequired && decision.status === "recovery-required" && (
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

        {medicalTriageComplete && !medicalRequired && decision.status === "continue-allowed" && (
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

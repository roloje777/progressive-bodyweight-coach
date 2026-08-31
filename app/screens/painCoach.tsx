// app/screens/painCoach.tsx

import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import {
  evaluateImmediatePainInterception,
  ImmediatePainAnswers,
} from "@/engine/ImmediatePainInterceptionEngine";
import { useProgress } from "@/hooks/useProgress";
import { appStyles as styles } from "@/styles/appStyles";

type YesNoChoiceProps = {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
};

function YesNoChoice({
  label,
  value,
  onChange,
}: YesNoChoiceProps) {
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
                  borderColor: "#4FC3F7",
                  backgroundColor: "#173846",
                }
              : {
                  borderColor: "#44545A",
                  backgroundColor: "#182126",
                },
          ]}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "700",
            }}
          >
            Yes
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
                  borderColor: "#4FC3F7",
                  backgroundColor: "#173846",
                }
              : {
                  borderColor: "#44545A",
                  backgroundColor: "#182126",
                },
          ]}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "700",
            }}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PainCoach() {
  const params = useLocalSearchParams();

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
          <Text style={styles.graduationBadgeLabel}>PAIN CHECK-IN</Text>
        </View>

        <Text style={styles.graduationTitle}>
          Let&apos;s Check That Discomfort
        </Text>

        <Text style={styles.graduationLead}>
          You reported joint discomfort during this workout. I need two quick
          answers before deciding whether normal training should continue.
        </Text>

        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>

          <YesNoChoice
            label="Is the discomfort still present now?"
            value={answers.painStillPresent}
            onChange={(value) =>
              setAnswers((current) => ({
                ...current,
                painStillPresent: value,
              }))
            }
          />

          <YesNoChoice
            label="Did the discomfort affect your ability to complete the movement with good form?"
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
              <Text style={styles.graduationProgramLabel}>COACH DECISION</Text>

              <Text style={styles.graduationNextProgramLevel}>
                {decision.recoveryRequired
                  ? "Begin Pain Recovery"
                  : "Continue Program"}
              </Text>

              {decision.reasons.map((reason) => (
                <Text
                  key={reason}
                  style={[
                    styles.graduationProgramMeta,
                    { marginTop: 8 },
                  ]}
                >
                  {reason}
                </Text>
              ))}
            </View>
          </View>
        )}

        {decision.status === "recovery-required" && (
          <View style={styles.graduationActions}>
            <PrimaryButton
              title="BEGIN RECOVERY"
              onPress={handleBeginRecovery}
              disabled={isProcessing}
            />

            <Text style={styles.graduationChoiceNote}>
              I&apos;m pausing normal Match-or-Beat training. The recovery cycle
              begins with the required minimum rest interval; this is a training
              safety decision, not a medical diagnosis.
            </Text>
          </View>
        )}

        {decision.status === "continue-allowed" && (
          <View style={styles.graduationActions}>
            <PrimaryButton
              title="CONTINUE PROGRAM"
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
                  color: "#B3E5FC",
                  fontWeight: "700",
                }}
              >
                Begin Recovery Instead
              </Text>
            </TouchableOpacity>

            <Text style={styles.graduationChoiceNote}>
              Continuing does not erase this pain report. It remains part of
              your training history, and recurring discomfort can still trigger
              recovery through the normal readiness system.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

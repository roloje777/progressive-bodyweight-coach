// app/screens/graduationCoach.tsx

import React, { useEffect, useMemo, useState } from "react";

import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router, useLocalSearchParams } from "expo-router";

import { programs } from "@/data/programs";

import { useProgress } from "@/hooks/useProgress";

import { appStyles as styles } from "@/styles/appStyles";

import PrimaryButton from "@/components/PrimaryButton";

import { DeloadReason } from "@/models/ProgramProgress";

function getDeloadCopy(reason: DeloadReason) {
  switch (reason) {
    case "pain":
      return {
        badge: "RECOVERY REQUIRED",
        title: "Recovery Comes First",
        lead: "Your recent training shows recurring joint discomfort. The next cycle should focus on recovery rather than normal strength work.",
        messages: [
          "I’m putting normal Match-or-Beat training on hold for now. Reduced strength work is not the right response to recurring joint discomfort.",
          "Your recovery cycle will focus on comfortable, pain-free recovery work. Normal training will return only after the recovery phase and a verification cycle.",
        ],
        action: "Start Recovery Cycle",
      };

    case "form":
      return {
        badge: "DELOAD RECOMMENDED",
        title: "Technique Needs Recovery",
        lead: "Recurring form breakdown suggests that accumulated training stress is affecting movement quality.",
        messages: [
          "The next cycle will reduce the training demand so you can recover while keeping the movement patterns familiar.",
          "Match-or-Beat progression will be suspended during the deload. Afterward, you’ll return through a verification cycle before normal progression resumes.",
        ],
        action: "Start Deload Week",
      };

    case "fatigue":
      return {
        badge: "DELOAD RECOMMENDED",
        title: "A Recovery Week Is Due",
        lead: "Recurring fatigue shows that recovery has fallen behind the current training demand.",
        messages: [
          "The next cycle will keep your normal exercise pattern but reduce the workload and give you more recovery between efforts.",
          "Match-or-Beat progression will be suspended during the deload. Afterward, you’ll complete a verification cycle before normal progression resumes.",
        ],
        action: "Start Deload Week",
      };

    default:
      return {
        badge: "DELOAD RECOMMENDED",
        title: "Recovery Is the Next Step",
        lead: "Your latest readiness signals show that a short recovery phase is more useful than pushing normal progression right now.",
        messages: [
          "The next cycle will reduce training demand and focus on recovery.",
          "Match-or-Beat progression will be suspended during the deload. A verification cycle will follow before normal progression resumes.",
        ],
        action: "Start Deload Week",
      };
  }
}

export default function GraduationCoach() {
  const params = useLocalSearchParams<{
    verificationIntro?: string;
  }>();

  const verificationIntroRequested = params.verificationIntro === "true";
  const {
    program,

    pendingGraduation,

    activeDeload,

    acceptGraduation,

    trainAnotherWeek,

    startDeloadWeek,

    isLoaded,
  } = useProgress();

  const [isProcessing, setIsProcessing] = useState(false);

  const isDeloadReview =
    activeDeload?.programId === program.id && activeDeload.phase === "deload";

  const isVerificationReview =
    verificationIntroRequested ||
    (activeDeload?.programId === program.id &&
      activeDeload.phase === "verification");

  const deloadCopy = isDeloadReview
    ? getDeloadCopy(activeDeload.reason)
    : undefined;

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
  // The Coach can now be reached for either:
  //
  // - a graduation decision
  // - a required deload/recovery decision
  //
  // A deload takes priority when both states exist because
  // progression is suspended until recovery is completed.
  // -----------------------------------

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!pendingGraduation && !isDeloadReview && !isVerificationReview) {
      router.replace("/");
    }
  }, [isLoaded, pendingGraduation, isDeloadReview, isVerificationReview]);

  if (
    !isLoaded ||
    (!pendingGraduation && !isDeloadReview && !isVerificationReview)
  ) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  // -----------------------------------
  // START DELOAD / RECOVERY CYCLE
  // -----------------------------------

  const handleStartDeload = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    const success = startDeloadWeek();

    if (!success) {
      setIsProcessing(false);
      return;
    }

    router.replace("/");
  };

  // -----------------------------------
  // CONTINUE TO VERIFICATION WEEK
  // -----------------------------------

  const handleStartVerification = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    router.replace("/");
  };

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

    router.replace("/");
  };

  if (isVerificationReview) {
    return (
      <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.graduationScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.graduationVerificationBadge}>
            <Text style={styles.graduationVerificationBadgeIcon}>✓</Text>
            <Text style={styles.graduationVerificationBadgeLabel}>
              RECOVERY COMPLETE
            </Text>
          </View>

          <Text style={styles.graduationTitle}>
            Ready to Verify Your Recovery
          </Text>

          <Text style={styles.graduationLead}>
            You’ve completed the recovery phase. The next week is a controlled
            return to normal training so we can see how your body responds.
          </Text>

          <View style={styles.graduationCoachCard}>
            <Text style={styles.graduationCoachLabel}>COACH</Text>

            <Text style={styles.graduationCoachMessage}>
              Your normal exercise structure, sets and rest periods return now,
              but the Match-or-Beat targets will begin at 80% of your healthy
              pre-deload baseline.
            </Text>

            <Text style={styles.graduationCoachMessage}>
              This week is not about making up for lost time. Train with
              control, pay attention to how you feel, and let the verification
              week show whether you’re ready to resume full progression.
            </Text>
          </View>

          <View style={styles.graduationTransitionCard}>
            <View style={styles.graduationProgramBlock}>
              <Text style={styles.graduationProgramLabel}>NEXT PHASE</Text>
              <Text style={styles.graduationProgramName}>
                Verification Week
              </Text>
              <Text style={styles.graduationProgramMeta}>
                80% of healthy pre-deload MB targets
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="Continue to Verification Week"
            onPress={handleStartVerification}
            disabled={isProcessing}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isDeloadReview && deloadCopy) {
    return (
      <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.graduationScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.graduationBadge}>
            <Text style={styles.graduationBadgeIcon}>
              {activeDeload.reason === "pain" ? "🛡️" : "↘️"}
            </Text>

            <Text style={styles.graduationBadgeLabel}>{deloadCopy.badge}</Text>
          </View>

          <Text style={styles.graduationTitle}>{deloadCopy.title}</Text>

          <Text style={styles.graduationLead}>{deloadCopy.lead}</Text>

          <View style={styles.graduationCoachCard}>
            <Text style={styles.graduationCoachLabel}>COACH</Text>

            {deloadCopy.messages.map((message) => (
              <Text key={message} style={styles.graduationCoachMessage}>
                {message}
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
                {activeDeload.reason === "pain"
                  ? "Recovery Cycle"
                  : "Deload Week"}
              </Text>
            </View>
          </View>

          <View style={styles.graduationActions}>
            <PrimaryButton
              title={deloadCopy.action}
              onPress={handleStartDeload}
            />

            <Text style={styles.graduationChoiceNote}>
              This recovery step is required by the Coach. Normal progression
              and Match-or-Beat evaluation remain on hold until the deload and
              verification phases are complete.
            </Text>

            {pendingGraduation?.programId === program.id && (
              <Text style={styles.graduationChoiceNote}>
                Your previously earned progression remains recorded; it is only
                temporarily unavailable while recovery is required.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.graduationScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>🎓</Text>

          <Text style={styles.graduationBadgeLabel}>LEVEL COMPLETE</Text>
        </View>

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

        <View style={styles.graduationTransitionCard}>
          <View style={styles.graduationProgramBlock}>
            <Text style={styles.graduationProgramLabel}>COMPLETED</Text>

            <Text style={styles.graduationProgramLevel}>{program.level}</Text>
          </View>

          <Text style={styles.graduationArrow}>↓</Text>

          <View style={styles.graduationProgramBlock}>
            <Text style={styles.graduationProgramLabel}>NEXT CHALLENGE</Text>

            <Text style={styles.graduationNextProgramLevel}>
              {nextProgram?.level ?? pendingGraduation?.nextProgramId}
            </Text>
          </View>
        </View>

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

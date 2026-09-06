// app/screens/adaptiveVolumeCoach.tsx

import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import PrimaryButton from "@/components/PrimaryButton";
import { programs } from "@/data/programs";
import { useProgress } from "@/hooks/useProgress";
import { AdaptiveRecommendationItem, getAdaptiveWeekKey } from "@/models/AdaptiveVolume";
import { appStyles as styles } from "@/styles/appStyles";

function humanizeExerciseId(exerciseId: string): string {
  return exerciseId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdaptiveVolumeCoach() {
  const params = useLocalSearchParams<{
    programId?: string;
    weekIndex?: string;
    finalReview?: string;
    afterReview?: string;
  }>();

  const {
    adaptiveVolume,
    applyAdaptiveVolumeSelection,
    trainAnotherWeek,
    isLoaded,
  } = useProgress();

  const [isProcessing, setIsProcessing] = useState(false);

  const programId = params.programId ?? "";
  const weekIndex = Number(params.weekIndex);
  const validWeekIndex = Number.isFinite(weekIndex) ? weekIndex : -1;
  const finalReview = params.finalReview === "true";
  const shouldStartAnotherWeek = params.afterReview === "repeatWeek";
  const weekKey = getAdaptiveWeekKey(programId, validWeekIndex);
  const recommendation = adaptiveVolume.pendingRecommendations[weekKey];

  const sourceProgram = useMemo(
    () => programs.find((candidate) => candidate.id === programId),
    [programId],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!recommendation) return;
    setSelectedIds(
      recommendation.items.filter((item) => item.selected).map((item) => item.id),
    );
  }, [weekKey, recommendation?.items.length]);

  useEffect(() => {
    if (!isLoaded) return;

    if (
      !programId ||
      validWeekIndex < 0 ||
      !recommendation ||
      recommendation.closed
    ) {
      router.replace("/");
    }
  }, [isLoaded, programId, validWeekIndex, recommendation]);

  if (!isLoaded || !recommendation || recommendation.closed || !sourceProgram) {
    return <SafeAreaView style={styles.graduationScreen} />;
  }

  const getDayTitle = (dayIndex: number) =>
    sourceProgram.days[dayIndex]?.title ?? `Day ${dayIndex + 1}`;

  const toggleItem = (itemId: string) => {
    if (isProcessing) return;
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const finishReview = (selected: string[]) => {
    const success = applyAdaptiveVolumeSelection(
      programId,
      validWeekIndex,
      selected,
      finalReview,
    );

    if (!success) {
      setIsProcessing(false);
      return;
    }

    if (finalReview && shouldStartAnotherWeek) {
      const moved = trainAnotherWeek();
      if (!moved) {
        setIsProcessing(false);
        return;
      }
    }

    router.replace("/");
  };

  const handleAcceptSelected = () => {
    if (isProcessing || selectedIds.length === 0) return;
    setIsProcessing(true);
    finishReview(selectedIds);
  };

  const handleKeepCurrent = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    finishReview([]);
  };

  const renderOffer = (item: AdaptiveRecommendationItem) => {
    const checked = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        disabled={isProcessing}
        onPress={() => toggleItem(item.id)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginTop: 14,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: 2,
            borderColor: "#D7E5FF",
            borderRadius: 5,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            marginTop: 2,
          }}
        >
          {checked && (
            <Text style={{ color: "#D7E5FF", fontWeight: "900", fontSize: 16 }}>
              ✓
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.graduationCoachMessage}>
            Day {item.dayIndex + 1} – {getDayTitle(item.dayIndex)}
          </Text>

          <Text style={styles.graduationCoachMessage}>
            {item.type === "set-increase"
              ? `${humanizeExerciseId(item.exerciseId)}: ${item.fromSets} → ${item.toSets} sets`
              : `Add ${humanizeExerciseId(item.exerciseId)} as the optional adaptive exercise`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.graduationScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>📈</Text>
          <Text
            style={styles.graduationBadgeLabel}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {finalReview ? "VOLUME\nREVIEW" : "VOLUME\nREADY"}
          </Text>
        </View>

        <Text style={styles.graduationTitle}>
          {finalReview ? "Review This Week’s Volume Choices" : "You’re Ready for More Volume"}
        </Text>

        <Text style={styles.graduationLead}>
          {finalReview
            ? "Before this training week closes, review every adaptive-volume offer you earned. You can change any earlier choice one last time."
            : "Your recent Match-or-Beat performance and workout feedback suggest that a small increase in training volume is appropriate."}
        </Text>

        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>

          <Text style={styles.graduationCoachMessage}>
            {finalReview
              ? "These are all of the volume changes I offered during this week. Checked items are your current choices. Uncheck or select anything you want to change before we continue."
              : "Here are all of the adaptive-volume options earned so far this week. Checked items are currently selected. You can revise earlier choices whenever I return with new evidence."}
          </Text>

          {recommendation.items.map(renderOffer)}

          <Text style={[styles.graduationCoachMessage, { marginTop: 16 }]}>
            This remains your choice. Match-or-Beat, readiness, recovery and
            deload safeguards continue to apply after any increase.
          </Text>
        </View>

        <View style={styles.graduationActions}>
          <PrimaryButton
            title={finalReview ? "Confirm Selected Changes" : "Accept Selected Changes"}
            onPress={handleAcceptSelected}
            disabled={isProcessing || selectedIds.length === 0}
          />

          <TouchableOpacity
            disabled={isProcessing}
            onPress={handleKeepCurrent}
            style={styles.graduationSecondaryButton}
          >
            <Text style={styles.graduationSecondaryButtonText}>
              Keep Current Volume
            </Text>
          </TouchableOpacity>

          <Text style={styles.graduationChoiceNote}>
            {finalReview
              ? "This is the final adaptive-volume decision for the completed week. Keep Current Volume clears all of this week’s offered changes."
              : "Keep Current Volume leaves all of this week’s offers unchecked for now. A later qualifying workout, or the final weekly review, can give you another opportunity to reconsider them."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

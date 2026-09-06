// app/(tabs)/settings.tsx

import React, { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MAXIMUM_ADAPTIVE_START_WEEK,
  MINIMUM_ADAPTIVE_START_WEEK,
  MINIMUM_WEEKLY_QUALIFYING_RATINGS,
} from "@/config/AdaptiveVolumeConfig";
import { MINIMUM_PAIN_REST_DAYS } from "@/config/TrainingScheduleConfig";
import { MAXIMUM_PAIN_REST_DAYS } from "@/context/TrainingScheduleSettingsContext";
import { useAdaptiveVolumeSettings } from "@/hooks/useAdaptiveVolumeSettings";
import { useProgress } from "@/hooks/useProgress";
import { useTrainingScheduleSettings } from "@/hooks/useTrainingScheduleSettings";
import { appStyles as styles } from "@/styles/appStyles";

type ExpandableHelpProps = {
  collapsed: string;
  expanded: string;
};

function ExpandableHelp({ collapsed, expanded }: ExpandableHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View>
      <Text style={styles.scheduleSettingDescription}>{collapsed}</Text>

      <Pressable
        onPress={() => setIsExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? "Show less information" : "Learn more"}
      >
        <Text style={styles.scheduleLearnMore}>
          {isExpanded ? "Show less" : "ⓘ Learn more"}
        </Text>
      </Pressable>

      {isExpanded && (
        <Text style={styles.scheduleExpandedHelp}>{expanded}</Text>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const {
    trainingScheduleConfig,
    isLoaded: isTrainingScheduleLoaded,
    setNormalRecoveryGuidanceEnabled,
    setPainMinimumRestDays,
    restoreTrainingScheduleDefaults,
  } = useTrainingScheduleSettings();

  const {
    adaptiveVolumeConfig,
    isLoaded: isAdaptiveVolumeLoaded,
    setAdaptiveVolumeEnabled,
    setAdaptiveStartWeek,
    setAdaptiveWeeklyQualifyingRatingCount,
    restoreAdaptiveVolumeDefaults,
  } = useAdaptiveVolumeSettings();

  const { program, isLoaded: isProgressLoaded } = useProgress();

  if (
    !isTrainingScheduleLoaded ||
    !isAdaptiveVolumeLoaded ||
    !isProgressLoaded
  ) {
    return <SafeAreaView style={styles.scheduleSettingsScreen} />;
  }

  const painRestDays = trainingScheduleConfig.painMinimumRestDays;
  const canDecreasePainRest = painRestDays > MINIMUM_PAIN_REST_DAYS;
  const canIncreasePainRest = painRestDays < MAXIMUM_PAIN_REST_DAYS;

  const adaptiveStartWeek = adaptiveVolumeConfig.startWeek;
  const canDecreaseAdaptiveStart =
    adaptiveStartWeek > MINIMUM_ADAPTIVE_START_WEEK;
  const canIncreaseAdaptiveStart =
    adaptiveStartWeek < MAXIMUM_ADAPTIVE_START_WEEK;

  const maxAdaptiveQualifyingRatings = Math.max(
    MINIMUM_WEEKLY_QUALIFYING_RATINGS,
    program.days.length,
  );
  const adaptiveQualifyingRatings = Math.min(
    adaptiveVolumeConfig.weeklyQualifyingRatingCount,
    maxAdaptiveQualifyingRatings,
  );
  const canDecreaseAdaptiveRatings =
    adaptiveQualifyingRatings > MINIMUM_WEEKLY_QUALIFYING_RATINGS;
  const canIncreaseAdaptiveRatings =
    adaptiveQualifyingRatings < maxAdaptiveQualifyingRatings;

  const handleRestoreScheduleDefaults = () => {
    restoreTrainingScheduleDefaults();
  };

  const handleRestoreAdaptiveDefaults = () => {
    restoreAdaptiveVolumeDefaults();
  };

  return (
    <SafeAreaView style={styles.scheduleSettingsScreen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scheduleSettingsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.scheduleSettingsTitle}>Settings</Text>

        <Text style={styles.scheduleSettingsSectionTitle}>
          TRAINING SCHEDULE
        </Text>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>
                Normal Recovery Guidance
              </Text>

              <Text style={styles.scheduleSettingValueLabel}>
                {trainingScheduleConfig.normalRecoveryGuidanceEnabled
                  ? "On"
                  : "Off"}
              </Text>
            </View>

            <Switch
              value={trainingScheduleConfig.normalRecoveryGuidanceEnabled}
              onValueChange={setNormalRecoveryGuidanceEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed="Coach recommends additional recovery when your recent training is more compressed than the program suggests."
            expanded="This is advice, not a training lock. You can still choose Train Anyway. Rest you have already taken is counted automatically, including full days between workouts."
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>
            Pain Recovery Minimum Rest
          </Text>

          <Text style={styles.scheduleSettingDescription}>
            Sets the minimum number of full rest days required before and
            between pain-recovery sessions.
          </Text>

          <View style={styles.scheduleStepperRow}>
            <Pressable
              disabled={!canDecreasePainRest}
              onPress={() => setPainMinimumRestDays(painRestDays - 1)}
              style={[
                styles.scheduleStepperButton,
                !canDecreasePainRest && styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decrease pain recovery minimum rest"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canDecreasePainRest &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                −
              </Text>
            </Pressable>

            <View style={styles.scheduleStepperValueBlock}>
              <Text style={styles.scheduleStepperValue}>{painRestDays}</Text>
              <Text style={styles.scheduleStepperUnit}>
                {painRestDays === 1 ? "day" : "days"}
              </Text>
            </View>

            <Pressable
              disabled={!canIncreasePainRest}
              onPress={() => setPainMinimumRestDays(painRestDays + 1)}
              style={[
                styles.scheduleStepperButton,
                !canIncreasePainRest && styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase pain recovery minimum rest"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canIncreasePainRest &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                +
              </Text>
            </Pressable>
          </View>

          <ExpandableHelp
            collapsed="Pain recovery uses mandatory minimum spacing. You may take more rest, but not less."
            expanded={`Pain-recovery scheduling is a safety rule rather than a normal training recommendation. The app never permits less than ${MINIMUM_PAIN_REST_DAYS} full rest days. Increasing this setting makes the minimum more conservative; extra rest is always allowed.`}
          />
        </View>

        <View style={styles.scheduleSafetyCard}>
          <Text style={styles.scheduleSafetyIcon}>🛡️</Text>

          <View style={styles.scheduleSafetyTextBlock}>
            <Text style={styles.scheduleSafetyTitle}>
              Pain recovery overrides normal scheduling preferences
            </Text>

            <Text style={styles.scheduleSafetyText}>
              Turning Normal Recovery Guidance off never removes a mandatory
              pain-recovery rest requirement.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleRestoreScheduleDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            RESTORE SCHEDULING DEFAULTS
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          Restores Normal Recovery Guidance to On and Pain Recovery Minimum Rest
          to {MINIMUM_PAIN_REST_DAYS} days.
        </Text>

        <Text style={styles.scheduleSettingsSectionTitle}>
          ADAPTIVE VOLUME
        </Text>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>Adaptive Volume</Text>

              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveVolumeConfig.enabled ? "On" : "Off"}
              </Text>
            </View>

            <Switch
              value={adaptiveVolumeConfig.enabled}
              onValueChange={setAdaptiveVolumeEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed="Allows the Coach to recommend small, evidence-based increases in training volume after consistently strong performance."
            expanded="Adaptive Volume uses your normal Match-or-Beat performance and Rating 4 or 5 feedback to build optional volume recommendations. Turning it off disables new adaptive set increases, optional-exercise offers and Adaptive Volume Coach reviews. It does not disable Match-or-Beat, readiness, deload, recovery or graduation."
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>Adaptive Start Week</Text>

          <Text style={styles.scheduleSettingDescription}>
            Choose the earliest program week in which Adaptive Volume may begin
            making recommendations.
          </Text>

          <View style={styles.scheduleStepperRow}>
            <Pressable
              disabled={!canDecreaseAdaptiveStart}
              onPress={() => setAdaptiveStartWeek(adaptiveStartWeek - 1)}
              style={[
                styles.scheduleStepperButton,
                !canDecreaseAdaptiveStart &&
                  styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decrease adaptive volume start week"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canDecreaseAdaptiveStart &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                −
              </Text>
            </Pressable>

            <View style={styles.scheduleStepperValueBlock}>
              <Text style={styles.scheduleStepperValue}>
                {adaptiveStartWeek}
              </Text>
              <Text style={styles.scheduleStepperUnit}>week</Text>
            </View>

            <Pressable
              disabled={!canIncreaseAdaptiveStart}
              onPress={() => setAdaptiveStartWeek(adaptiveStartWeek + 1)}
              style={[
                styles.scheduleStepperButton,
                !canIncreaseAdaptiveStart &&
                  styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase adaptive volume start week"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canIncreaseAdaptiveStart &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                +
              </Text>
            </Pressable>
          </View>

          <ExpandableHelp
            collapsed={`Default is Week 3. You can choose Week ${MINIMUM_ADAPTIVE_START_WEEK} through Week ${MAXIMUM_ADAPTIVE_START_WEEK}.`}
            expanded="Week 1 is reserved for establishing Match-or-Beat baselines and is never adaptive. Starting later gives the Coach more history before volume recommendations become available."
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>
            Qualifying Ratings Required
          </Text>

          <Text style={styles.scheduleSettingDescription}>
            Number of Rating 4 or 5 normal workouts required in the same week
            before Adaptive Volume recommendations become available.
          </Text>

          <View style={styles.scheduleStepperRow}>
            <Pressable
              disabled={!canDecreaseAdaptiveRatings}
              onPress={() =>
                setAdaptiveWeeklyQualifyingRatingCount(
                  adaptiveQualifyingRatings - 1,
                )
              }
              style={[
                styles.scheduleStepperButton,
                !canDecreaseAdaptiveRatings &&
                  styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decrease qualifying adaptive ratings"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canDecreaseAdaptiveRatings &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                −
              </Text>
            </Pressable>

            <View style={styles.scheduleStepperValueBlock}>
              <Text style={styles.scheduleStepperValue}>
                {adaptiveQualifyingRatings}
              </Text>
              <Text style={styles.scheduleStepperUnit}>
                {adaptiveQualifyingRatings === 1 ? "rating" : "ratings"}
              </Text>
            </View>

            <Pressable
              disabled={!canIncreaseAdaptiveRatings}
              onPress={() =>
                setAdaptiveWeeklyQualifyingRatingCount(
                  adaptiveQualifyingRatings + 1,
                )
              }
              style={[
                styles.scheduleStepperButton,
                !canIncreaseAdaptiveRatings &&
                  styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase qualifying adaptive ratings"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canIncreaseAdaptiveRatings &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                +
              </Text>
            </Pressable>
          </View>

          <ExpandableHelp
            collapsed={`For ${program.level}, the selectable range is ${MINIMUM_WEEKLY_QUALIFYING_RATINGS}–${maxAdaptiveQualifyingRatings} because this program has ${program.days.length} training days.`}
            expanded="The threshold is a weekly consistency gate, not a per-exercise target. Once the configured number of qualifying Rating 4/5 workouts has been reached, the Coach may offer day-specific volume changes supported by those workouts."
          />
        </View>

        <Pressable
          onPress={handleRestoreAdaptiveDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            RESTORE ADAPTIVE VOLUME DEFAULTS
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          Restores Adaptive Volume to On, Start Week to 3 and Qualifying
          Ratings Required to 2.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

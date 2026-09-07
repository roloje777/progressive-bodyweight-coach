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
import {
  MAXIMUM_BASE_REST_SECONDS,
  MAXIMUM_MAX_ADAPTIVE_REST_SECONDS,
  MINIMUM_REST_SECONDS,
  REST_STEP_SECONDS,
} from "@/config/AdaptiveRestConfig";
import { MAXIMUM_PAIN_REST_DAYS } from "@/context/TrainingScheduleSettingsContext";
import { useAdaptiveVolumeSettings } from "@/hooks/useAdaptiveVolumeSettings";
import { useAdaptiveRestSettings } from "@/hooks/useAdaptiveRestSettings";
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


type RestDurationSettingProps = {
  title: string;
  description: string;
  value: number;
  minimum: number;
  maximum: number;
  onChange: (seconds: number) => void;
};

function RestDurationSetting({
  title,
  description,
  value,
  minimum,
  maximum,
  onChange,
}: RestDurationSettingProps) {
  const canDecrease = value > minimum;
  const canIncrease = value < maximum;

  return (
    <View style={styles.scheduleSettingCard}>
      <Text style={styles.scheduleSettingTitle}>{title}</Text>
      <Text style={styles.scheduleSettingDescription}>{description}</Text>

      <View style={styles.scheduleStepperRow}>
        <Pressable
          disabled={!canDecrease}
          onPress={() => onChange(value - REST_STEP_SECONDS)}
          style={[
            styles.scheduleStepperButton,
            !canDecrease && styles.scheduleStepperButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.scheduleStepperButtonText,
              !canDecrease && styles.scheduleStepperButtonTextDisabled,
            ]}
          >
            −
          </Text>
        </Pressable>

        <View style={styles.scheduleStepperValueBlock}>
          <Text style={styles.scheduleStepperValue}>{value}</Text>
          <Text style={styles.scheduleStepperUnit}>seconds</Text>
        </View>

        <Pressable
          disabled={!canIncrease}
          onPress={() => onChange(value + REST_STEP_SECONDS)}
          style={[
            styles.scheduleStepperButton,
            !canIncrease && styles.scheduleStepperButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.scheduleStepperButtonText,
              !canIncrease && styles.scheduleStepperButtonTextDisabled,
            ]}
          >
            +
          </Text>
        </Pressable>
      </View>
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
    adaptiveRestConfig,
    isLoaded: isAdaptiveRestLoaded,
    setAdaptiveRestEnabled,
    setAdaptiveRestMode,
    setDefaultSetRestSeconds,
    setDefaultExerciseRestSeconds,
    setMaximumAdaptiveRestSeconds,
    setExerciseEffortRatingEnabled,
    restoreAdaptiveRestDefaults,
  } = useAdaptiveRestSettings();

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
    !isAdaptiveRestLoaded ||
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

  const handleRestoreAdaptiveRestDefaults = () => {
    restoreAdaptiveRestDefaults();
  };

  const minimumMaximumAdaptiveRest = Math.max(
    adaptiveRestConfig.defaultSetRestSeconds,
    adaptiveRestConfig.defaultExerciseRestSeconds,
  );

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

        <Text style={styles.scheduleSettingsSectionTitle}>ADAPTIVE REST</Text>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>Adaptive Rest</Text>
              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveRestConfig.enabled ? "On" : "Off"}
              </Text>
            </View>

            <Switch
              value={adaptiveRestConfig.enabled}
              onValueChange={setAdaptiveRestEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed="Starts from your configured rest defaults and only adds recovery when performance suggests it may be useful."
            expanded="Adaptive Rest never shortens the configured baseline. When it is Off, the same default set and exercise rest values are used throughout the workout. When it is On, the Coach may add recovery up to the configured maximum."
          />
        </View>

        <View
          style={[
            styles.scheduleSettingCard,
            !adaptiveRestConfig.enabled && { opacity: 0.45 },
          ]}
        >
          <Text style={styles.scheduleSettingTitle}>Adaptive Rest Mode</Text>
          <Text style={styles.scheduleSettingDescription}>
            Standard uses fixed V1 performance-drop rules. Personalized learns
            your normal performance and automatically falls back to Standard
            until at least three comparable workouts exist.
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 14,
            }}
          >
            {([
              { value: "standard" as const, label: "Standard" },
              { value: "personalized" as const, label: "Personalized" },
            ]).map((option) => {
              const selected = adaptiveRestConfig.mode === option.value;

              return (
                <Pressable
                  key={option.value}
                  disabled={!adaptiveRestConfig.enabled}
                  onPress={() => setAdaptiveRestMode(option.value)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: selected ? "#FFD700" : "#555",
                    backgroundColor: selected ? "#2a2a00" : "#222",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? "#FFD700" : "#ddd",
                      fontWeight: "700",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!adaptiveRestConfig.enabled && (
            <Text
              style={[
                styles.scheduleSettingDescription,
                { marginTop: 10 },
              ]}
            >
              Turn Adaptive Rest On to change the mode.
            </Text>
          )}
        </View>

        <RestDurationSetting
          title="Default Rest Between Sets"
          description="System-wide baseline recovery between working sets."
          value={adaptiveRestConfig.defaultSetRestSeconds}
          minimum={MINIMUM_REST_SECONDS}
          maximum={MAXIMUM_BASE_REST_SECONDS}
          onChange={setDefaultSetRestSeconds}
        />

        <RestDurationSetting
          title="Default Rest Between Exercises"
          description="System-wide baseline recovery after one exercise is completed."
          value={adaptiveRestConfig.defaultExerciseRestSeconds}
          minimum={MINIMUM_REST_SECONDS}
          maximum={MAXIMUM_BASE_REST_SECONDS}
          onChange={setDefaultExerciseRestSeconds}
        />

        <RestDurationSetting
          title="Maximum Adaptive Rest"
          description="Upper limit the Adaptive Rest Coach may prescribe."
          value={adaptiveRestConfig.maximumAdaptiveRestSeconds}
          minimum={minimumMaximumAdaptiveRest}
          maximum={MAXIMUM_MAX_ADAPTIVE_REST_SECONDS}
          onChange={setMaximumAdaptiveRestSeconds}
        />

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>Exercise Effort Rating</Text>
              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveRestConfig.exerciseEffortRatingEnabled ? "On" : "Off"}
              </Text>
            </View>

            <Switch
              value={adaptiveRestConfig.exerciseEffortRatingEnabled}
              onValueChange={setExerciseEffortRatingEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed="Ask for one quick Too Easy / About Right / Very Hard rating after each completed exercise."
            expanded="This is separate from the end-of-workout rating. Adaptive Rest can still operate from performance drop-off when this setting is Off."
          />
        </View>

        <Pressable
          onPress={handleRestoreAdaptiveRestDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            RESTORE ADAPTIVE REST DEFAULTS
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          Restores Adaptive Rest to On, mode to Personalized, set rest to 120
          seconds, exercise rest to 120 seconds, maximum adaptive rest to 180
          seconds and Exercise Effort Rating to On.
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

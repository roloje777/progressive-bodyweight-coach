// app/(tabs)/settings.tsx

import React, { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MAXIMUM_ADAPTIVE_START_WEEK,
  MINIMUM_ADAPTIVE_START_WEEK,
  MINIMUM_WEEKLY_QUALIFYING_RATINGS,
} from "@/config/AdaptiveVolumeConfig";
import { MINIMUM_PAIN_REST_DAYS } from "@/config/TrainingScheduleConfig";
import {
  formatTrainingCycle,
  getTrainingCycleForPreset,
  TRAINING_CYCLE_PRESET_OPTIONS,
} from "@/data/recommendedTrainingCycles";
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
import { useWorkoutRecoverySettings } from "@/hooks/useWorkoutRecoverySettings";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";

type ExpandableHelpProps = {
  collapsed: string;
  expanded: string;
};

function ExpandableHelp({ collapsed, expanded }: ExpandableHelpProps) {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <View>
      <Text style={styles.scheduleSettingDescription}>{collapsed}</Text>

      <Pressable
        onPress={() => setIsExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? t("settings.help.showLessA11y") : t("settings.help.learnMoreA11y")}
      >
        <Text style={styles.scheduleLearnMore}>
          {isExpanded ? t("settings.help.showLess") : t("settings.help.learnMore")}
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
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { t } = useTranslation();
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
          <Text style={styles.scheduleStepperUnit}>{t("settings.units.seconds")}</Text>
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

export default function SettingsSectionScreen() {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const router = useRouter();
  const { t, language } = useTranslation();
  const params = useLocalSearchParams<{ section?: string }>();
  const section = Array.isArray(params.section) ? params.section[0] : params.section;

  const sectionTitle =
    section === "general"
      ? t("settings.general.title")
      : section === "training-schedule"
      ? t("settings.trainingSchedule.title")
      : section === "adaptive-rest"
        ? t("settings.adaptiveRest.title")
        : section === "adaptive-volume"
          ? t("settings.adaptiveVolume.title")
          : section === "workout-recovery"
            ? t("settings.workoutRecovery.title")
            : t("settings.title");
  const {
    trainingScheduleConfig,
    isLoaded: isTrainingScheduleLoaded,
    setNormalRecoveryGuidanceEnabled,
    setTrainingCyclePresetId,
    setPainMinimumRestDays,
    restoreTrainingScheduleDefaults,
  } = useTrainingScheduleSettings();

  const {
    adaptiveRestConfig,
    isLoaded: isAdaptiveRestLoaded,
    setAdaptiveRestEnabled,
    setAdaptiveRestMode,
    setRestBetweenSetsEnabled,
    setRestBetweenExercisesEnabled,
    setDefaultSetRestSeconds,
    setDefaultExerciseRestSeconds,
    setMaximumAdaptiveRestSeconds,
    setExerciseEffortRatingEnabled,
    restoreAdaptiveRestDefaults,
  } = useAdaptiveRestSettings();

  const {
    workoutRecoveryConfig,
    isLoaded: isWorkoutRecoveryLoaded,
    setWorkoutRecoveryEnabled,
    setAutoOfferRecovery,
    setShowPerformanceGuidance,
    setWarnUnusualRecoveredResults,
    setUseRecoveredDataForProgression,
    restoreWorkoutRecoveryDefaults,
  } = useWorkoutRecoverySettings();

  const {
    adaptiveVolumeConfig,
    isLoaded: isAdaptiveVolumeLoaded,
    setAdaptiveVolumeEnabled,
    setAdaptiveStartWeek,
    setAdaptiveWeeklyQualifyingRatingCount,
    restoreAdaptiveVolumeDefaults,
  } = useAdaptiveVolumeSettings();

  const {
    generalSettings,
    isLoaded: isGeneralSettingsLoaded,
    setContextualTipsEnabled,
    resetContextualTip,
    setWeek1BaselineCoachEnabled,
    setPreventBackNavigationDuringWorkout,
    setThemePreference,
    setLanguagePreference,
    restoreGeneralDefaults,
  } = useGeneralSettings();

  const { program, isLoaded: isProgressLoaded } = useProgress();

  if (
    !isGeneralSettingsLoaded ||
    !isTrainingScheduleLoaded ||
    !isAdaptiveRestLoaded ||
    !isAdaptiveVolumeLoaded ||
    !isWorkoutRecoveryLoaded ||
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
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.scheduleSettingsScreen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scheduleSettingsContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("settings.back").replace("‹ ", "")}
          style={{ alignSelf: "flex-start", paddingVertical: 6, marginBottom: 6 }}
        >
          <Text style={{ color: palette.primary, fontWeight: "700" }}>{t("settings.back")}</Text>
        </Pressable>

        <Text style={styles.scheduleSettingsTitle}>{sectionTitle}</Text>


        {section === "general" && (<>
          <View style={styles.scheduleSettingCard}>
            <Text style={styles.scheduleSettingTitle}>{t("settings.language.title")}</Text>
            <Text style={styles.scheduleSettingDescription}>
              {t("settings.language.description")}
            </Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {([
                { value: "system" as const, label: t("settings.language.system") },
                { value: "en" as const, label: t("settings.language.english") },
                { value: "pt-PT" as const, label: t("settings.language.portuguesePortugal") },
              ]).map((option) => {
                const selected = generalSettings.languagePreference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setLanguagePreference(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? palette.primary : palette.border,
                      backgroundColor: selected ? palette.primarySoft : palette.surface,
                    }}
                  >
                    <Text style={{ color: selected ? palette.primaryText : palette.text, fontWeight: "700" }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.scheduleSettingValueLabel, { marginTop: 10 }]}>
              {t("settings.language.current")}: {language === "pt-PT" ? t("settings.language.portuguesePortugal") : t("settings.language.english")}
            </Text>
          </View>

          <View style={styles.scheduleSettingCard}>
            <Text style={styles.scheduleSettingTitle}>{t("settings.theme.title")}</Text>
            <Text style={styles.scheduleSettingDescription}>
              {t("settings.theme.description")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              {([
                { value: "system" as const, label: t("settings.theme.system"), icon: "settings-outline" as const },
                { value: "light" as const, label: t("settings.theme.light"), icon: "sunny-outline" as const },
                { value: "dark" as const, label: t("settings.theme.dark"), icon: "moon-outline" as const },
              ]).map((option) => {
                const selected = generalSettings.themePreference === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setThemePreference(option.value)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected }}
                    style={[
                      styles.scheduleStepperButton,
                      { flex: 1, minWidth: 0, minHeight: 64, paddingHorizontal: 4, paddingVertical: 8, gap: 4, opacity: selected ? 1 : 0.65 },
                      selected && { borderWidth: 2, borderColor: palette.primary },
                    ]}
                  >
                    <Ionicons name={option.icon} size={22} color={selected ? palette.primary : palette.textMuted} />
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.scheduleStepperButtonText, { flexShrink: 1, textAlign: "center", fontSize: 13 }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.scheduleSettingValueLabel, { marginTop: 10 }]}>
              {t("settings.theme.current")}: {generalSettings.themePreference === "system" ? t("settings.theme.system") : generalSettings.themePreference === "light" ? t("settings.theme.light") : t("settings.theme.dark")}
            </Text>
          </View>
          <View style={styles.scheduleSettingCard}>
            <View style={styles.scheduleSettingHeaderRow}>
              <View style={styles.scheduleSettingHeaderText}>
                <Text style={styles.scheduleSettingTitle}>{t("settings.guidance.title")}</Text>
                <Text style={styles.scheduleSettingValueLabel}>
                  {generalSettings.contextualTipsEnabled ? t("settings.common.on") : t("settings.common.off")}
                </Text>
              </View>
              <Switch
                value={generalSettings.contextualTipsEnabled}
                onValueChange={setContextualTipsEnabled}
              />
            </View>
            <ExpandableHelp
              collapsed={t("settings.guidance.collapsed")}
              expanded={t("settings.guidance.expanded")}
            />

            <Pressable
              onPress={() => resetContextualTip("welcome")}
              accessibilityRole="button"
              accessibilityLabel="Replay Welcome to PBH guide on Home"
              style={{ marginTop: 14, paddingVertical: 10 }}
            >
              <Text style={[styles.scheduleSettingTitle, { color: palette.primary }]}>{t("settings.guidance.replayWelcome")}</Text>
              <Text style={styles.scheduleSettingDescription}>
                {t("settings.guidance.replayWelcomeDescription")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.scheduleSettingCard}>
            <View style={styles.scheduleSettingHeaderRow}>
              <View style={styles.scheduleSettingHeaderText}>
                <Text style={styles.scheduleSettingTitle}>{t("settings.baseline.title")}</Text>
                <Text style={styles.scheduleSettingValueLabel}>
                  {generalSettings.week1BaselineCoachEnabled ? t("settings.common.on") : t("settings.common.off")}
                </Text>
              </View>
              <Switch
                value={generalSettings.week1BaselineCoachEnabled}
                onValueChange={setWeek1BaselineCoachEnabled}
              />
            </View>
            <ExpandableHelp
              collapsed={t("settings.baseline.collapsed")}
              expanded={t("settings.baseline.expanded")}
            />
          </View>

          <View style={styles.scheduleSettingCard}>
            <View style={styles.scheduleSettingHeaderRow}>
              <View style={styles.scheduleSettingHeaderText}>
                <Text style={styles.scheduleSettingTitle}>{t("settings.backNavigation.title")}</Text>
                <Text style={styles.scheduleSettingValueLabel}>
                  {generalSettings.preventBackNavigationDuringWorkout ? t("settings.common.on") : t("settings.common.off")}
                </Text>
              </View>
              <Switch
                value={generalSettings.preventBackNavigationDuringWorkout}
                onValueChange={setPreventBackNavigationDuringWorkout}
              />
            </View>
            <ExpandableHelp
              collapsed={t("settings.backNavigation.collapsed")}
              expanded={t("settings.backNavigation.expanded")}
            />
          </View>

          <Pressable
            onPress={restoreGeneralDefaults}
            style={styles.scheduleSettingCard}
            accessibilityRole="button"
          >
            <Text style={[styles.scheduleSettingTitle, { color: palette.primary }]}>{t("settings.restore.title")}</Text>
            <Text style={styles.scheduleSettingDescription}>{t("settings.restore.description")}</Text>
          </Pressable>
        </>)}

        {section === "training-schedule" && (<>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>
                {t("settings.schedule.normalRecovery")}
              </Text>

              <Text style={styles.scheduleSettingValueLabel}>
                {trainingScheduleConfig.normalRecoveryGuidanceEnabled
                  ? t("settings.common.on")
                  : t("settings.common.off")}
              </Text>
            </View>

            <Switch
              value={trainingScheduleConfig.normalRecoveryGuidanceEnabled}
              onValueChange={setNormalRecoveryGuidanceEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed={t("settings.schedule.normalRecoveryCollapsed")}
            expanded={t("settings.schedule.normalRecoveryExpanded")}
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>{t("settings.schedule.trainingCycle")}</Text>

          <Text style={styles.scheduleSettingDescription}>{t("settings.schedule.trainingCycleDescription")}</Text>

          <View style={{ gap: 10, marginTop: 14 }}>
            {TRAINING_CYCLE_PRESET_OPTIONS.map((option) => {
              const selected =
                trainingScheduleConfig.trainingCyclePresetId === option.id;

              const optionCycle = getTrainingCycleForPreset({
                presetId: option.id,
                programDefaultCycle: program.recommendedCycle,
                programDayCount: program.days.length,
              });

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setTrainingCyclePresetId(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: selected ? palette.primary : palette.border,
                    backgroundColor: selected ? palette.primarySoft : palette.surface,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? palette.primaryText : palette.text,
                        fontWeight: "700",
                        flex: 1,
                      }}
                    >
                      {t(`settings.schedule.preset.${option.id}.name` as any)}
                    </Text>

                    <Text
                      style={{
                        color: selected ? palette.primaryText : palette.textMuted,
                        fontWeight: "600",
                      }}
                    >
                      {t("settings.schedule.workoutsSlots", { workouts: program.days.length, slots: optionCycle.slots.length })}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.scheduleSettingDescription,
                      { marginTop: 6, color: selected ? palette.primaryText : palette.textMuted },
                    ]}
                  >
                    {t(`settings.schedule.preset.${option.id}.description` as any)}
                  </Text>

                  <Text
                    style={{
                      color: selected ? palette.primaryText : palette.textMuted,
                      marginTop: 7,
                      lineHeight: 18,
                    }}
                  >
                    {formatTrainingCycle(optionCycle).replaceAll("Rest", t("settings.schedule.restSlot"))}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ExpandableHelp
            collapsed={t("settings.schedule.cycleCollapsed")}
            expanded={t("settings.schedule.cycleExpanded")}
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>{t("settings.schedule.painMinimumRest")}</Text>

          <Text style={styles.scheduleSettingDescription}>{t("settings.schedule.painMinimumRestDescription")}</Text>

          <View style={styles.scheduleStepperRow}>
            <Pressable
              disabled={!canDecreasePainRest}
              onPress={() => setPainMinimumRestDays(painRestDays - 1)}
              style={[
                styles.scheduleStepperButton,
                !canDecreasePainRest && styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("settings.schedule.decreasePainRest")}
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
                {painRestDays === 1 ? t("settings.units.day") : t("settings.units.days")}
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
              accessibilityLabel={t("settings.schedule.increasePainRest")}
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
            collapsed={t("settings.schedule.painCollapsed")}
            expanded={t("settings.schedule.painExpanded", { days: MINIMUM_PAIN_REST_DAYS })}
          />
        </View>

        <View style={styles.scheduleSafetyCard}>
          <Text style={styles.scheduleSafetyIcon}>🛡️</Text>

          <View style={styles.scheduleSafetyTextBlock}>
            <Text style={styles.scheduleSafetyTitle}>
              {t("settings.schedule.painOverridesTitle")}
            </Text>

            <Text style={styles.scheduleSafetyText}>
              {t("settings.schedule.painOverridesText")}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleRestoreScheduleDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            {t("settings.schedule.restore")}
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          {t("settings.schedule.restoreNote", { days: MINIMUM_PAIN_REST_DAYS })}
        </Text>

        </>)}

        {section === "adaptive-rest" && (<>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>{t("settings.adaptiveRest.title")}</Text>
              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveRestConfig.enabled ? t("settings.common.on") : t("settings.common.off")}
              </Text>
            </View>

            <Switch
              value={adaptiveRestConfig.enabled}
              onValueChange={setAdaptiveRestEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed={t("settings.rest.collapsed")}
            expanded={t("settings.rest.expanded")}
          />
        </View>

        <View
          style={[
            styles.scheduleSettingCard,
            !adaptiveRestConfig.enabled && { opacity: 0.45 },
          ]}
        >
          <Text style={styles.scheduleSettingTitle}>{t("settings.rest.mode")}</Text>
          <Text style={styles.scheduleSettingDescription}>{t("settings.rest.modeDescription")}</Text>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 14,
            }}
          >
            {([
              { value: "standard" as const, label: t("settings.rest.standard") },
              { value: "personalized" as const, label: t("settings.rest.personalized") },
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
                    borderColor: selected ? palette.primary : palette.border,
                    backgroundColor: selected ? palette.primarySoft : palette.surface,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? palette.primaryText : palette.textMuted,
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
              {t("settings.rest.turnOnToChange")}
            </Text>
          )}
        </View>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>{t("settings.rest.betweenSets")}</Text>
              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveRestConfig.restBetweenSetsEnabled ? t("settings.common.on") : t("settings.common.off")}
              </Text>
            </View>

            <Switch
              value={adaptiveRestConfig.restBetweenSetsEnabled}
              onValueChange={setRestBetweenSetsEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed={t("settings.rest.betweenSetsCollapsed")}
            expanded={t("settings.rest.betweenSetsExpanded")}
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>{t("settings.rest.betweenExercises")}</Text>
              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveRestConfig.restBetweenExercisesEnabled ? t("settings.common.on") : t("settings.common.off")}
              </Text>
            </View>

            <Switch
              value={adaptiveRestConfig.restBetweenExercisesEnabled}
              onValueChange={setRestBetweenExercisesEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed={t("settings.rest.betweenExercisesCollapsed")}
            expanded={t("settings.rest.betweenExercisesExpanded")}
          />
        </View>

        <RestDurationSetting
          title={t("settings.rest.defaultSets")}
          description={t("settings.rest.defaultSetsDescription")}
          value={adaptiveRestConfig.defaultSetRestSeconds}
          minimum={MINIMUM_REST_SECONDS}
          maximum={MAXIMUM_BASE_REST_SECONDS}
          onChange={setDefaultSetRestSeconds}
        />

        <RestDurationSetting
          title={t("settings.rest.defaultExercises")}
          description={t("settings.rest.defaultExercisesDescription")}
          value={adaptiveRestConfig.defaultExerciseRestSeconds}
          minimum={MINIMUM_REST_SECONDS}
          maximum={MAXIMUM_BASE_REST_SECONDS}
          onChange={setDefaultExerciseRestSeconds}
        />

        <RestDurationSetting
          title={t("settings.rest.maximum")}
          description={t("settings.rest.maximumDescription")}
          value={adaptiveRestConfig.maximumAdaptiveRestSeconds}
          minimum={minimumMaximumAdaptiveRest}
          maximum={MAXIMUM_MAX_ADAPTIVE_REST_SECONDS}
          onChange={setMaximumAdaptiveRestSeconds}
        />

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>{t("settings.rest.effortRating")}</Text>
              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveRestConfig.exerciseEffortRatingEnabled ? t("settings.common.on") : t("settings.common.off")}
              </Text>
            </View>

            <Switch
              value={adaptiveRestConfig.exerciseEffortRatingEnabled}
              onValueChange={setExerciseEffortRatingEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed={t("settings.rest.effortCollapsed")}
            expanded={t("settings.rest.effortExpanded")}
          />
        </View>

        <Pressable
          onPress={handleRestoreAdaptiveRestDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            {t("settings.rest.restore")}
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          {t("settings.rest.restoreNote")}
        </Text>

        </>)}

        {section === "adaptive-volume" && (<>

        <View style={styles.scheduleSettingCard}>
          <View style={styles.scheduleSettingHeaderRow}>
            <View style={styles.scheduleSettingHeaderText}>
              <Text style={styles.scheduleSettingTitle}>{t("settings.adaptiveVolume.title")}</Text>

              <Text style={styles.scheduleSettingValueLabel}>
                {adaptiveVolumeConfig.enabled ? t("settings.common.on") : t("settings.common.off")}
              </Text>
            </View>

            <Switch
              value={adaptiveVolumeConfig.enabled}
              onValueChange={setAdaptiveVolumeEnabled}
            />
          </View>

          <ExpandableHelp
            collapsed={t("settings.volume.collapsed")}
            expanded={t("settings.volume.expanded")}
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>{t("settings.volume.startWeek")}</Text>

          <Text style={styles.scheduleSettingDescription}>{t("settings.volume.startWeekDescription")}</Text>

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
              accessibilityLabel={t("settings.volume.decreaseStartWeek")}
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
              <Text style={styles.scheduleStepperUnit}>{t("settings.units.week")}</Text>
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
              accessibilityLabel={t("settings.volume.increaseStartWeek")}
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
            collapsed={t("settings.volume.startWeekCollapsed", { min: MINIMUM_ADAPTIVE_START_WEEK, max: MAXIMUM_ADAPTIVE_START_WEEK })}
            expanded={t("settings.volume.startWeekExpanded")}
          />
        </View>

        <View style={styles.scheduleSettingCard}>
          <Text style={styles.scheduleSettingTitle}>
            {t("settings.volume.qualifyingRatings")}
          </Text>

          <Text style={styles.scheduleSettingDescription}>{t("settings.volume.qualifyingDescription")}</Text>

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
              accessibilityLabel={t("settings.volume.decreaseRatings")}
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
                {adaptiveQualifyingRatings === 1 ? t("settings.units.rating") : t("settings.units.ratings")}
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
              accessibilityLabel={t("settings.volume.increaseRatings")}
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
            collapsed={t("settings.volume.qualifyingCollapsed", { level: program.level, min: MINIMUM_WEEKLY_QUALIFYING_RATINGS, max: maxAdaptiveQualifyingRatings, days: program.days.length })}
            expanded={t("settings.volume.qualifyingExpanded")}
          />
        </View>

        <Pressable
          onPress={handleRestoreAdaptiveDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            {t("settings.volume.restore")}
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          {t("settings.volume.restoreNote")}
        </Text>
        </>)}

        {section === "workout-recovery" && (<>

        {[
          [t("settings.recovery.enabled"), t("settings.recovery.enabledDescription"), workoutRecoveryConfig.enabled, setWorkoutRecoveryEnabled],
          [t("settings.recovery.autoOffer"), t("settings.recovery.autoOfferDescription"), workoutRecoveryConfig.autoOfferRecovery, setAutoOfferRecovery],
          [t("settings.recovery.performanceGuidance"), t("settings.recovery.performanceGuidanceDescription"), workoutRecoveryConfig.showPerformanceGuidance, setShowPerformanceGuidance],
          [t("settings.recovery.warnUnusual"), t("settings.recovery.warnUnusualDescription"), workoutRecoveryConfig.warnUnusualRecoveredResults, setWarnUnusualRecoveredResults],
          [t("settings.recovery.useProgression"), t("settings.recovery.useProgressionDescription"), workoutRecoveryConfig.useRecoveredDataForProgression, setUseRecoveredDataForProgression],
        ].map(([title, description, value, setter]: any) => (
          <View key={title} style={styles.scheduleSettingCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleSettingTitle}>{title}</Text>
                <Text style={styles.scheduleSettingDescription}>{description}</Text>
              </View>
              <Switch value={value} onValueChange={setter} />
            </View>
          </View>
        ))}

        <Pressable
          onPress={restoreWorkoutRecoveryDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>{t("settings.recovery.restore")}</Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          {t("settings.recovery.restoreNote")}
        </Text>
        </>)}
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

// app/(tabs)/settings.tsx

import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MINIMUM_PAIN_REST_DAYS,
} from "@/config/TrainingScheduleConfig";
import {
  MAXIMUM_PAIN_REST_DAYS,
} from "@/context/TrainingScheduleSettingsContext";
import { useTrainingScheduleSettings } from "@/hooks/useTrainingScheduleSettings";
import { appStyles as styles } from "@/styles/appStyles";

type ExpandableHelpProps = {
  collapsed: string;
  expanded: string;
};

function ExpandableHelp({
  collapsed,
  expanded,
}: ExpandableHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View>
      <Text style={styles.scheduleSettingDescription}>{collapsed}</Text>

      <Pressable
        onPress={() => setIsExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={
          isExpanded ? "Show less information" : "Learn more"
        }
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
    isLoaded,
    setNormalRecoveryGuidanceEnabled,
    setPainMinimumRestDays,
    restoreTrainingScheduleDefaults,
  } = useTrainingScheduleSettings();

  if (!isLoaded) {
    return <SafeAreaView style={styles.scheduleSettingsScreen} />;
  }

  const painRestDays = trainingScheduleConfig.painMinimumRestDays;
  const canDecrease = painRestDays > MINIMUM_PAIN_REST_DAYS;
  const canIncrease = painRestDays < MAXIMUM_PAIN_REST_DAYS;

  const handleRestoreDefaults = () => {
  restoreTrainingScheduleDefaults();
};

  return (
    <SafeAreaView
      style={styles.scheduleSettingsScreen}
      edges={["top"]}
    >
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
              value={
                trainingScheduleConfig.normalRecoveryGuidanceEnabled
              }
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
            Sets the minimum number of full rest days required before
            and between pain-recovery sessions.
          </Text>

          <View style={styles.scheduleStepperRow}>
            <Pressable
              disabled={!canDecrease}
              onPress={() =>
                setPainMinimumRestDays(painRestDays - 1)
              }
              style={[
                styles.scheduleStepperButton,
                !canDecrease &&
                  styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decrease pain recovery minimum rest"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canDecrease &&
                    styles.scheduleStepperButtonTextDisabled,
                ]}
              >
                −
              </Text>
            </Pressable>

            <View style={styles.scheduleStepperValueBlock}>
              <Text style={styles.scheduleStepperValue}>
                {painRestDays}
              </Text>
              <Text style={styles.scheduleStepperUnit}>
                {painRestDays === 1 ? "day" : "days"}
              </Text>
            </View>

            <Pressable
              disabled={!canIncrease}
              onPress={() =>
                setPainMinimumRestDays(painRestDays + 1)
              }
              style={[
                styles.scheduleStepperButton,
                !canIncrease &&
                  styles.scheduleStepperButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase pain recovery minimum rest"
            >
              <Text
                style={[
                  styles.scheduleStepperButtonText,
                  !canIncrease &&
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
              Turning Normal Recovery Guidance off never removes a
              mandatory pain-recovery rest requirement.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleRestoreDefaults}
          style={styles.scheduleRestoreButton}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleRestoreButtonText}>
            RESTORE SCHEDULING DEFAULTS
          </Text>
        </Pressable>

        <Text style={styles.scheduleRestoreNote}>
          Restores Normal Recovery Guidance to On and Pain Recovery
          Minimum Rest to {MINIMUM_PAIN_REST_DAYS} days.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

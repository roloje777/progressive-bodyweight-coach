import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGeneralSettings } from "@/context/GeneralSettingsContext";

type HelpTopicProps = {
  title: string;
  children: React.ReactNode;
};

function HelpTopic({ title, children }: HelpTopicProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.topicHeader}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={24}
          color="#9CA3AF"
        />
      </Pressable>
      {open ? <View style={styles.topicBody}>{children}</View> : null}
    </View>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export default function HelpAboutScreen() {
  const router = useRouter();
  const { setWeek1BaselineCoachEnabled } = useGeneralSettings();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const resetHelpTips = () => {
    Alert.alert(
      "Reset Help & Onboarding Tips?",
      "Previously dismissed onboarding guidance will be available again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            setWeek1BaselineCoachEnabled(true);
            Alert.alert("Help tips reset", "Week 1 guidance has been re-enabled.");
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to settings"
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Settings</Text>
          </Pressable>

          <Text style={styles.title}>Help & About</Text>
          <Text style={styles.intro}>
            Quick guidance for training with PBH, common questions, support information and app details.
          </Text>

          <Text style={styles.sectionLabel}>GETTING STARTED</Text>
          <HelpTopic title="How PBH works">
            <BodyText>
              PBH combines a structured bodyweight hypertrophy program with personal performance targets and adaptive coaching. Your recorded training and feedback help PBH guide future workouts.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Your first week">
            <BodyText>
              Week 1 establishes your current exercise ability. Use good, controlled form and work close to your current maximum for repetitions or holds without sacrificing technique.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Match or Beat targets">
            <BodyText>
              Match or Beat is your personal target based on suitable previous training. Aim to equal or improve it while maintaining good form. If there is not enough history yet, PBH can use the exercise's starting target.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Workout ratings & feedback">
            <BodyText>
              Your rating and feedback help PBH understand how the workout went. Choose the answer that best reflects the session rather than the answer you think will produce a particular coaching result.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Rest & recovery">
            <BodyText>
              PBH can recommend recovery days and adapt rest periods. Normal recovery guidance is advisory, while pain-related recovery may require additional rest before normal training resumes.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Adaptive training">
            <BodyText>
              Adaptive Rest can adjust recovery time between efforts. Adaptive Volume can suggest additional sets or optional exercises when your recent training provides qualifying evidence.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Pain & recovery">
            <BodyText>
              If you report joint discomfort, PBH asks follow-up questions and may guide you toward recovery. PBH does not diagnose injuries or replace advice from a qualified healthcare professional.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Progressing through PBH">
            <BodyText>
              PBH progresses through Foundation, Growth and Max Hypertrophy using your training evidence. Reaching the end of a week or program does not by itself guarantee progression.
            </BodyText>
          </HelpTopic>

          <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
          <HelpTopic title="Why don't I have a Match or Beat target yet?">
            <BodyText>
              PBH may still be building a valid baseline for that exercise or set. Complete the exercise with good form and record your result so future workouts have useful performance history.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Should I sacrifice form to beat my target?">
            <BodyText>
              No. Match or Beat targets are training goals, not requirements. Maintain controlled technique and stop the set when you can no longer perform the exercise with good form.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Do I have to train on the recommended days?">
            <BodyText>
              Normal training schedules are guidance rather than a fixed calendar. PBH may recommend recovery, while your configured schedule determines how much flexibility is available.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Why is PBH recommending a recovery day?">
            <BodyText>
              Recovery guidance can come from your training schedule or from workout feedback. Pain-related recovery is handled more cautiously than an ordinary scheduled rest recommendation.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Why has PBH suggested a deload?">
            <BodyText>
              A deload reduces training demand when recovery evidence indicates that normal loading is not appropriate. Deload performance is kept separate from the healthy history used to establish future Match or Beat targets.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="What is a verification workout?">
            <BodyText>
              A verification workout is used after a deload to check how you respond before normal progression continues. It uses reduced targets compared with the healthy pre-deload workout.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="How does Adaptive Rest work?">
            <BodyText>
              Adaptive Rest looks at how performance changes between sets and recommends an appropriate rest period. Personalized mode can use your comparable training history once enough suitable history exists.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Why did PBH suggest more sets or exercises?">
            <BodyText>
              Adaptive Volume can offer additional work after enough qualifying workouts indicate that you may be ready for more volume. The recommendation remains under your control.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="What if I close the app during a workout?">
            <BodyText>
              When Workout Recovery is enabled, PBH can offer to restore a valid interrupted workout. Time spent with the app closed or in the background is not treated as active training time.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="When do I progress to the next program?">
            <BodyText>
              Progression uses suitable training evidence from comparison weeks. Week 1 establishes the baseline, and PBH evaluates later performance before recommending progression or another coaching pathway.
            </BodyText>
          </HelpTopic>

          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Need help?</Text>
            <Text style={styles.body}>
              Support contact details can be added here when a support email address or online help page is configured.
            </Text>
            <Text style={styles.meta}>App version {version}</Text>
          </View>

          <Pressable
            onPress={resetHelpTips}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <MaterialIcons name="restart-alt" size={24} color="#A7F3D0" />
            <View style={styles.actionText}>
              <Text style={styles.cardTitle}>Reset Help & Onboarding Tips</Text>
              <Text style={styles.body}>Show previously dismissed introductory guidance again.</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>ABOUT PBH</Text>
          <View style={[styles.card, styles.aboutCard]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>PBH</Text>
            </View>
            <Text style={styles.aboutTitle}>Progressive Bodyweight Hypertrophy Coach</Text>
            <Text style={styles.meta}>Version {version}</Text>
            <Text style={[styles.body, styles.centerText]}>
              A progressive bodyweight hypertrophy training application built around structured training, personal performance targets and adaptive coaching.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.metaLabel}>DEVELOPED & AUTHORED BY</Text>
            <Text style={styles.author}>João Emanuel Monica Rolo</Text>
          </View>

          <HelpTopic title="Health & Exercise Disclaimer">
            <BodyText>
              PBH provides general exercise and training guidance. It does not diagnose, treat or prevent injuries or medical conditions. Stop exercising if you experience concerning symptoms and seek appropriate professional medical advice when needed.
            </BodyText>
          </HelpTopic>
          <HelpTopic title="Privacy, Terms & Licences">
            <BodyText>
              Privacy Policy, Terms of Use and open-source licence links should be connected here before public distribution when their final documents or destinations are available.
            </BodyText>
          </HelpTopic>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07100B" },
  content: { padding: 18, paddingBottom: 44 },
  backButton: { alignSelf: "flex-start", paddingVertical: 6, marginBottom: 6 },
  backText: { color: "#FFD700", fontWeight: "700", fontSize: 15 },
  title: { color: "#FFFFFF", fontSize: 30, fontWeight: "800" },
  intro: { color: "#B7C0BA", fontSize: 15, lineHeight: 21, marginTop: 7, marginBottom: 18 },
  sectionLabel: { color: "#8BEA9A", fontSize: 12, fontWeight: "800", letterSpacing: 1.1, marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: "#111A14", borderWidth: 1, borderColor: "#26332A", borderRadius: 14, padding: 15, marginBottom: 10 },
  topicHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  topicBody: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#344139" },
  cardTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", flex: 1 },
  body: { color: "#C5CDC8", fontSize: 14, lineHeight: 20 },
  meta: { color: "#8D9891", fontSize: 13, marginTop: 10 },
  actionCard: { backgroundColor: "#111A14", borderWidth: 1, borderColor: "#26332A", borderRadius: 14, padding: 15, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  actionText: { flex: 1, gap: 3 },
  pressed: { opacity: 0.72 },
  chevron: { color: "#9CA3AF", fontSize: 25 },
  aboutCard: { alignItems: "center", paddingVertical: 22 },
  logoMark: { width: 74, height: 74, borderRadius: 22, backgroundColor: "#102719", borderWidth: 1, borderColor: "#42E55F", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoText: { color: "#55F06B", fontSize: 25, fontWeight: "900", letterSpacing: 1 },
  aboutTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", textAlign: "center", lineHeight: 25 },
  centerText: { textAlign: "center", marginTop: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#344139", width: "100%", marginVertical: 18 },
  metaLabel: { color: "#8BEA9A", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  author: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 5 },
});

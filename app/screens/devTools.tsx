import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, Stack, useRouter } from "expo-router";

import CoachingScenarioTest from "@/dev-tools/screens/tests/CoachingScenarioTest";
import LiveProgramPositionTest from "@/dev-tools/screens/tests/LiveProgramPositionTest";
import ProgramEngineTestScreen from "@/dev-tools/screens/tests/ProgramEngineTestScreen";
import WorkoutRecoveryDiagnostics from "@/dev-tools/screens/tests/WorkoutRecoveryDiagnostics";
import WorkoutRecoveryLifecycleScenarioTest from "@/dev-tools/screens/tests/WorkoutRecoveryLifecycleScenarioTest";
import WorkoutRecoveryProgressionTest from "@/dev-tools/screens/tests/WorkoutRecoveryProgressionTest";
import WorkoutRecoveryV22TimerScenarioTest from "@/dev-tools/screens/tests/WorkoutRecoveryV22TimerScenarioTest";
import WorkoutRecoveryV23IntegrityTest from "@/dev-tools/screens/tests/WorkoutRecoveryV23IntegrityTest";
import WorkoutRecoveryV24Test from "@/dev-tools/screens/tests/WorkoutRecoveryV24Test";
import DebugProgress from "@/dev-tools/screens/tests/debugProgress";
import ExerciseGuidesTestScreen from "@/dev-tools/screens/tests/exerciseGuidesTest";
import SoundManagerTest from "@/dev-tools/screens/tests/testSoundManager";

type Tool = {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
};

const TOOLS: Tool[] = [
  { id: "live-position", title: "Live Program Position", description: "Seed realistic program states by level, week and day.", component: LiveProgramPositionTest },
  { id: "coaching", title: "Coaching Scenarios", description: "Exercise coaching and feedback scenarios.", component: CoachingScenarioTest },
  { id: "program-engine", title: "Program Engine", description: "Interactive program-engine checks.", component: ProgramEngineTestScreen },
  { id: "recovery-diagnostics", title: "Recovery Diagnostics", description: "Inspect workout-recovery state and diagnostics.", component: WorkoutRecoveryDiagnostics },
  { id: "recovery-lifecycle", title: "Recovery Lifecycle", description: "Run recovery lifecycle scenarios.", component: WorkoutRecoveryLifecycleScenarioTest },
  { id: "recovery-progression", title: "Recovery Progression", description: "Test recovery progression behaviour.", component: WorkoutRecoveryProgressionTest },
  { id: "recovery-v22", title: "Recovery Timer Scenario", description: "Recovery timer scenario checks.", component: WorkoutRecoveryV22TimerScenarioTest },
  { id: "recovery-v23", title: "Recovery Integrity", description: "Recovery integrity checks.", component: WorkoutRecoveryV23IntegrityTest },
  { id: "recovery-v24", title: "Recovery V24", description: "Latest recovery scenario checks.", component: WorkoutRecoveryV24Test },
  { id: "debug-progress", title: "Progress Debugger", description: "Inspect current stored progress state.", component: DebugProgress },
  { id: "exercise-guides", title: "Exercise Guides", description: "Review exercise-guide coverage and links.", component: ExerciseGuidesTestScreen },
  { id: "sound-manager", title: "Sound Manager", description: "Run audio prompt tests.", component: SoundManagerTest },
];

export default function DevToolsScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  const selected = TOOLS.find((tool) => tool.id === selectedId);
  if (selected) {
    const ToolComponent = selected.component;
    return <ToolComponent />;
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>PBH Developer Tools</Text>
        <Text style={styles.subtitle}>Development build only • Long-press the progress header to return here.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {TOOLS.map((tool) => (
          <Pressable key={tool.id} style={styles.card} onPress={() => setSelectedId(tool.id)}>
            <Text style={styles.cardTitle}>{tool.title}</Text>
            <Text style={styles.cardDescription}>{tool.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050805" },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#252A25" },
  back: { color: "#FFD700", fontSize: 16, fontWeight: "700", marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#A8AFA8", fontSize: 13, lineHeight: 18, marginTop: 6 },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: "#111511", borderWidth: 1, borderColor: "#2A302A", borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTitle: { color: "#FFD700", fontSize: 17, fontWeight: "800" },
  cardDescription: { color: "#C5CBC5", fontSize: 13, lineHeight: 18, marginTop: 5 },
});

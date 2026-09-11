import React from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { appStyles as styles } from "@/styles/appStyles";
import { loadActiveWorkout, checkpointActiveWorkout } from "@/storage/activeWorkoutStorage";
import { getWorkoutHistory } from "@/storage/workoutStorage";
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { getNextExerciseConfig } from "@/engine/ProgressEngine";
import { CompletedSet, CompletedSession } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";
import { useWorkoutRecoverySettings } from "@/hooks/useWorkoutRecoverySettings";
import { getComparableSetValues, isUnusualRecoveryValue } from "@/utils/recoveryPerformance";

type Draft = Record<string, string>;
type SectionChoice = "completed" | "skipped";
const keyFor = (exerciseId: string, setNumber: number, side?: string) => `${exerciseId}:${setNumber}:${side ?? "value"}`;

export default function ManualWorkoutRecovery() {
  const { workoutRecoveryConfig } = useWorkoutRecoverySettings();
  const [snapshot, setSnapshot] = React.useState<any>(null);
  const [history, setHistory] = React.useState<CompletedSession[]>([]);
  const [draft, setDraft] = React.useState<Draft>({});
  const [confirmed, setConfirmed] = React.useState<Record<string, boolean>>({});
  const [sectionChoices, setSectionChoices] = React.useState<Record<string, SectionChoice>>({});

  React.useEffect(() => {
    Promise.all([loadActiveWorkout(), getWorkoutHistory()]).then(([s, h]) => {
      setSnapshot(s);
      setHistory(h);

      if (!s) return;
      const choices: Record<string, SectionChoice> = {};
      for (const kind of ["warmup", "stretch"] as const) {
        const block = s.session.blocks.find((b: any) => b.type === kind);
        const sectionWasCompleted =
          kind === "warmup"
            ? s.session.results?.warmupCompleted === true
            : s.session.results?.stretchCompleted === true;

        // The WorkoutSession result model stores only a section-level completion
        // flag for warm-up/stretch. If the section had already finished before
        // the interruption, treat all of its entries as recorded/read-only.
        if (sectionWasCompleted) {
          for (const exercise of block?.exercises ?? []) {
            const id = exercise.id ?? exercise.exerciseId;
            choices[`${kind}:${id}`] = "completed";
          }
        }

        // While currently inside a warm-up/stretch screen we have the more
        // precise per-exercise recovery snapshot, so preserve it.
        if ((kind === "warmup" && s.screen === "dynamicWarmUp") || (kind === "stretch" && s.screen === "staticStretch")) {
          for (const id of s.screenState?.completed ?? []) choices[`${kind}:${id}`] = "completed";
          for (const id of s.screenState?.skipped ?? []) choices[`${kind}:${id}`] = "skipped";
        }
      }
      setSectionChoices(choices);
    });
  }, []);

  if (!snapshot) {
    return <SafeAreaView style={styles.container}><Text style={styles.title}>Loading recovery...</Text></SafeAreaView>;
  }

  const mainBlock = snapshot.session.blocks.find((b: any) => b.type === "main");
  const liveWorkout = snapshot.screenState?.engineState?.workoutLog ?? snapshot.session.results?.workout ?? {
    programId: snapshot.programId,
    dayId: mainBlock?.id ?? "",
    exercises: [],
  };

  const getExistingSets = (exerciseId: string): CompletedSet[] =>
    liveWorkout.exercises?.find((e: any) => e.exerciseId === exerciseId)?.sets ?? [];

  const buildSectionResult = (kind: "warmup" | "stretch", block: any) => {
    const completed: string[] = [];
    const skipped: string[] = [];
    for (const exercise of block?.exercises ?? []) {
      const id = exercise.id ?? exercise.exerciseId;
      const choice = sectionChoices[`${kind}:${id}`];
      if (choice === "completed") completed.push(id);
      else skipped.push(id);
    }
    return { completed, skipped, sectionSkipped: completed.length === 0 && skipped.length > 0 };
  };

  const saveManual = async () => {
    const exercises = (mainBlock?.exercises ?? []).map((prescribed: any) => {
      const registry: any = exerciseRegistry[prescribed.exerciseId];
      const existing = getExistingSets(prescribed.exerciseId);
      const sets: CompletedSet[] = [...existing];
      const totalSets = prescribed.sets ?? 0;

      for (let setNumber = existing.length + 1; setNumber <= totalSets; setNumber++) {
        const type = registry?.type;
        const left = Number(draft[keyFor(prescribed.exerciseId, setNumber, "left")]);
        const right = Number(draft[keyFor(prescribed.exerciseId, setNumber, "right")]);
        const value = Number(draft[keyFor(prescribed.exerciseId, setNumber)]);
        const sideMode = registry?.sideMode ?? prescribed.sideMode;
        const advisoryConfirmed = confirmed[keyFor(prescribed.exerciseId, setNumber)] === true;
        const excludeFromProgression = !workoutRecoveryConfig.useRecoveredDataForProgression;

        if (type === "hold") {
          if (sideMode === "alternating" && Number.isFinite(left) && left > 0 && Number.isFinite(right) && right > 0) {
            sets.push({ setNumber, status: ItemStatus.Completed, durationLeft: left, durationRight: right, entrySource: "manualRecovery", advisoryConfirmed, excludeFromProgression });
          } else if (Number.isFinite(value) && value > 0) {
            sets.push({ setNumber, status: ItemStatus.Completed, durationSeconds: value, entrySource: "manualRecovery", advisoryConfirmed, excludeFromProgression });
          } else {
            sets.push({ setNumber, status: ItemStatus.Skipped, entrySource: "manualRecovery", excludeFromProgression });
          }
        } else {
          if (sideMode === "alternating" && Number.isFinite(left) && left > 0 && Number.isFinite(right) && right > 0) {
            sets.push({ setNumber, status: ItemStatus.Completed, repsLeft: left, repsRight: right, entrySource: "manualRecovery", advisoryConfirmed, excludeFromProgression });
          } else if (Number.isFinite(value) && value > 0) {
            sets.push({ setNumber, status: ItemStatus.Completed, repsCompleted: value, entrySource: "manualRecovery", advisoryConfirmed, excludeFromProgression });
          } else {
            sets.push({ setNumber, status: ItemStatus.Skipped, entrySource: "manualRecovery", excludeFromProgression });
          }
        }
      }
      return { exerciseId: prescribed.exerciseId, sets };
    });

    const now = Date.now();
    const updatedBlocks = snapshot.session.blocks.map((block: any) => ({
      ...block,
      status: "completed",
      completedAt: block.completedAt ?? now,
    }));
    const warmupBlock = snapshot.session.blocks.find((b: any) => b.type === "warmup");
    const stretchBlock = snapshot.session.blocks.find((b: any) => b.type === "stretch");

    const updatedSession = {
      ...snapshot.session,
      blocks: updatedBlocks,
      results: {
        ...snapshot.session.results,
        ...(warmupBlock ? { warmupCompleted: true } : {}),
        workout: { ...liveWorkout, exercises, sectionSkipped: false },
        ...(stretchBlock ? { stretchCompleted: true } : {}),
      },
    };

    await checkpointActiveWorkout({
      session: updatedSession,
      blockIndex: updatedSession.blocks.length,
      screen: "workoutSummary",
      activeBlockId: undefined,
      screenState: { phase: "feedback" },
    });

    router.replace({
      pathname: "/screens/workoutSummary",
      params: {
        session: JSON.stringify(updatedSession),
        startWorkoutTime: String(snapshot.startWorkoutTime),
        recovered: "manual",
      },
    });
  };

  const renderSimpleSection = (kind: "warmup" | "stretch", block: any) => {
    if (!block) return null;
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.exerciseName}>{block.title}</Text>
        <Text style={{ color: "#aaa", marginBottom: 8 }}>Mark what you completed after the app became unavailable. No timers run here.</Text>
        {(block.exercises ?? []).map((exercise: any) => {
          const id = exercise.id ?? exercise.exerciseId;
          const k = `${kind}:${id}`;
          const choice = sectionChoices[k];
          const recordedInResult =
            kind === "warmup"
              ? snapshot.session.results?.warmupCompleted === true
              : snapshot.session.results?.stretchCompleted === true;
          const recordedInActiveScreen =
            ((kind === "warmup" && snapshot.screen === "dynamicWarmUp") ||
              (kind === "stretch" && snapshot.screen === "staticStretch")) &&
            ((snapshot.screenState?.completed ?? []).includes(id) ||
              (snapshot.screenState?.skipped ?? []).includes(id));
          const isRecorded = recordedInResult || recordedInActiveScreen;
          return (
            <View key={id} style={{ marginTop: 10 }}>
              <Text style={{ color: "#fff" }}>{exercise.name ?? id}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Pressable disabled={isRecorded} onPress={() => setSectionChoices((c) => ({ ...c, [k]: "completed" }))}>
                  <Text style={{ color: choice === "completed" ? "#FFD700" : "#aaa", fontWeight: "700" }}>Done</Text>
                </Pressable>
                <Pressable disabled={isRecorded} onPress={() => setSectionChoices((c) => ({ ...c, [k]: "skipped" }))}>
                  <Text style={{ color: choice === "skipped" ? "#FFD700" : "#aaa", fontWeight: "700" }}>Skipped</Text>
                </Pressable>
                {isRecorded && <Text style={{ color: "#aaa" }}>🔒 Recorded</Text>}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.title}>Complete Remaining Workout</Text>
        <Text style={{ color: "#bbb", marginBottom: 18, lineHeight: 20 }}>
          Results recorded before the interruption are read-only. Only missing results can be entered here, and timers remain disabled.
        </Text>

        {renderSimpleSection("warmup", snapshot.session.blocks.find((b: any) => b.type === "warmup"))}

        {(mainBlock?.exercises ?? []).map((prescribed: any) => {
          const registry: any = exerciseRegistry[prescribed.exerciseId];
          const existing = getExistingSets(prescribed.exerciseId);
          const progressed: any = registry ? getNextExerciseConfig({ ...registry, ...prescribed }, history) : null;
          const totalSets = prescribed.sets ?? 0;
          return (
            <View key={prescribed.exerciseId} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{registry?.name ?? prescribed.exerciseId}</Text>
              {Array.from({ length: totalSets }, (_, i) => i + 1).map((setNumber) => {
                const old = existing.find((s) => s.setNumber === setNumber);
                const mb = progressed?.matchOrBeatTargets?.find((t: any) => t.setNumber === setNumber)?.target;
                const historical = getComparableSetValues(history, prescribed.exerciseId, setNumber);
                if (old) {
                  const value = old.repsCompleted ?? (old.repsLeft != null ? `L:${old.repsLeft} / R:${old.repsRight}` : old.durationSeconds ?? (old.durationLeft != null ? `L:${old.durationLeft}s / R:${old.durationRight}s` : "Skipped"));
                  return <Text key={setNumber} style={styles.setText}>Set {setNumber}: {String(value)} 🔒</Text>;
                }

                const sideMode = registry?.sideMode ?? prescribed.sideMode;
                const type = registry?.type;
                const inputKey = keyFor(prescribed.exerciseId, setNumber);
                const numeric = Number(draft[inputKey]);
                const unusual = workoutRecoveryConfig.warnUnusualRecoveredResults && Number.isFinite(numeric) && numeric > 0 && isUnusualRecoveryValue({ value: numeric, historyValues: historical, matchOrBeatTarget: mb });

                return (
                  <View key={setNumber} style={{ marginTop: 12 }}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Set {setNumber}</Text>
                    {workoutRecoveryConfig.showPerformanceGuidance && (
                      <Text style={{ color: "#aaa", marginVertical: 5 }}>
                        {mb ? `Match-or-Beat: ${mb}${type === "hold" ? "s" : " reps"}. ` : ""}
                        {historical.length ? `Recent comparable: ${historical.join(", ")}.` : "No comparable history yet."}
                      </Text>
                    )}
                    {sideMode === "alternating" ? (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Left" keyboardType="number-pad" value={draft[keyFor(prescribed.exerciseId, setNumber, "left")] ?? ""} onChangeText={(v) => setDraft((d) => ({ ...d, [keyFor(prescribed.exerciseId, setNumber, "left")]: v }))} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Right" keyboardType="number-pad" value={draft[keyFor(prescribed.exerciseId, setNumber, "right")] ?? ""} onChangeText={(v) => setDraft((d) => ({ ...d, [keyFor(prescribed.exerciseId, setNumber, "right")]: v }))} />
                      </View>
                    ) : (
                      <TextInput style={styles.input} placeholder={type === "hold" ? "Seconds" : "Reps"} keyboardType="number-pad" value={draft[inputKey] ?? ""} onChangeText={(v) => setDraft((d) => ({ ...d, [inputKey]: v }))} />
                    )}
                    {unusual && !confirmed[inputKey] && (
                      <View style={{ marginTop: 6 }}>
                        <Text style={{ color: "#FFD700" }}>This is much higher than your recent performance/MB target and may increase future targets.</Text>
                        <Pressable onPress={() => setConfirmed((c) => ({ ...c, [inputKey]: true }))}>
                          <Text style={{ color: "#FFD700", fontWeight: "700", marginTop: 5 }}>Confirm this value</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {renderSimpleSection("stretch", snapshot.session.blocks.find((b: any) => b.type === "stretch"))}

        <PrimaryButton
          title="SAVE RECOVERED WORKOUT"
          onPress={() => {
            const hasUnconfirmedWarning = Object.keys(draft).some((k) => {
              if (k.endsWith(":left") || k.endsWith(":right")) return false;
              const [exerciseId, rawSet] = k.split(":");
              const value = Number(draft[k]);
              const setNumber = Number(rawSet);
              if (!Number.isFinite(value) || value <= 0) return false;
              const registry: any = exerciseRegistry[exerciseId];
              const prescribed = mainBlock?.exercises?.find((e: any) => e.exerciseId === exerciseId);
              const progressed: any = registry && prescribed ? getNextExerciseConfig({ ...registry, ...prescribed }, history) : null;
              const mb = progressed?.matchOrBeatTargets?.find((t: any) => t.setNumber === setNumber)?.target;
              return workoutRecoveryConfig.warnUnusualRecoveredResults && isUnusualRecoveryValue({ value, historyValues: getComparableSetValues(history, exerciseId, setNumber), matchOrBeatTarget: mb }) && !confirmed[k];
            });
            if (hasUnconfirmedWarning) {
              Alert.alert("Confirm unusual result", "One or more unusually high results still need confirmation before saving.");
              return;
            }
            saveManual();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

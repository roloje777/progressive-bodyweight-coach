import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { inspectActiveWorkout } from "@/storage/activeWorkoutStorage";
import {
  clearRecoveryDiagnosticEvents,
  getRecoveryDiagnosticEvents,
  RecoveryDiagnosticEvent,
} from "@/utils/recoveryDiagnostics";

function formatDateTime(timestamp?: number) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
      <Text style={{ color: "#aaa", flex: 1 }}>{label}</Text>
      <Text style={{ color: "#fff", flex: 1.5, textAlign: "right" }}>{String(value ?? "—")}</Text>
    </View>
  );
}

export default function WorkoutRecoveryDiagnostics() {
  const [inspection, setInspection] = React.useState<any>(null);
  const [events, setEvents] = React.useState<RecoveryDiagnosticEvent[]>([]);

  const refresh = React.useCallback(async () => {
    const [nextInspection, nextEvents] = await Promise.all([
      inspectActiveWorkout(),
      getRecoveryDiagnosticEvents(),
    ]);
    setInspection(nextInspection);
    setEvents(nextEvents);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const snapshot = inspection?.snapshot;
  const timer = snapshot?.screenState?.timerState;
  const integrity = inspection?.integrity;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 6 }}>
          Workout Recovery Diagnostics
        </Text>
        <Text style={{ color: "#aaa", lineHeight: 20, marginBottom: 20 }}>
          Developer/support view. This screen does not change recovery state unless you explicitly clear diagnostic logs.
        </Text>

        <View style={{ borderWidth: 1, borderColor: "#555", borderRadius: 12, padding: 14, marginBottom: 18 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
            Current snapshot
          </Text>
          <Row label="Status" value={inspection?.status ?? "loading"} />
          <Row label="Schema" value={snapshot?.schemaVersion} />
          <Row label="Session" value={snapshot?.sessionId} />
          <Row label="Program" value={snapshot?.programId} />
          <Row label="Week / Day" value={snapshot ? `${snapshot.weekIndex + 1} / ${snapshot.dayIndex + 1}` : "—"} />
          <Row label="Screen" value={snapshot?.screen} />
          <Row label="Block index" value={snapshot?.blockIndex} />
          <Row label="Exercise" value={integrity?.context?.exerciseName ?? integrity?.context?.exerciseId} />
          <Row label="Set" value={integrity?.context?.setNumber} />
          <Row label="Timer" value={timer?.kind} />
          <Row label="Trusted duration" value={snapshot ? `${Math.floor(snapshot.accumulatedActiveDurationMs / 1000)}s` : "—"} />
          <Row label="Lifecycle" value={snapshot?.lastAppState} />
          <Row label="Interruption" value={snapshot?.interruption?.kind} />
          <Row label="Integrity age" value={integrity?.age} />
          <Row label="Last checkpoint" value={formatDateTime(snapshot?.lastCheckpointAt)} />
          {inspection?.issue ? <Text style={{ color: "#ffb3b3", marginTop: 8 }}>{inspection.issue}</Text> : null}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <Pressable onPress={refresh} style={{ borderWidth: 1, borderColor: "#888", borderRadius: 10, padding: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>REFRESH</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert("Clear recovery diagnostic logs?", "The active recovery snapshot will not be changed.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear Logs",
                  style: "destructive",
                  onPress: async () => {
                    await clearRecoveryDiagnosticEvents();
                    await refresh();
                  },
                },
              ]);
            }}
            style={{ borderWidth: 1, borderColor: "#888", borderRadius: 10, padding: 12 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>CLEAR LOGS</Text>
          </Pressable>
        </View>

        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
          Recent recovery events ({events.length})
        </Text>
        {events.length === 0 ? (
          <Text style={{ color: "#aaa" }}>No recovery diagnostic events recorded yet.</Text>
        ) : (
          events.map((event) => (
            <View key={event.id} style={{ borderBottomWidth: 1, borderBottomColor: "#333", paddingVertical: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{event.event}</Text>
              <Text style={{ color: "#888", marginTop: 3 }}>{formatDateTime(event.at)}</Text>
              {event.data ? (
                <Text selectable style={{ color: "#bbb", marginTop: 6, fontFamily: "monospace" }}>
                  {JSON.stringify(event.data, null, 2)}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

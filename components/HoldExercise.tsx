import React, { useEffect, useRef } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useHoldTimer } from "../timers/useHoldTimer";
// import { soundManager } from "../services/SoundManagerExpoAv";
import { soundManager } from "../services/SoundManager";
import { appStyles as styles } from "../styles/appStyles";
import { HoldVisual } from "./visual/HoldVisual";
import { MatchOrBeatTarget } from "../models/Exercise";
import PrimaryButton from "@/components/PrimaryButton";
import { RecoveryTimerState } from "@/models/WorkoutRecovery";
import { logRecoveryEvent } from "@/utils/recoveryDiagnostics";

interface HoldExerciseProps {
  exerciseName: string;
  description?: string;
  totalSets: number;
  duration: number;

  sets: (
    | { durationSeconds: number }
    | { durationLeft: number; durationRight: number }
    | { skipped: true }
  )[];

  matchOrBeatTargets?: MatchOrBeatTarget[];

  onSetComplete: (duration: number | { left: number; right: number }) => void;

  sideMode?: "none" | "alternating";

  recoveryTimerState?: RecoveryTimerState | null;
  onRecoveryTimerStateChange?: (state: RecoveryTimerState | null) => void;
}

export const HoldExercise: React.FC<HoldExerciseProps> = ({
  exerciseName,
  totalSets,
  duration,
  sets,
  sideMode = "none",
  matchOrBeatTargets = [],
  onSetComplete,
  recoveryTimerState = null,
  onRecoveryTimerStateChange,
}) => {
  // ✅ safer than useState for async timing
  const leftDurationRef = useRef(0);

  // Prevent the same AppState transition (for example inactive -> background)
  // from interrupting the same hold more than once.
  const interruptionHandledRef = useRef(false);

  const [isStarting, setIsStarting] = React.useState(false);

  const [currentSide, setCurrentSide] = React.useState<"left" | "right">(
    "left",
  );

  const [phase, setPhase] = React.useState<"idle" | "running" | "transition">(
    "idle",
  );

  const [interruptedElapsed, setInterruptedElapsed] =
    React.useState<number | null>(
      recoveryTimerState?.kind === "hold" &&
        typeof recoveryTimerState.elapsedBeforeInterruption === "number"
        ? recoveryTimerState.elapsedBeforeInterruption
        : null,
    );

  // The timer measures the hold, but the user confirms the value before it is
  // committed. This also allows a recovered/interrupted hold to be corrected
  // when the user kept their own count.
  const [pendingDuration, setPendingDuration] = React.useState<number | null>(
    recoveryTimerState?.kind === "hold" &&
      typeof recoveryTimerState.elapsedBeforeInterruption === "number"
      ? recoveryTimerState.elapsedBeforeInterruption
      : null,
  );

  const [pendingSource, setPendingSource] = React.useState<
    "normal" | "interrupted" | null
  >(
    recoveryTimerState?.kind === "hold" &&
      typeof recoveryTimerState.elapsedBeforeInterruption === "number"
      ? "interrupted"
      : null,
  );

  React.useEffect(() => {
    if (recoveryTimerState?.kind !== "hold") return;

    // A live/running hold also persists timerState.kind === "hold".
    // It is only an interrupted hold when elapsedBeforeInterruption exists.
    if (
      typeof recoveryTimerState.elapsedBeforeInterruption !== "number"
    ) {
      return;
    }

    interruptionHandledRef.current = true;
    setInterruptedElapsed(recoveryTimerState.elapsedBeforeInterruption);
    setPendingDuration(recoveryTimerState.elapsedBeforeInterruption);
    setPendingSource("interrupted");
    setCurrentSide(recoveryTimerState.side ?? "left");
    leftDurationRef.current = recoveryTimerState.leftDurationSeconds ?? 0;
    setPhase("idle");
  }, [
    recoveryTimerState?.kind,
    recoveryTimerState?.elapsedBeforeInterruption,
    recoveryTimerState?.side,
    recoveryTimerState?.leftDurationSeconds,
  ]);

  // ✅ Match / Beat logic
  const currentSetNumber = sets.length + 1;

  const currentTarget = matchOrBeatTargets.find(
    (t) => t.setNumber === currentSetNumber,
  );

  const effectiveDuration = Math.max(duration, currentTarget?.target ?? 0);

  /**
   * Commit a user-confirmed hold duration. The timer no longer writes the
   * result directly; both normal and recovered holds pass through this step.
   */
  const confirmHoldDuration = async () => {
    if (pendingDuration == null || pendingDuration <= 0) return;

    const confirmedDuration = pendingDuration;

    onRecoveryTimerStateChange?.(null);
    setInterruptedElapsed(null);
    setPendingDuration(null);
    setPendingSource(null);

    if (sideMode === "alternating") {
      // LEFT SIDE CONFIRMED
      if (currentSide === "left") {
        leftDurationRef.current = confirmedDuration;
        setPhase("transition");

        await soundManager.playNextSide?.(true);

        setTimeout(() => {
          setCurrentSide("right");
          setPhase("idle");
        }, 1500);

        return;
      }

      // RIGHT SIDE CONFIRMED
      onSetComplete({
        left: leftDurationRef.current,
        right: confirmedDuration,
      });

      leftDurationRef.current = 0;
      setCurrentSide("left");
      setPhase("idle");
      return;
    }

    onSetComplete(confirmedDuration);
    setPhase("idle");
  };

  const { elapsed, state, start, stop, interrupt, reset } = useHoldTimer(
    effectiveDuration,
  );

  const remaining = Math.max(effectiveDuration - elapsed, 0);

  // ✅ START
  const handleStart = async () => {
    if (state === "running" || isStarting) return;

    setIsStarting(true);
    setInterruptedElapsed(null);
    setPendingDuration(null);
    setPendingSource(null);
    interruptionHandledRef.current = false;

    await soundManager.playReadySetGoSound(true);

    const startedAt = Date.now();
    onRecoveryTimerStateChange?.({
      kind: "hold",
      startedAt,
      durationSeconds: effectiveDuration,
      setNumber: currentSetNumber,
      side: currentSide,
      leftDurationSeconds: leftDurationRef.current || undefined,
    });

    start();

    setPhase("running");

    setIsStarting(false);
  };

  /**
   * SOUND GUIDE
   */
  /**
   * SOUND GUIDE
   */
  useEffect(() => {
    if (state !== "running") return;

    const run = async () => {
      if (remaining <= 0) return;

      // final countdown
      if (remaining < 5) {
        soundManager.playCountdownBeep();
        return;
      }

      // halfway
      if (remaining === Math.floor(effectiveDuration / 2)) {
        soundManager.playHalfWay();
        return;
      }

      // every 5 sec
      if (remaining % 5 === 0) {
        soundManager.playTick();
        return;
      }
    };

    run();
  }, [elapsed, remaining, state, effectiveDuration]);

  // ✅ reset timer when switching sides
  useEffect(() => {
    if (phase === "idle" && currentSide === "right") {
      reset();
    }
  }, [currentSide, phase]);


  useEffect(() => {
    const subscription = AppState.addEventListener("change", (appState) => {
      if (
        (appState === "inactive" || appState === "background") &&
        state === "running" &&
        !interruptionHandledRef.current
      ) {
        interruptionHandledRef.current = true;

        const elapsedAtInterruption = interrupt();

        void logRecoveryEvent("hold_interrupted", {
          elapsedSeconds: elapsedAtInterruption,
          durationSeconds: effectiveDuration,
          setNumber: currentSetNumber,
          side: currentSide,
          appState,
        });

        setInterruptedElapsed(elapsedAtInterruption);
        setPendingDuration(elapsedAtInterruption);
        setPendingSource("interrupted");
        setPhase("idle");

        onRecoveryTimerStateChange?.({
          kind: "hold",
          startedAt:
            recoveryTimerState?.kind === "hold"
              ? recoveryTimerState.startedAt
              : Date.now() - elapsedAtInterruption * 1000,
          durationSeconds: effectiveDuration,
          setNumber: currentSetNumber,
          elapsedBeforeInterruption: elapsedAtInterruption,
          side: currentSide,
          leftDurationSeconds: leftDurationRef.current || undefined,
        });
      }
    });

    return () => subscription.remove();
  }, [
    state,
    currentSetNumber,
    currentSide,
    effectiveDuration,
    interrupt,
    onRecoveryTimerStateChange,
    recoveryTimerState,
  ]);

  const handleStop = () => {
    const durationRecorded = stop();

    if (durationRecorded <= 0) return;

    // The active timer is finished; wait for the user to confirm/correct the
    // measured value before committing the set.
    onRecoveryTimerStateChange?.(null);
    setInterruptedElapsed(null);
    setPendingDuration(durationRecorded);
    setPendingSource("normal");
    setPhase("idle");
  };

  const adjustPendingDuration = (delta: number) => {
    setPendingDuration((current) =>
      Math.max(0, (current ?? 0) + delta),
    );
  };

  const restartInterruptedHold = () => {
    interruptionHandledRef.current = false;
    setInterruptedElapsed(null);
    setPendingDuration(null);
    setPendingSource(null);
    onRecoveryTimerStateChange?.(null);
    reset();
    setPhase("idle");
  };

  return (
    <View style={styles.exerciseContainer}>
      {/* MATCH / BEAT */}
      {currentTarget && (
        <Text
          style={{
            color: "#FFD700",
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          Match or Beat: {currentTarget.target}s
        </Text>
      )}

      {/* SIDE INDICATOR */}
      {sideMode === "alternating" && (
        <Text style={{ color: "#FFD700", fontSize: 18 }}>
          Side: {currentSide.toUpperCase()}
        </Text>
      )}

      {/* TRANSITION */}
      {phase === "transition" && (
        <Text style={{ fontSize: 24, color: "#FFD700", marginTop: 20 }}>
          Next Side...
        </Text>
      )}

      {pendingSource === "interrupted" && interruptedElapsed != null && (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              color: "#FFD54F",
              fontSize: 16,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Hold interrupted at approximately {interruptedElapsed}s.
            Background/closed-app time was not counted.
          </Text>
        </View>
      )}

      {pendingDuration != null && (
        <View style={{ marginVertical: 12 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {pendingSource === "interrupted"
              ? "Confirm or adjust the hold you recorded"
              : "Confirm or adjust your hold duration"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease hold duration"
              onPress={() => adjustPendingDuration(-1)}
              style={({ pressed }) => ({
                minWidth: 56,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#FFD700",
                borderRadius: 8,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Text style={{ color: "#FFD700", fontSize: 28 }}>−</Text>
            </Pressable>

            <View
              style={{
                minWidth: 110,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
              }}
            >
              <Text
                style={{
                  color: "#FFD700",
                  fontSize: 30,
                  fontWeight: "bold",
                }}
              >
                {pendingDuration}s
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase hold duration"
              onPress={() => adjustPendingDuration(1)}
              style={({ pressed }) => ({
                minWidth: 56,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#FFD700",
                borderRadius: 8,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Text style={{ color: "#FFD700", fontSize: 28 }}>+</Text>
            </Pressable>
          </View>

          <PrimaryButton
            title="Record Hold"
            disabled={pendingDuration <= 0}
            onPress={() => {
              void confirmHoldDuration();
            }}
          />

          {pendingSource === "interrupted" && (
            <PrimaryButton
              title="Restart Hold"
              onPress={restartInterruptedHold}
            />
          )}
        </View>
      )}

      {/* VISUAL */}
      <HoldVisual elapsed={elapsed} duration={effectiveDuration} />

      {/* START BUTTON */}
      {/* START BUTTON */}
      {state !== "running" &&
        phase !== "transition" &&
        interruptedElapsed == null &&
        pendingDuration == null && (
        <PrimaryButton
          title={
            isStarting
              ? "Get Ready..."
              : sideMode === "alternating"
                ? `Start ${currentSide.toUpperCase()}`
                : "Start"
          }
          disabled={isStarting}
          onPress={handleStart}
        />
      )}

      {/* STOP / FINISH HOLD */}
      {state === "running" && (
        <PrimaryButton
          title={elapsed >= effectiveDuration ? "Finish Hold" : "Stop Hold"}
          onPress={handleStop}
        />
      )}

      {/* COMPLETED SETS */}
      {sets.map((item, index) => (
        <Text key={index} style={styles.setText}>
          {"skipped" in item ? (
            <>Set {index + 1}: ⏭ Skipped</>
          ) : "durationSeconds" in item ? (
            <>
              Set {index + 1}: {item.durationSeconds}s
            </>
          ) : (
            <>
              Set {index + 1}: L:{item.durationLeft}s / R:{item.durationRight}s
            </>
          )}
        </Text>
      ))}
    </View>
  );
};

import React, { useEffect, useRef } from "react";
import { AppState, Text, View } from "react-native";
import { useHoldTimer } from "../timers/useHoldTimer";
// import { soundManager } from "../services/SoundManagerExpoAv";
import { soundManager } from "../services/SoundManager";
import { appStyles as styles } from "../styles/appStyles";
import { HoldVisual } from "./visual/HoldVisual";
import { MatchOrBeatTarget } from "../models/Exercise";
import PrimaryButton from "@/components/PrimaryButton";
import { RecoveryTimerState } from "@/models/WorkoutRecovery";

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

  const [isStarting, setIsStarting] = React.useState(false);

  const [currentSide, setCurrentSide] = React.useState<"left" | "right">(
    "left",
  );

  const [phase, setPhase] = React.useState<"idle" | "running" | "transition">(
    "idle",
  );

  const [interruptedElapsed, setInterruptedElapsed] = React.useState<number | null>(
    recoveryTimerState?.kind === "hold"
      ? recoveryTimerState.elapsedBeforeInterruption ?? 0
      : null,
  );

  React.useEffect(() => {
    if (recoveryTimerState?.kind !== "hold") return;

    setInterruptedElapsed(recoveryTimerState.elapsedBeforeInterruption ?? 0);
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

  // ✅ TIMER COMPLETE
  const handleTimerComplete = async (elapsedDuration: number) => {
    onRecoveryTimerStateChange?.(null);
    setInterruptedElapsed(null);

    if (sideMode === "alternating") {
      // LEFT SIDE FINISHED
      if (currentSide === "left") {
        // ✅ store safely
        leftDurationRef.current = elapsedDuration;

        // transition to right
        setPhase("transition");

        try {
          await soundManager.playNextSide?.(true);
        } catch (err) {
          console.warn("HoldExercise: next-side sound failed; continuing.", err);
        }

        setTimeout(() => {
          setCurrentSide("right");
          setPhase("idle");
        }, 1500);

        return;
      }

      // RIGHT SIDE FINISHED
      onSetComplete({
        left: leftDurationRef.current,
        right: elapsedDuration,
      });

      // reset
      leftDurationRef.current = 0;

      setCurrentSide("left");
      setPhase("idle");

      return;
    }

    // NORMAL HOLD
    onSetComplete(elapsedDuration);

    setPhase("idle");
  };
  const effectiveDuration = Math.max(duration, currentTarget?.target ?? 0);

  const { elapsed, state, start, stop, interrupt, reset } = useHoldTimer(
    effectiveDuration,
    handleTimerComplete,
  );

  const remaining = Math.max(effectiveDuration - elapsed, 0);

  // ✅ START
  const handleStart = async () => {
    if (state === "running" || isStarting) return;

    setIsStarting(true);
    setInterruptedElapsed(null);

    try {
      await soundManager.playReadySetGoSound(true);
    } catch (err) {
      // Sound guidance must never prevent the hold from starting.
      console.warn("HoldExercise: ready sound failed; starting hold.", err);
    }

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
        state === "running"
      ) {
        const elapsedAtInterruption = interrupt();

        setInterruptedElapsed(elapsedAtInterruption);
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

  const recordInterruptedElapsed = async () => {
    if (interruptedElapsed == null || interruptedElapsed <= 0) return;
    await handleTimerComplete(interruptedElapsed);
  };

  const restartInterruptedHold = () => {
    setInterruptedElapsed(null);
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

      {interruptedElapsed != null && interruptedElapsed >= 0 && (
        <View style={{ marginVertical: 12 }}>
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

          {interruptedElapsed > 0 && (
            <PrimaryButton
              title={`Record ${interruptedElapsed}s`}
              onPress={recordInterruptedElapsed}
            />
          )}

          <PrimaryButton
            title="Restart Hold"
            onPress={restartInterruptedHold}
          />
        </View>
      )}

      {/* VISUAL */}
      <HoldVisual elapsed={elapsed} duration={effectiveDuration} />

      {/* START BUTTON */}
      {/* START BUTTON */}
      {state !== "running" &&
        phase !== "transition" &&
        interruptedElapsed == null && (
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
          onPress={stop}
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

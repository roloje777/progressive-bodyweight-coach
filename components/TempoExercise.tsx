import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import PrimaryButton from "@/components/PrimaryButton";
import { MatchOrBeatHint } from "@/components/MatchOrBeatHint";
import { useTranslation } from "@/hooks/useTranslation";

// import { soundManager } from "../services/SoundManagerExpoAv";
import { soundManager } from "../services/SoundManager";
import { useAppStyles } from "../styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { TempoVisual } from "./visual/TempoVisual";
import { MatchOrBeatTarget } from "../models/Exercise";

// ---- TYPES ----
export interface TempoConfig {
  startPhase: "eccentric" | "concentric";
  eccentric: number;
  pauseEccentric?: number;
  concentric: number;
  pauseConcentric?: number;
}

export type TempoPhase =
  | "eccentric"
  | "pauseEccentric"
  | "concentric"
  | "pauseConcentric";

export function buildTempoPhases(config: TempoConfig): TempoPhase[] {
  return config.startPhase === "eccentric"
    ? ["eccentric", "pauseEccentric", "concentric", "pauseConcentric"]
    : ["concentric", "pauseConcentric", "eccentric", "pauseEccentric"];
}

export function getPhaseDuration(phase: TempoPhase, config: TempoConfig) {
  switch (phase) {
    case "eccentric":
      return config.eccentric;
    case "concentric":
      return config.concentric;
    case "pauseEccentric":
      return config.pauseEccentric || 0;
    case "pauseConcentric":
      return config.pauseConcentric || 0;
  }
}

// ---- PROPS ----
interface TempoExerciseProps {
  exerciseName: string;
  totalSets: number;
  config: TempoConfig;
  minReps: number;
  maxReps: number;

  sideMode?: "none" | "alternating";

  matchOrBeatTargets?: MatchOrBeatTarget[];
  isBaselineWeek?: boolean;

  sets: (
    | {
        reps: number | { left: number; right: number };
        phaseDurations: number[];
      }
    | { skipped: true }
  )[];

  onCompleteSet: (set: {
    reps: number | { left: number; right: number };
    phaseDurations: number[];
  }) => void;
}

export const TempoExercise: React.FC<TempoExerciseProps> = ({
  exerciseName,
  totalSets,
  config,
  minReps,
  maxReps,
  sideMode = "none",
  matchOrBeatTargets = [],
  isBaselineWeek = false,
  sets,
  onCompleteSet,
}) => {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { t, uiText } = useTranslation();
  const [inputLeft, setInputLeft] = useState(0);
  const [inputRight, setInputRight] = useState(0);
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showRepsInput, setShowRepsInput] = useState(false);
  const [inputReps, setInputReps] = useState(0);

  const [cycleCount, setCycleCount] = useState(0);

  const [side, setSide] = useState<"left" | "right">("left");
  const [leftReps, setLeftReps] = useState(0);
  const [rightReps, setRightReps] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(0);

  const phases = buildTempoPhases(config);

  const currentSetNumber = sets.length + 1;

  const currentTarget = matchOrBeatTargets.find(
    (t) => t.setNumber === currentSetNumber,
  );

  const currentRepCount =
    sideMode === "alternating"
      ? side === "left"
        ? leftReps
        : rightReps
      : cycleCount;

  const mbTargetReached =
    currentTarget?.target != null && currentRepCount >= currentTarget.target;

  // Prevent the cue from replaying on subsequent renders after the target has
  // already been reached. Alternating sides each get their own target cue.
  const targetReachedSoundPlayedRef = useRef(false);

  useEffect(() => {
    targetReachedSoundPlayedRef.current = false;
  }, [currentSetNumber, side, currentTarget?.target]);

  useEffect(() => {
    if (!running || !mbTargetReached || targetReachedSoundPlayedRef.current) {
      return;
    }

    targetReachedSoundPlayedRef.current = true;
    void soundManager.playTargetReached(false);
  }, [running, mbTargetReached]);

  // ---- START TIMER ----
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const startTimer = async () => {
    if (running || starting || intervalRef.current) return;

    setStarting(true);
    startingRef.current = true;

    await soundManager.playReadySetGoSound(true);

    setRunning(true);
    setStarting(false);
    setPhaseIndex(0);
    phaseIndexRef.current = 0;

    setCycleCount(0);

    const firstPhase = phases[0];
    setTimeLeft(getPhaseDuration(firstPhase, config));

    void soundManager.playPhaseSound(firstPhase, true);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0.5) return prev - 0.5;

        // move phase
        phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;

        const nextIndex = phaseIndexRef.current;
        setPhaseIndex(nextIndex);

        const nextPhase = phases[nextIndex];
        void soundManager.playPhaseSound(nextPhase, true);

        // rep counting
        if (nextIndex === 0) {
          if (sideMode === "alternating") {
            if (side === "left") {
              setLeftReps((r) => r + 1);
            } else {
              setRightReps((r) => r + 1);
            }
          } else {
            setCycleCount((c) => c + 1);
          }
        }

        return getPhaseDuration(nextPhase, config);
      });
    }, 500);

    startingRef.current = false;
  };

  // ---- STOP TIMER ----
  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    setRunning(false);
    startingRef.current = false;

    if (sideMode === "alternating") {
      if (side === "left") {
        // ✅ finished LEFT → switch to RIGHT
        setSide("right");

        // ✅ ensure input UI is hidden
        setShowRepsInput(false);

        return; // ❗ don't complete set yet
      }

      // ✅ finished RIGHT → prepare inputs
      setInputLeft(Math.max(0, leftReps));
      setInputRight(Math.max(0, rightReps));

      setShowRepsInput(true);
      return;
    }

    // normal mode
    setInputReps(Math.max(0, cycleCount));
    setShowRepsInput(true);
  };

  // ---- COMPLETE SET (FIXED) ----
  const handleCompleteSet = () => {
    let repsValue: number | { left: number; right: number };

    if (sideMode === "alternating") {
      repsValue = {
        left: Math.max(0, inputLeft),
        right: Math.max(0, inputRight),
      };
    } else {
      repsValue = Math.max(0, inputReps);
    }

    onCompleteSet({
      reps: repsValue,
      phaseDurations: [],
    });

    // reset
    setInputReps(0);
    setCycleCount(0);
    setLeftReps(0);
    setRightReps(0);
    setSide("left");
    setShowRepsInput(false);
    setRunning(false);
    setPhaseIndex(0);
    startingRef.current = false;
  };

  // ---- CLEANUP ----
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isStartDisabled = running || starting || showRepsInput;

  const NumberStepper = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (value: number) => void;
    label?: string;
  }) => (
    <View style={{ alignItems: "center" }}>
      {label && (
        <Text
          style={{
            color: palette.primary,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label ?? "reps"}`}
          disabled={value <= 0}
          onPress={() => onChange(Math.max(0, value - 1))}
          style={({ pressed }) => ({
            minWidth: 56,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: palette.primary,
            borderRadius: 8,
            opacity: value <= 0 ? 0.35 : pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ color: palette.primary, fontSize: 28 }}>−</Text>
        </Pressable>

        <View
          style={{
            minWidth: 90,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{ color: palette.primary, fontSize: 30, fontWeight: "bold" }}
          >
            {value}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label ?? "reps"}`}
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => ({
            minWidth: 56,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: palette.primary,
            borderRadius: 8,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ color: palette.primary, fontSize: 28 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  // ---- RENDER ----
  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.target}>
        {t("workout.targetReps", { min: minReps, max: maxReps })}
      </Text>
      {currentTarget ? (
        <Text
          style={{
            color: palette.primary,
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {currentTarget.target != null &&
            t("exercise.matchOrBeat", { target: currentTarget.target })}
        </Text>
      ) : isBaselineWeek ? (
        <Text
          style={{
            color: palette.primary,
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {t("exercise.baselinePrompt")}
        </Text>
      ) : null}
      {currentTarget ? <MatchOrBeatHint /> : null}

      <TempoVisual phase={phases[phaseIndex]} targetReached={mbTargetReached} />

      <Text
        style={{
          fontSize: 42,
          fontWeight: "bold",
          color: palette.primary,
          textAlign: "center",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        {Math.ceil(timeLeft)}s
      </Text>

      {sideMode === "alternating" ? (
        <>
          <Text
            style={{
              fontSize: 42,
              color: palette.primary,
              fontWeight: "bold",
              textAlign: "center",
              alignSelf: "center",
            }}
          >
            L: {leftReps} | R: {rightReps}
          </Text>
          <Text style={{ color: palette.textMuted }}>
            {uiText("Current")}:{" "}
            {side === "left" ? t("common.left") : t("common.right")}
          </Text>
        </>
      ) : (
        <Text
          style={{
            fontSize: 72,
            color: palette.text,
            fontWeight: "bold",
            textAlign: "center",
            alignSelf: "center",
          }}
        >
          {cycleCount}
        </Text>
      )}

      <View
        style={{
          marginTop: 16,
          alignItems: "center",
          width: "100%",
        }}
      >
        {sideMode === "alternating" &&
          side === "right" &&
          !running &&
          !showRepsInput && (
            <Text
              style={{
                color: palette.primary,
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              {uiText("Next Side...")} → {t("common.right").toUpperCase()}
            </Text>
          )}

        {!running && !showRepsInput && (
          <View style={{ width: "100%", alignItems: "center" }}>
            <PrimaryButton
              title={
                sideMode === "alternating"
                  ? `${t("common.start")} ${side === "left" ? t("common.left").toUpperCase() : t("common.right").toUpperCase()}`
                  : t("common.start")
              }
              onPress={startTimer}
              disabled={isStartDisabled}
            />
          </View>
        )}

        {running && (
          <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
            <Text style={styles.buttonText}>{t("common.stop")}</Text>
          </TouchableOpacity>
        )}

        {showRepsInput && (
          <View
            style={{
              alignItems: "center",
              width: "100%",
            }}
          >
            {sideMode === "alternating" ? (
              <View style={{ width: "100%", gap: 16, marginBottom: 20 }}>
                <NumberStepper
                  label={t("common.left")}
                  value={inputLeft}
                  onChange={setInputLeft}
                />
                <NumberStepper
                  label={t("common.right")}
                  value={inputRight}
                  onChange={setInputRight}
                />
              </View>
            ) : (
              <View style={{ marginBottom: 20 }}>
                <NumberStepper value={inputReps} onChange={setInputReps} />
              </View>
            )}

            <PrimaryButton
              title={t("exercise.completeSet")}
              onPress={handleCompleteSet}
            />
          </View>
        )}
      </View>

      {sets.length > 0 && (
        <View style={{ marginTop: 24, width: "100%" }}>
          {sets.map((item, index) => (
            <Text key={index} style={styles.setText}>
              {"skipped" in item ? (
                <>
                  {t("exercise.setLine", {
                    set: index + 1,
                    value: t("exercise.skipped"),
                  })}
                </>
              ) : (
                <>
                  {t("exercise.setLine", {
                    set: index + 1,
                    value:
                      typeof item.reps === "number"
                        ? `${item.reps} ${t("unit.reps")}`
                        : `L:${item.reps.left} / R:${item.reps.right}`,
                  })}
                </>
              )}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

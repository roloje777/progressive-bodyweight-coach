import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useHoldTimer } from "../timers/useHoldTimer";
import { soundManager } from "../services/SoundManagerExpoAv";
import { appStyles as styles } from "../styles/appStyles";
import { HoldVisual } from "./visual/HoldVisual";

interface HoldExerciseProps {
  exerciseName: string;
  totalSets: number;
  duration: number;
  sets: { durationSeconds: number }[];
  onSetComplete: (duration: number) => void;
}

export const HoldExercise: React.FC<HoldExerciseProps> = ({
  exerciseName,
  totalSets,
  duration,
  sets,
  onSetComplete,
}) => {
  const { elapsed, state, start, stop } = useHoldTimer(duration, onSetComplete);

  const remaining = Math.max(duration - elapsed, 0);

  const [isStarting, setIsStarting] = React.useState(false);

  const handleStart = async () => {
    if (state === "running" || isStarting) return;

    setIsStarting(true);

    await soundManager.playReadySetGoSound(true);

    start();
    setIsStarting(false);
  };

  
  /**
   * SOUND GUIDE
   */
  useEffect(() => {
    if (state !== "running") return;

    const run = async () => {

      if (remaining <= 0) return;
     

      if (remaining <= 5) {
        soundManager.playCountdownBeep();
        return;
      }

      if (remaining === Math.floor(duration / 2)) {
        soundManager.playHalfWay();
        return;
      }

      if (remaining % 5 === 0) {
        soundManager.playTick();
      }
    };

    run();
  }, [elapsed, remaining, state, duration]);

  return (
    <View style={styles.container}>
      <HoldVisual remaining={remaining} duration={duration} />

      {state !== "running" && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          disabled={isStarting}
        >
          <Text style={styles.buttonText}>
            {isStarting ? "Get Ready..." : "Start"}
          </Text>
        </TouchableOpacity>
      )}

      {/* <FlatList
        data={sets}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.setText}>
            Set {index + 1}: {item.durationSeconds}s
          </Text>
        )}
      /> */}
    </View>
  );
};

import React, { useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";

import { beginnerProgram } from "../../data/beginnerProgram";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { CompletedSet } from "../../models/WorkoutLog";

export default function EngineTest() {
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));
  const [started, setStarted] = useState(false);
  const [log, setLog] = useState<any>(null);

  const currentExercise = started ? engine.getCurrentExercise() : null;

//   let currentExercise = null;

// if (started) {
//   console.log("Current Day:", engine.getCurrentDay());
//   console.log("Exercises:", engine.getCurrentDay().exercises);
//   currentExercise = engine.getCurrentExercise();
// }

 // 🔑 Optional Debug
  console.log("currentExercise:", currentExercise);

  const startWorkout = () => {
    engine.startWorkout();
    setStarted(true);
  };

  const completeSet = () => {
    const mockSet: CompletedSet = {
      setNumber: Math.floor(Math.random() * 10),
      repsCompleted: 10,
    };

    engine.completeSet(mockSet);
    setLog(engine.finishWorkout());
  };

  const nextExercise = () => {
    engine.nextExercise();
    setLog(engine.finishWorkout());
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        Program Engine Test
      </Text>

      {!started && (
        <Button title="Start Workout" onPress={startWorkout} />
      )}

   {started && currentExercise ? (
  <>
    <Text style={{ marginTop: 20 }}>Current Exercise:</Text>
    <Text style={{ fontSize: 18 }}>{currentExercise.name}</Text>

    <Button title="Complete Mock Set" onPress={completeSet} />
    <Button title="Next Exercise" onPress={nextExercise} />
  </>
) : started && !currentExercise ? (
  <Text style={{ marginTop: 20 }}>No exercises for this day.</Text>
) : null}

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        Workout Log:
      </Text>

      <Text>
        {JSON.stringify(log, null, 2)}
      </Text>
    </ScrollView>
  );
}
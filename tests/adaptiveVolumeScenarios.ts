// tests/adaptiveVolumeScenarios.ts

import { DEFAULT_ADAPTIVE_VOLUME_CONFIG } from "@/config/AdaptiveVolumeConfig";
import {
  applyAdaptiveRecommendationSelection,
  closeAdaptiveWeekReview,
  recordAdaptiveWorkout,
  selectAdaptiveSetCandidate,
} from "@/engine/AdaptiveVolumeEngine";
import { buildSession } from "@/engine/sessionBuilder";
import {
  EMPTY_ADAPTIVE_PROGRAM_STATE,
  getAdaptiveExerciseKey,
  getAdaptiveWeekKey,
} from "@/models/AdaptiveVolume";
import { beginnerProgram } from "@/data/beginnerProgram";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runAdaptiveVolumeDirectScenarios(): string[] {
  const passed: string[] = [];
  const config = DEFAULT_ADAPTIVE_VOLUME_CONFIG;

  const day1Candidate = selectAdaptiveSetCandidate({
    programId: "level1",
    weekIndex: 2,
    dayId: "day1-push",
    dayIndex: 0,
    maxSetsPerExercise: 5,
    exercises: [
      {
        exerciseId: "incline-push-ups",
        currentSets: 4,
        programOrder: 0,
        applicableTargets: 4,
        metTargets: 4,
        beatenTargets: 4,
        overperformanceScore: 1.1,
      },
      {
        exerciseId: "standard-push-ups",
        currentSets: 3,
        programOrder: 1,
        applicableTargets: 3,
        metTargets: 3,
        beatenTargets: 3,
        overperformanceScore: 1.2,
      },
    ],
  });

  assert(day1Candidate?.exerciseId === "standard-push-ups", "best candidate selection failed");
  assert(day1Candidate?.toSets === 4, "candidate must increase by exactly one set");
  passed.push("one best exercise selected per qualifying workout");

  const day2Candidate = selectAdaptiveSetCandidate({
    programId: "level1",
    weekIndex: 2,
    dayId: "day2-lower",
    dayIndex: 1,
    maxSetsPerExercise: 5,
    exercises: [
      {
        exerciseId: "reverse-lunges",
        currentSets: 3,
        programOrder: 1,
        applicableTargets: 3,
        metTargets: 3,
        beatenTargets: 2,
        overperformanceScore: 1.08,
      },
    ],
  });

  let state = EMPTY_ADAPTIVE_PROGRAM_STATE;

  const d1 = recordAdaptiveWorkout({
    state,
    config,
    programId: "level1",
    programDayCount: 4,
    weekIndex: 2,
    dayId: "day1-push",
    dayIndex: 0,
    workoutKey: "w3-d1",
    rating: 5,
    trainingMode: "normal",
    setCandidate: day1Candidate,
    rating5OptionalExerciseId: "close-grip-push-ups",
  });
  state = d1.state;

  assert(!d1.weekQualified, "first qualifying workout must stay below threshold");
  passed.push("first qualifying rating remains pending");

  const d2 = recordAdaptiveWorkout({
    state,
    config,
    programId: "level1",
    programDayCount: 4,
    weekIndex: 2,
    dayId: "day2-lower",
    dayIndex: 1,
    workoutKey: "w3-d2",
    rating: 4,
    trainingMode: "normal",
    setCandidate: day2Candidate,
  });
  state = d2.state;

  const weekKey = getAdaptiveWeekKey("level1", 2);
  const firstReview = state.pendingRecommendations[weekKey];

  assert(d2.weekQualified && d2.newlyQualified, "second qualifying workout must qualify week");
  assert(d2.shouldPresentCoach, "threshold must present Coach");
  assert(firstReview?.items.length === 3, "Day1 set + Day1 optional + Day2 set should all be offered");
  assert(firstReview?.items.every((item) => item.selected), "new offers should default selected");
  assert(Object.keys(state.setOverrides).length === 0, "offers must not silently change prescription");
  passed.push("threshold creates three selectable Coach offers without silent mutation");

  const selectedSetOnly = firstReview!.items
    .filter((item) => item.type === "set-increase")
    .map((item) => item.id);

  state = applyAdaptiveRecommendationSelection({
    state,
    programId: "level1",
    weekIndex: 2,
    selectedItemIds: selectedSetOnly,
  });

  assert(
    state.setOverrides[getAdaptiveExerciseKey("level1", "day1-push", "standard-push-ups")]?.sets === 4,
    "selected Day1 set offer must apply",
  );
  assert(
    state.setOverrides[getAdaptiveExerciseKey("level1", "day2-lower", "reverse-lunges")]?.sets === 4,
    "selected Day2 set offer must apply",
  );
  assert(
    state.activatedOptionalExercises[getAdaptiveExerciseKey("level1", "day1-push", "close-grip-push-ups")] == null,
    "unchecked optional offer must stay inactive",
  );
  assert(
    state.pendingRecommendations[weekKey]?.items.length === 3,
    "mid-week review must retain all offers",
  );
  passed.push("mid-week checkbox selection applies only selected offers and keeps full history");

  const day3Candidate = selectAdaptiveSetCandidate({
    programId: "level1",
    weekIndex: 2,
    dayId: "day3-pull",
    dayIndex: 2,
    maxSetsPerExercise: 5,
    exercises: [
      {
        exerciseId: "inverted-rows-bent-knees",
        currentSets: 3,
        programOrder: 0,
        applicableTargets: 3,
        metTargets: 3,
        beatenTargets: 2,
        overperformanceScore: 1.09,
      },
    ],
  });

  const d3 = recordAdaptiveWorkout({
    state,
    config,
    programId: "level1",
    programDayCount: 4,
    weekIndex: 2,
    dayId: "day3-pull",
    dayIndex: 2,
    workoutKey: "w3-d3",
    rating: 5,
    trainingMode: "normal",
    setCandidate: day3Candidate,
    rating5OptionalExerciseId: "reverse-snow-angels",
  });
  state = d3.state;

  assert(d3.shouldPresentCoach, "new later-week offers must reopen Coach");
  assert(state.pendingRecommendations[weekKey]?.items.length === 5, "later Coach must contain previous + new offers");
  assert(
    state.pendingRecommendations[weekKey]?.items.find((item) => item.exerciseId === "close-grip-push-ups")?.selected === false,
    "previously unchecked offer must remain unchecked",
  );
  passed.push("later qualifying workout reopens Coach with previous and new choices");

  const duplicate = recordAdaptiveWorkout({
    state,
    config,
    programId: "level1",
    programDayCount: 4,
    weekIndex: 2,
    dayId: "day3-pull",
    dayIndex: 2,
    workoutKey: "w3-d3",
    rating: 5,
    trainingMode: "normal",
    setCandidate: day3Candidate,
    rating5OptionalExerciseId: "reverse-snow-angels",
  });
  assert(!duplicate.shouldPresentCoach && duplicate.newItemCount === 0, "duplicate workout must be idempotent");
  passed.push("duplicate processing is idempotent");

  const allIds = state.pendingRecommendations[weekKey]!.items.map((item) => item.id);
  state = applyAdaptiveRecommendationSelection({
    state,
    programId: "level1",
    weekIndex: 2,
    selectedItemIds: allIds,
  });

  assert(
    state.activatedOptionalExercises[getAdaptiveExerciseKey("level1", "day1-push", "close-grip-push-ups")] != null,
    "previously unselected optional offer must be selectable later",
  );
  passed.push("user can change an earlier unaccepted offer on a later Coach visit");

  const finalSelected = state.pendingRecommendations[weekKey]!.items
    .filter((item) => item.exerciseId !== "standard-push-ups")
    .map((item) => item.id);

  state = closeAdaptiveWeekReview({
    state,
    programId: "level1",
    weekIndex: 2,
    selectedItemIds: finalSelected,
  });

  assert(state.pendingRecommendations[weekKey]?.closed === true, "final review must close weekly offers");
  assert(
    state.setOverrides[getAdaptiveExerciseKey("level1", "day1-push", "standard-push-ups")]?.sets !== 4,
    "final review must be able to reverse a mid-week accepted set increase",
  );
  assert(
    state.activatedOptionalExercises[getAdaptiveExerciseKey("level1", "day1-push", "close-grip-push-ups")] != null,
    "final review must preserve items still selected",
  );
  passed.push("final weekly review is authoritative and can reverse earlier choices");

  const liveSession = buildSession(beginnerProgram, 2, {
    includeWarmup: false,
    includeStretch: false,
    adaptiveVolume: state,
    completedSessions: [],
  });
  const liveMain = liveSession.blocks.find((block) => block.type === "main");
  const adaptedPull = liveMain?.exercises.find(
    (exercise: any) => exercise.exerciseId === "inverted-rows-bent-knees",
  );
  const newOptional = liveMain?.exercises.find(
    (exercise: any) => exercise.exerciseId === "reverse-snow-angels",
  );

  assert(adaptedPull?.sets === 4, "selected set override must reach live session");
  assert(newOptional != null, "selected optional activation must reach live session");
  assert(newOptional?.adaptiveBaselineOnly === true, "first optional exposure must be baseline-only");
  passed.push("final selected prescription reaches live session and optional starts baseline-only");

  const excluded = recordAdaptiveWorkout({
    state,
    config,
    programId: "level1",
    programDayCount: 4,
    weekIndex: 3,
    dayId: "day1-push",
    dayIndex: 0,
    workoutKey: "w4-deload",
    rating: 5,
    trainingMode: "deload-fatigue",
    setCandidate: day1Candidate,
  });
  assert(!excluded.weekQualified, "deload/verification/recovery must not qualify adaptive volume");
  passed.push("deload/verification/recovery modes remain excluded");

  const disabled = recordAdaptiveWorkout({
    state: EMPTY_ADAPTIVE_PROGRAM_STATE,
    config: { ...config, enabled: false },
    programId: "level1",
    programDayCount: 4,
    weekIndex: 2,
    dayId: "day1-push",
    dayIndex: 0,
    workoutKey: "disabled",
    rating: 5,
    trainingMode: "normal",
    setCandidate: day1Candidate,
  });
  assert(Object.keys(disabled.state.weekly).length === 0, "disabled adaptive volume must record nothing");
  passed.push("adaptive volume OFF records no adaptive evidence or prescription changes");

  return passed;
}

// hooks/useProgress.ts

import { useEffect, useState } from "react";
import { programs } from "@/data/programs";
import {
  saveProgress,
  loadProgress,
} from "@/storage/progressStorage";

export type WorkoutAccessStatus =
  | "completed"
  | "current"
  | "locked";

type WorkoutProgress = {
  completedSets: number;
  totalSets: number;
  completed: boolean;
};

export function useProgress() {
  const [
    programIndex,
    setProgramIndex,
  ] = useState(0);

  const [
    week,
    setWeek,
  ] = useState(0);

  const [
    day,
    setDay,
  ] = useState(0);

  const [
    isLoaded,
    setIsLoaded,
  ] = useState(false);

  const program =
    programs[programIndex];

  // -----------------------------------
  // WORKOUT PROGRESS
  // -----------------------------------

  const [
    workouts,
    setWorkouts,
  ] = useState<
    Record<
      string,
      WorkoutProgress
    >
  >({});

  // -----------------------------------
  // LOAD
  // -----------------------------------

  useEffect(() => {
    const init = async () => {
      const saved =
        await loadProgress();

      if (saved) {
        setProgramIndex(
          saved.programIndex ?? 0,
        );

        setWeek(
          saved.week ?? 0,
        );

        setDay(
          saved.day ?? 0,
        );

        setWorkouts(
          saved.workouts ?? {},
        );
      }

      setIsLoaded(true);
    };

    init();
  }, []);

  // -----------------------------------
  // SAVE
  // -----------------------------------

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveProgress({
      programIndex,
      week,
      day,
      workouts,
    });
  }, [
    programIndex,
    week,
    day,
    workouts,
    isLoaded,
  ]);

  // -----------------------------------
  // WORKOUT KEY
  // -----------------------------------

  const getWorkoutProgressKey = (
    pIndex: number,
    weekIndex: number,
    dayIndex: number,
  ) =>
    `${pIndex}-${weekIndex}-${dayIndex}`;

  // -----------------------------------
  // SAVE INDIVIDUAL WORKOUT PROGRESS
  // -----------------------------------

  const saveWorkoutProgress = (
    targetProgramIndex: number,
    targetWeek: number,
    targetDay: number,
    data: WorkoutProgress,
  ) => {
    const key =
      getWorkoutProgressKey(
        targetProgramIndex,
        targetWeek,
        targetDay,
      );

    setWorkouts(
      (previous) => ({
        ...previous,

        [key]: data,
      }),
    );
  };

  // -----------------------------------
  // GET STORED WORKOUT PROGRESS
  // -----------------------------------

  const getStoredWorkoutProgress = (
    dayIndex: number,
  ):
    | WorkoutProgress
    | undefined => {
    const key =
      getWorkoutProgressKey(
        programIndex,
        week,
        dayIndex,
      );

    return workouts[key];
  };

  // -----------------------------------
  // WORKOUT ACCESS STATUS
  // -----------------------------------
  //
  // completed:
  //   workout has already been completed
  //
  // current:
  //   this is the workout the user may perform now
  //
  // locked:
  //   future workout
  // -----------------------------------

  const getDayStatus = (
    dayIndex: number,
  ): WorkoutAccessStatus => {
    const storedProgress =
      getStoredWorkoutProgress(
        dayIndex,
      );

    /**
     * Persisted completion is authoritative.
     */
    if (
      storedProgress?.completed ===
      true
    ) {
      return "completed";
    }

    /**
     * Backward compatibility:
     *
     * If the cursor has already moved beyond
     * this day, the workout must previously
     * have been completed.
     *
     * Older progress data may not contain a
     * workouts entry for every completed day.
     */
    if (
      dayIndex < day
    ) {
      return "completed";
    }

    if (
      dayIndex === day
    ) {
      return "current";
    }

    return "locked";
  };

  // -----------------------------------
  // CAN OPEN WORKOUT
  // -----------------------------------

  const canOpenDay = (
    dayIndex: number,
  ) =>
    getDayStatus(dayIndex) ===
    "current";

  // -----------------------------------
  // DAY PROGRESS
  // -----------------------------------

  const getDayProgress = (
    dayIndex: number,
  ) => {
    const workout =
      getStoredWorkoutProgress(
        dayIndex,
      );

    if (
      workout &&
      workout.totalSets > 0
    ) {
      return (
        workout.completedSets /
        workout.totalSets
      );
    }

    /**
     * Older progress data may not contain
     * detailed set progress.
     *
     * If the lifecycle cursor has already
     * passed this workout, show it as 100%.
     */
    if (
      getDayStatus(dayIndex) ===
      "completed"
    ) {
      return 1;
    }

    return 0;
  };

  // -----------------------------------
  // COMPLETE WORKOUT
  // -----------------------------------

  const completeWorkout = () => {
    const nextDay =
      day + 1;

    // -----------------------------------
    // NEXT DAY IN SAME WEEK
    // -----------------------------------

    if (
      nextDay <
      program.days.length
    ) {
      setDay(nextDay);

      return;
    }

    // -----------------------------------
    // NEXT WEEK
    // -----------------------------------

    const nextWeek =
      week + 1;

    if (
      nextWeek <
      program.weeks
    ) {
      setWeek(nextWeek);

      setDay(0);

      return;
    }

    // -----------------------------------
    // PROGRAM COMPLETE
    // -----------------------------------
    //
    // Do not automatically move programs yet.
    //
    // Graduation / readiness should determine
    // what happens next.
    // -----------------------------------
  };

  // -----------------------------------
  // DEV TESTING
  // -----------------------------------

  const setTestProgress = (
    pIndex: number,
    w: number,
    d: number,
  ) => {
    if (!__DEV__) {
      return;
    }

    setProgramIndex(pIndex);
    setWeek(w);
    setDay(d);
  };

  return {
    program,

    programIndex,

    week,

    day,

    workouts,

    completeWorkout,

    isLoaded,

    setTestProgress,

    saveWorkoutProgress,

    getDayProgress,

    getDayStatus,

    canOpenDay,
  };
}
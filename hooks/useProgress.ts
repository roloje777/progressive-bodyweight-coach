// hooks/useProgress.ts

import { useEffect, useState } from "react";
import { programs } from "@/data/programs";
import { saveProgress, loadProgress, WorkoutProgress } from "@/storage/progressStorage";
import { PendingGraduation } from "@/models/ProgramProgress";

export type WorkoutAccessStatus = "completed" | "current" | "locked";


export function useProgress() {
  const [programIndex, setProgramIndex] = useState(0);

  const [week, setWeek] = useState(0);

  const [day, setDay] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);

  const program = programs[programIndex];

  // -----------------------------------
  // WORKOUT PROGRESS
  // -----------------------------------

  const [workouts, setWorkouts] = useState<Record<string, WorkoutProgress>>({});

  const [pendingGraduation, setPendingGraduation] =
    useState<PendingGraduation | null>(null);

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

      setPendingGraduation(
        saved.pendingGraduation ?? null,
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
       pendingGraduation,
    });
  }, [programIndex, week, day, workouts, pendingGraduation, isLoaded,]);

  // Temp for testing
  useEffect(() => {
  if (!isLoaded) {
    return;
  }

  console.log("🎓 PENDING GRADUATION STATE", {
    programIndex,
    activeProgramId:
      programs[programIndex]?.id,

    week,
    day,

    pendingGraduation,
  });
}, [
  programIndex,
  week,
  day,
  pendingGraduation,
  isLoaded,
]);

  // -----------------------------------
  // WORKOUT KEY
  // -----------------------------------

  const getWorkoutProgressKey = (
    pIndex: number,
    weekIndex: number,
    dayIndex: number,
  ) => `${pIndex}-${weekIndex}-${dayIndex}`;

  // -----------------------------------
  // SAVE INDIVIDUAL WORKOUT PROGRESS
  // -----------------------------------

  const saveWorkoutProgress = (
    targetProgramIndex: number,
    targetWeek: number,
    targetDay: number,
    data: WorkoutProgress,
  ) => {
    const key = getWorkoutProgressKey(
      targetProgramIndex,
      targetWeek,
      targetDay,
    );

    setWorkouts((previous) => ({
      ...previous,

      [key]: data,
    }));
  };

  // -----------------------------------
  // GET STORED WORKOUT PROGRESS
  // -----------------------------------

  const getStoredWorkoutProgress = (
    dayIndex: number,
  ): WorkoutProgress | undefined => {
    const key = getWorkoutProgressKey(programIndex, week, dayIndex);

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

  const getDayStatus = (dayIndex: number): WorkoutAccessStatus => {
    const storedProgress = getStoredWorkoutProgress(dayIndex);

    /**
     * Persisted completion is authoritative.
     */
    if (storedProgress?.completed === true) {
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
    if (dayIndex < day) {
      return "completed";
    }

    if (dayIndex === day) {
      return "current";
    }

    return "locked";
  };

  // -----------------------------------
  // CAN OPEN WORKOUT
  // -----------------------------------

  const canOpenDay = (dayIndex: number) => getDayStatus(dayIndex) === "current";

  // -----------------------------------
  // DAY PROGRESS
  // -----------------------------------

  const getDayProgress = (dayIndex: number) => {
    const workout = getStoredWorkoutProgress(dayIndex);

    if (workout && workout.totalSets > 0) {
      return workout.completedSets / workout.totalSets;
    }

    /**
     * Older progress data may not contain
     * detailed set progress.
     *
     * If the lifecycle cursor has already
     * passed this workout, show it as 100%.
     */
    if (getDayStatus(dayIndex) === "completed") {
      return 1;
    }

    return 0;
  };

  // -----------------------------------
  // COMPLETE WORKOUT
  // -----------------------------------

  const completeWorkout = () => {
    const nextDay = day + 1;

    // -----------------------------------
    // NEXT DAY IN SAME WEEK
    // -----------------------------------

    if (nextDay < program.days.length) {
      setDay(nextDay);

      return;
    }

    // -----------------------------------
    // NEXT WEEK
    // -----------------------------------

    const nextWeek = week + 1;

    if (nextWeek < program.weeks) {
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
  const recordGraduationEligibility = (
  nextProgramId: string,
) => {
  /**
   * Once earned, do not overwrite the original
   * graduation point simply because the user
   * trained another optional week.
   */
  if (
    pendingGraduation?.programId ===
    program.id
  ) {
    return;
  }

  setPendingGraduation({
    programId:
      program.id,

    nextProgramId,

    earnedAtWeekIndex:
      week,

    earnedAt:
      new Date().toISOString(),
  });
};

const trainAnotherWeek = () => {
  /**
   * This action is only meaningful when graduation
   * has already been earned for the current program.
   */
  if (
    !pendingGraduation ||
    pendingGraduation.programId !==
      program.id
  ) {
    return false;
  }

  /**
   * The configured program.weeks value is the
   * structured progression period, NOT the maximum
   * week the user is permitted to perform.
   *
   * Therefore:
   *
   * Week 4 completed
   * user chooses another week
   *
   * weekIndex:
   * 3 → 4
   *
   * displayed:
   * Week 4 → Week 5
   */
  setWeek(
    (currentWeek) =>
      currentWeek + 1,
  );

  setDay(0);

  /**
   * IMPORTANT:
   *
   * Do NOT clear pendingGraduation.
   *
   * The user already earned graduation.
   */
  return true;
};

const acceptGraduation = () => {
  if (!pendingGraduation) {
    return false;
  }

  const nextProgramIndex =
    programs.findIndex(
      (candidate) =>
        candidate.id ===
        pendingGraduation.nextProgramId,
    );

  if (nextProgramIndex < 0) {
    console.error(
      "Unable to progress: next program not found",
      {
        nextProgramId:
          pendingGraduation.nextProgramId,
      },
    );

    return false;
  }

  // -----------------------------------
  // ACTIVATE NEXT PROGRAM
  // -----------------------------------

  setProgramIndex(
    nextProgramIndex,
  );

  // -----------------------------------
  // START NEXT PROGRAM
  // -----------------------------------

  setWeek(0);

  setDay(0);

  // -----------------------------------
  // GRADUATION DECISION COMPLETE
  // -----------------------------------

  setPendingGraduation(
    null,
  );

  return true;
};


  // -----------------------------------
  // DEV TESTING
  // -----------------------------------

  const setTestProgress = (pIndex: number, w: number, d: number) => {
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

  pendingGraduation,

  completeWorkout,

  isLoaded,

  setTestProgress,

  saveWorkoutProgress,

  getDayProgress,

  getDayStatus,

  canOpenDay,

  recordGraduationEligibility,

  trainAnotherWeek,

  acceptGraduation,
};
}

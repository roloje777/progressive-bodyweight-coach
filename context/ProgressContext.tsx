// context/ProgressContext.tsx

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { programs } from "@/data/programs";

import { loadProgress, saveProgress } from "@/storage/progressStorage";

import {
  ActiveDeload,
  DeloadReason,
  PendingGraduation,
} from "@/models/ProgramProgress";
import {
  createActiveDeload,
  moveDeloadToVerification,
} from "@/engine/DeloadEngine";

export type WorkoutAccessStatus = "completed" | "current" | "locked";

type WorkoutProgress = {
  completedSets: number;
  totalSets: number;
  completed: boolean;
};

type ProgressContextValue = {
  program: (typeof programs)[number];

  programIndex: number;

  week: number;

  day: number;

  workouts: Record<string, WorkoutProgress>;

  pendingGraduation: PendingGraduation | null;

  activeDeload: ActiveDeload | null;

  isLoaded: boolean;

  completeWorkout: () => void;

  setTestProgress: (pIndex: number, w: number, d: number) => void;

  saveWorkoutProgress: (
    targetProgramIndex: number,
    targetWeek: number,
    targetDay: number,
    data: WorkoutProgress,
  ) => void;

  getDayProgress: (dayIndex: number) => number;

  getDayStatus: (dayIndex: number) => WorkoutAccessStatus;

  canOpenDay: (dayIndex: number) => boolean;

  recordGraduationEligibility: (nextProgramId: string) => void;

  trainAnotherWeek: () => boolean;

  acceptGraduation: () => boolean;

  suspendGraduationEligibility: () => void;

  activateDeload: (reason: DeloadReason) => void;

  startDeloadWeek: () => boolean;

  beginVerificationPhase: () => boolean;

  clearDeload: () => void;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined,
);

type ProgressProviderProps = {
  children: ReactNode;
};

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [programIndex, setProgramIndex] = useState(0);

  const [week, setWeek] = useState(0);

  const [day, setDay] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);

  const [workouts, setWorkouts] = useState<Record<string, WorkoutProgress>>({});

  const [pendingGraduation, setPendingGraduation] =
    useState<PendingGraduation | null>(null);

  const [activeDeload, setActiveDeload] =
    useState<ActiveDeload | null>(null);

  const program = programs[programIndex];

  // -----------------------------------
  // LOAD
  // -----------------------------------

  useEffect(() => {
    const init = async () => {
      const saved = await loadProgress();

      if (saved) {
        setProgramIndex(saved.programIndex ?? 0);

        setWeek(saved.week ?? 0);

        setDay(saved.day ?? 0);

        setWorkouts(saved.workouts ?? {});

        setPendingGraduation(saved.pendingGraduation ?? null);

        setActiveDeload(saved.activeDeload ?? null);
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
      activeDeload,
    });
  }, [
    programIndex,
    week,
    day,
    workouts,
    pendingGraduation,
    activeDeload,
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
  // SAVE WORKOUT PROGRESS
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
  // GET WORKOUT PROGRESS
  // -----------------------------------

  const getStoredWorkoutProgress = (dayIndex: number) => {
    const key = getWorkoutProgressKey(programIndex, week, dayIndex);

    return workouts[key];
  };

  // -----------------------------------
  // DAY STATUS
  // -----------------------------------

  const getDayStatus = (dayIndex: number): WorkoutAccessStatus => {
    const storedProgress = getStoredWorkoutProgress(dayIndex);

    if (storedProgress?.completed === true) {
      return "completed";
    }

    if (dayIndex < day) {
      return "completed";
    }

    if (dayIndex === day) {
      return "current";
    }

    return "locked";
  };

  // -----------------------------------
  // CAN OPEN DAY
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

    if (nextDay < program.days.length) {
      setDay(nextDay);

      return;
    }

    const nextWeek = week + 1;

    if (nextWeek < program.weeks) {
      setWeek(nextWeek);

      setDay(0);

      return;
    }

    /**
     * End of configured progression
     * period.
     *
     * Do not automatically change
     * programs.
     */
  };

  // -----------------------------------
  // RECORD GRADUATION
  // -----------------------------------

  const recordGraduationEligibility = (nextProgramId: string) => {
    setPendingGraduation((current) => {
      /**
       * First time progression is earned.
       */
      if (!current || current.programId !== program.id) {
        return {
          programId: program.id,

          nextProgramId,

          earnedAtWeekIndex: week,

          earnedAt: new Date().toISOString(),

          confirmedAtWeekIndex: week,

          eligible: true,
        };
      }

      /**
       * Previously earned.
       *
       * Preserve the original achievement,
       * but refresh current readiness.
       */
      return {
        ...current,

        nextProgramId,

        confirmedAtWeekIndex: week,

        eligible: true,
      };
    });
  };

  // -----------------------------------
  // TRAIN ANOTHER WEEK
  // -----------------------------------

  const trainAnotherWeek = () => {
    if (!pendingGraduation || pendingGraduation.programId !== program.id) {
      return false;
    }

    setWeek((currentWeek) => currentWeek + 1);

    setDay(0);

    /**
     * Graduation remains earned.
     */
    return true;
  };

  // -----------------------------------
  // ACCEPT GRADUATION
  // -----------------------------------

  const acceptGraduation = () => {
    if (!pendingGraduation) {
      return false;
    }

    const nextProgramIndex = programs.findIndex(
      (candidate) => candidate.id === pendingGraduation.nextProgramId,
    );

    if (nextProgramIndex < 0) {
      console.error("Unable to progress: next program not found", {
        nextProgramId: pendingGraduation.nextProgramId,
      });

      return false;
    }

    setProgramIndex(nextProgramIndex);

    setWeek(0);

    setDay(0);

    setPendingGraduation(null);

    setActiveDeload(null);

    return true;
  };

  // Suspend Graduation

  const suspendGraduationEligibility = () => {
    setPendingGraduation((current) => {
      if (!current || current.programId !== program.id) {
        return current;
      }

      return {
        ...current,
        eligible: false,
      };
    });
  };

  // -----------------------------------
  // DELOAD STATE
  // -----------------------------------

  const activateDeload = (reason: DeloadReason) => {
    setActiveDeload(
      createActiveDeload(
        program.id,
        week,
        reason,
      ),
    );

    // Any previously earned graduation remains recorded,
    // but cannot be acted on while recovery is required.
    suspendGraduationEligibility();
  };

  const startDeloadWeek = () => {
    if (
      !activeDeload ||
      activeDeload.programId !== program.id ||
      activeDeload.phase !== "deload"
    ) {
      return false;
    }

    setWeek(activeDeload.deloadWeekIndex);
    setDay(0);

    return true;
  };

  const beginVerificationPhase = () => {
    if (
      !activeDeload ||
      activeDeload.programId !== program.id ||
      activeDeload.phase !== "deload"
    ) {
      return false;
    }

    const verificationState = moveDeloadToVerification(activeDeload);

    setActiveDeload(verificationState);

    if (verificationState.verificationWeekIndex != null) {
      setWeek(verificationState.verificationWeekIndex);
      setDay(0);
    }

    return true;
  };

  const clearDeload = () => {
    setActiveDeload(null);
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

  return (
    <ProgressContext.Provider
      value={{
        program,

        programIndex,

        week,

        day,

        workouts,

        pendingGraduation,

        activeDeload,

        isLoaded,

        completeWorkout,

        setTestProgress,

        saveWorkoutProgress,

        getDayProgress,

        getDayStatus,

        canOpenDay,

        recordGraduationEligibility,
        
        suspendGraduationEligibility,

        trainAnotherWeek,

        acceptGraduation,

        activateDeload,

        startDeloadWeek,

        beginVerificationPhase,

        clearDeload,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressContext() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used inside ProgressProvider");
  }

  return context;
}

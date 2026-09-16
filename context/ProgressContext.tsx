// context/ProgressContext.tsx

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { programs } from "@/data/programs";
import { getTrainingCycleForPreset } from "@/data/recommendedTrainingCycles";

import { loadProgress, saveProgress } from "@/storage/progressStorage";
import { getWorkoutHistory } from "@/storage/workoutStorage";
import { recordProgramLifecycleEvent } from "@/storage/programLifecycleStorage";

import {
  ActiveDeload,
  ActiveMaintenance,
  ActiveRepeatWeek,
  DeloadReason,
  PendingGraduation,
} from "@/models/ProgramProgress";
import { CompletedSession, WorkoutReason } from "@/models/WorkoutLog";
import { TrainingScheduleStatus } from "@/models/TrainingSchedule";
import {
  AdaptiveProgramState,
  AdaptiveWorkoutSetCandidate,
  EMPTY_ADAPTIVE_PROGRAM_STATE,
  normalizeAdaptiveProgramState,
} from "@/models/AdaptiveVolume";

import {
  createActiveDeload,
  moveDeloadToVerification,
} from "@/engine/DeloadEngine";
import {
  evaluateNormalTrainingSchedule,
  evaluatePainRecoverySchedule,
} from "@/engine/TrainingScheduleEngine";
import { useTrainingScheduleSettings } from "@/hooks/useTrainingScheduleSettings";
import { useAdaptiveVolumeSettings } from "@/hooks/useAdaptiveVolumeSettings";
import {
  applyAdaptiveRecommendationSelection,
  closeAdaptiveWeekReview,
  recordAdaptiveWorkout,
} from "@/engine/AdaptiveVolumeEngine";

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

  activeMaintenance: ActiveMaintenance | null;

  /** Why workouts in the currently selected week are being scheduled. */
  workoutReason: WorkoutReason;

  /** Accepted user-specific adaptive prescription + pending Coach state. */
  adaptiveVolume: AdaptiveProgramState;

  recordAdaptiveWorkoutRecommendation: (input: {
    programId: string;
    programDayCount: number;
    weekIndex: number;
    dayId: string;
    dayIndex: number;
    workoutKey: string;
    rating: number;
    trainingMode?: string;
    setCandidate?: AdaptiveWorkoutSetCandidate;
    rating5OptionalExerciseId?: string;
  }) => { shouldPresentCoach: boolean; hasWeekOffers: boolean; newlyQualified: boolean };

  applyAdaptiveVolumeSelection: (
    programId: string,
    weekIndex: number,
    selectedItemIds: string[],
    closeWeek?: boolean,
  ) => boolean;

  completedSessions: CompletedSession[];

  trainingScheduleStatus: TrainingScheduleStatus;

  isLoaded: boolean;

  refreshProgressState: () => Promise<void>;

  refreshWorkoutHistory: () => Promise<void>;

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

  startRepeatWeek: (completedWeekIndex: number) => boolean;

  startMaintenance: (completedWeekIndex: number) => boolean;

  acceptGraduation: () => boolean;

  suspendGraduationEligibility: () => void;

  activateDeload: (reason: DeloadReason) => void;

  beginPainRecovery: (triggeredAtWeekIndex: number) => boolean;

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
  const { trainingScheduleConfig } = useTrainingScheduleSettings();
  const { adaptiveVolumeConfig } = useAdaptiveVolumeSettings();

  const [programIndex, setProgramIndex] = useState(0);

  const [week, setWeek] = useState(0);

  const [day, setDay] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);

  const [workouts, setWorkouts] = useState<Record<string, WorkoutProgress>>({});

  const [pendingGraduation, setPendingGraduation] =
    useState<PendingGraduation | null>(null);

  const [activeDeload, setActiveDeload] = useState<ActiveDeload | null>(null);

  const [activeRepeatWeek, setActiveRepeatWeek] =
    useState<ActiveRepeatWeek | null>(null);

  const [activeMaintenance, setActiveMaintenance] =
    useState<ActiveMaintenance | null>(null);

  const [adaptiveVolume, setAdaptiveVolume] = useState<AdaptiveProgramState>(
    EMPTY_ADAPTIVE_PROGRAM_STATE,
  );

  const [completedSessions, setCompletedSessions] = useState<
    CompletedSession[]
  >([]);

  const program = programs[programIndex];

  const recordLifecycleEventSafely = useCallback(
    (input: Parameters<typeof recordProgramLifecycleEvent>[0]) => {
      void recordProgramLifecycleEvent(input).catch((error) => {
        console.error("Failed to record program lifecycle event", error);
      });
    },
    [],
  );

  const effectiveTrainingCycle = useMemo(
    () =>
      getTrainingCycleForPreset({
        presetId: trainingScheduleConfig.trainingCyclePresetId,
        programDefaultCycle: program.recommendedCycle,
        programDayCount: program.days.length,
      }),
    [
      trainingScheduleConfig.trainingCyclePresetId,
      program.recommendedCycle,
      program.days.length,
    ],
  );

  // -----------------------------------
  // LOAD
  // -----------------------------------

  useEffect(() => {
    const init = async () => {
      const [saved, history] = await Promise.all([
        loadProgress(),
        getWorkoutHistory(),
      ]);

      setCompletedSessions(history);

      if (saved) {
        setProgramIndex(saved.programIndex ?? 0);

        setWeek(saved.week ?? 0);

        setDay(saved.day ?? 0);

        setWorkouts(saved.workouts ?? {});

        setPendingGraduation(saved.pendingGraduation ?? null);

        setActiveDeload(saved.activeDeload ?? null);

        setActiveRepeatWeek(saved.activeRepeatWeek ?? null);

        setActiveMaintenance(saved.activeMaintenance ?? null);

        setAdaptiveVolume(normalizeAdaptiveProgramState(saved.adaptiveVolume));
      }

      setIsLoaded(true);
    };

    init();
  }, []);

  // -----------------------------------
  // WORKOUT HISTORY / TRAINING SCHEDULE
  // -----------------------------------

  const refreshWorkoutHistory = useCallback(async () => {
    const history = await getWorkoutHistory();

    setCompletedSessions(history);
  }, []);

  const refreshProgressState = useCallback(async () => {
    const [saved, history] = await Promise.all([
      loadProgress(),
      getWorkoutHistory(),
    ]);

    setCompletedSessions(history);

    if (!saved) {
      return;
    }

    setProgramIndex(saved.programIndex ?? 0);
    setWeek(saved.week ?? 0);
    setDay(saved.day ?? 0);
    setWorkouts(saved.workouts ?? {});
    setPendingGraduation(saved.pendingGraduation ?? null);
    setActiveDeload(saved.activeDeload ?? null);
    setActiveRepeatWeek(saved.activeRepeatWeek ?? null);
    setActiveMaintenance(saved.activeMaintenance ?? null);
    setAdaptiveVolume(normalizeAdaptiveProgramState(saved.adaptiveVolume));
  }, []);

  /**
   * Normal scheduling is derived from real completed-session timestamps.
   *
   * Only sessions belonging to the current program participate here.
   * Pain-recovery scheduling is intentionally handled separately in Phase 5.3.
   *
   * The engine remains advisory for normal training:
   * trainingScheduleStatus.canTrain is always true.
   */
  const normalProgramSessions = useMemo(
    () =>
      completedSessions.filter(
        (session) =>
          session.programId === program.id &&
          session.trainingMode !== "deload-pain",
      ),
    [completedSessions, program.id],
  );

  const isPainRecoveryScheduleActive =
    activeDeload?.programId === program.id &&
    activeDeload.phase === "deload" &&
    activeDeload.reason === "pain" &&
    week === activeDeload.deloadWeekIndex;

  /**
   * Only recovery sessions from the CURRENT pain-recovery cycle are
   * relevant for mandatory spacing.
   *
   * Historical pain-recovery sessions from older cycles must not affect
   * the current cycle's eligibility.
   */
  const painRecoverySessions = useMemo(
    () =>
      isPainRecoveryScheduleActive && activeDeload
        ? completedSessions.filter(
            (session) =>
              session.programId === program.id &&
              session.trainingMode === "deload-pain" &&
              session.weekIndex === activeDeload.deloadWeekIndex,
          )
        : [],
    [completedSessions, program.id, activeDeload, isPainRecoveryScheduleActive],
  );

  const latestPainRecoverySession = useMemo(() => {
    if (painRecoverySessions.length === 0) {
      return undefined;
    }

    return [...painRecoverySessions]
      .sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
      )
      .at(-1);
  }, [painRecoverySessions]);

  /**
   * Scheduling authority:
   *
   * normal training
   *   advisory only; canTrain remains true
   *
   * pain recovery
   *   mandatory minimum spacing; canTrain remains false until the
   *   configured minimum number of FULL rest days has elapsed
   *
   * Initial pain-recovery spacing is measured from recoveryStartedAt,
   * which is set when the user actually chooses to begin the Recovery Cycle.
   *
   * createdAt remains a backward-compatible fallback for older saved progress.
   *
   * Subsequent spacing is measured from the latest completed pain-recovery
   * session.
   */
  const trainingScheduleStatus = useMemo(() => {
    if (isPainRecoveryScheduleActive && activeDeload) {
      return evaluatePainRecoverySchedule({
        referenceTimestamp:
          latestPainRecoverySession?.completedAt ??
          activeDeload.recoveryStartedAt ??
          activeDeload.createdAt,
        history: painRecoverySessions,
        isFirstRecoverySession: latestPainRecoverySession == null,
        config: trainingScheduleConfig,
      });
    }

    return evaluateNormalTrainingSchedule({
      cycle: effectiveTrainingCycle,
      currentDayIndex: day,
      history: normalProgramSessions,
      config: trainingScheduleConfig,
    });
  }, [
    isPainRecoveryScheduleActive,
    activeDeload,
    latestPainRecoverySession,
    painRecoverySessions,
    effectiveTrainingCycle,
    day,
    normalProgramSessions,
    trainingScheduleConfig,
  ]);

  const workoutReason: WorkoutReason =
    activeRepeatWeek?.programId === program.id &&
    activeRepeatWeek.weekIndex === week
      ? "repeat"
      : "scheduled";

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
      activeRepeatWeek,
      activeMaintenance,
      adaptiveVolume,
    });
  }, [
    programIndex,
    week,
    day,
    workouts,
    pendingGraduation,
    activeDeload,
    activeRepeatWeek,
    activeMaintenance,
    adaptiveVolume,
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
      /**
       * Normal recovery recommendations never lock training.
       *
       * Pain recovery is different: the current recovery day remains
       * inaccessible until the mandatory minimum rest interval has elapsed.
       */
      if (
        isPainRecoveryScheduleActive &&
        trainingScheduleStatus.canTrain === false
      ) {
        return "locked";
      }

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
  // ADAPTIVE VOLUME COACH STATE
  // -----------------------------------

  const recordAdaptiveWorkoutRecommendation: ProgressContextValue["recordAdaptiveWorkoutRecommendation"] =
    (input) => {
      const result = recordAdaptiveWorkout({
        state: adaptiveVolume,
        config: adaptiveVolumeConfig,
        ...input,
      });

      setAdaptiveVolume(result.state);

      const weekKey = `${input.programId}:${input.weekIndex}`;
      const recommendation = result.state.pendingRecommendations[weekKey];

      return {
        shouldPresentCoach: result.shouldPresentCoach,
        hasWeekOffers:
          recommendation != null &&
          recommendation.closed !== true &&
          recommendation.items.length > 0,
        newlyQualified: result.newlyQualified,
      };
    };

  const applyAdaptiveVolumeSelection = (
    targetProgramId: string,
    targetWeekIndex: number,
    selectedItemIds: string[],
    closeWeek = false,
  ) => {
    const weekKey = `${targetProgramId}:${targetWeekIndex}`;
    const recommendation = adaptiveVolume.pendingRecommendations[weekKey];

    if (!recommendation || recommendation.closed) {
      return false;
    }

    const nextState = closeWeek
      ? closeAdaptiveWeekReview({
          state: adaptiveVolume,
          programId: targetProgramId,
          weekIndex: targetWeekIndex,
          selectedItemIds,
        })
      : applyAdaptiveRecommendationSelection({
          state: adaptiveVolume,
          programId: targetProgramId,
          weekIndex: targetWeekIndex,
          selectedItemIds,
        });

    setAdaptiveVolume(nextState);
    return true;
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
     * Once maintenance has explicitly been unlocked, the highest program is
     * open-ended. Each completed maintenance block rolls into another normal
     * program week so Analytics, MB, recovery and coaching keep receiving
     * ordinary training history.
     */
    if (
      program.progressionMode === "maintenance" &&
      activeMaintenance?.programId === program.id
    ) {
      setWeek(nextWeek);
      setDay(0);
      return;
    }

    /**
     * End of configured progression period. The first successful completion
     * of a maintenance program is intentionally held here until the user sees
     * and accepts the Maintenance Coach milestone.
     */
  };

  // -----------------------------------
  // RECORD GRADUATION
  // -----------------------------------

  const recordGraduationEligibility = (nextProgramId: string) => {
    const occurredAt = new Date().toISOString();
    const firstEarnedForProgram =
      !pendingGraduation || pendingGraduation.programId !== program.id;

    if (firstEarnedForProgram) {
      recordLifecycleEventSafely({
        type: "graduation-earned",
        programId: program.id,
        nextProgramId,
        weekIndex: week,
        occurredAt,
      });
    }

    setPendingGraduation((current) => {
      if (!current || current.programId !== program.id) {
        return {
          programId: program.id,
          nextProgramId,
          earnedAtWeekIndex: week,
          earnedAt: occurredAt,
          confirmedAtWeekIndex: week,
          eligible: true,
        };
      }

      return {
        ...current,
        nextProgramId,
        confirmedAtWeekIndex: week,
        eligible: true,
      };
    });
  };

  // -----------------------------------
  // MAINTENANCE
  // -----------------------------------

  const startMaintenance = (completedWeekIndex: number) => {
    if (program.progressionMode !== "maintenance") {
      return false;
    }

    const maintenanceWeekIndex = Math.max(
      completedWeekIndex + 1,
      program.weeks,
    );
    const occurredAt = new Date().toISOString();

    setActiveMaintenance({
      programId: program.id,
      startedAtWeekIndex: maintenanceWeekIndex,
      enteredAt: occurredAt,
    });
    setActiveRepeatWeek(null);
    setPendingGraduation(null);

    recordLifecycleEventSafely({
      type: "maintenance-started",
      programId: program.id,
      weekIndex: maintenanceWeekIndex,
      occurredAt,
    });

    setWeek(maintenanceWeekIndex);
    setDay(0);
    return true;
  };

  // -----------------------------------
  // TRAIN ANOTHER WEEK
  // -----------------------------------

  const startRepeatWeek = (completedWeekIndex: number) => {
    const repeatWeekIndex = completedWeekIndex + 1;
    const occurredAt = new Date().toISOString();

    setActiveRepeatWeek({
      programId: program.id,
      weekIndex: repeatWeekIndex,
      createdAt: occurredAt,
    });

    recordLifecycleEventSafely({
      type: "repeat-week-started",
      programId: program.id,
      weekIndex: repeatWeekIndex,
      occurredAt,
    });

    setWeek(repeatWeekIndex);
    setDay(0);

    return true;
  };

  const trainAnotherWeek = () => {
    if (!pendingGraduation || pendingGraduation.programId !== program.id) {
      return false;
    }

    /**
     * Graduation remains earned while the optional week reconfirms readiness.
     */
    return startRepeatWeek(week);
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

    const occurredAt = new Date().toISOString();

    recordLifecycleEventSafely({
      type: "graduated",
      programId: pendingGraduation.programId,
      nextProgramId: pendingGraduation.nextProgramId,
      weekIndex: pendingGraduation.confirmedAtWeekIndex,
      occurredAt,
    });

    recordLifecycleEventSafely({
      type: "program-started",
      programId: pendingGraduation.nextProgramId,
      weekIndex: 0,
      occurredAt,
    });

    setProgramIndex(nextProgramIndex);

    setWeek(0);

    setDay(0);

    setPendingGraduation(null);

    setActiveRepeatWeek(null);

    setActiveMaintenance(null);

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
    const deload = createActiveDeload(program.id, week, reason);

    setActiveDeload(deload);

    recordLifecycleEventSafely({
      type: "deload-triggered",
      programId: program.id,
      weekIndex: week,
      deloadReason: reason,
      occurredAt: deload.createdAt,
    });

    // Any previously earned graduation remains recorded,
    // but cannot be acted on while recovery is required.
    suspendGraduationEligibility();
  };

  const beginPainRecovery = (triggeredAtWeekIndex: number) => {
    const recovery = createActiveDeload(
      program.id,
      triggeredAtWeekIndex,
      "pain",
    );

    const recoveryStartedAt = new Date().toISOString();

    setActiveDeload({
      ...recovery,
      recoveryStartedAt,
    });

    recordLifecycleEventSafely({
      type: "pain-recovery-started",
      programId: program.id,
      weekIndex: recovery.deloadWeekIndex,
      deloadReason: "pain",
      occurredAt: recoveryStartedAt,
    });

    // Pain recovery immediately suspends any previously earned
    // graduation eligibility.
    suspendGraduationEligibility();

    setWeek(recovery.deloadWeekIndex);
    setDay(0);

    return true;
  };

  const startDeloadWeek = () => {
    if (
      !activeDeload ||
      activeDeload.programId !== program.id ||
      activeDeload.phase !== "deload"
    ) {
      return false;
    }

    /**
     * For pain recovery, start the mandatory-rest clock only when
     * the user actually chooses to begin the Recovery Cycle.
     *
     * Do not overwrite it if it has already been set.
     */
    if (
      activeDeload.reason === "pain" &&
      activeDeload.recoveryStartedAt == null
    ) {
      setActiveDeload({
        ...activeDeload,
        recoveryStartedAt: new Date().toISOString(),
      });
    }

    recordLifecycleEventSafely({
      type: "deload-started",
      programId: activeDeload.programId,
      weekIndex: activeDeload.deloadWeekIndex,
      deloadReason: activeDeload.reason,
      occurredAt: new Date().toISOString(),
    });

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
      recordLifecycleEventSafely({
        type: "verification-started",
        programId: verificationState.programId,
        weekIndex: verificationState.verificationWeekIndex,
        deloadReason: verificationState.reason,
        occurredAt: new Date().toISOString(),
      });
      setWeek(verificationState.verificationWeekIndex);
      setDay(0);
    }

    return true;
  };

  const clearDeload = () => {
    if (activeDeload) {
      recordLifecycleEventSafely({
        type: "deload-cleared",
        programId: activeDeload.programId,
        weekIndex:
          activeDeload.phase === "verification"
            ? activeDeload.verificationWeekIndex
            : activeDeload.deloadWeekIndex,
        deloadReason: activeDeload.reason,
        occurredAt: new Date().toISOString(),
      });
    }

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

        activeMaintenance,

        workoutReason,

        adaptiveVolume,

        recordAdaptiveWorkoutRecommendation,

        applyAdaptiveVolumeSelection,

        completedSessions,

        trainingScheduleStatus,

        isLoaded,

        refreshProgressState,

        refreshWorkoutHistory,

        completeWorkout,

        setTestProgress,

        saveWorkoutProgress,

        getDayProgress,

        getDayStatus,

        canOpenDay,

        recordGraduationEligibility,

        suspendGraduationEligibility,

        trainAnotherWeek,

        startRepeatWeek,

        startMaintenance,

        acceptGraduation,

        activateDeload,

        beginPainRecovery,

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

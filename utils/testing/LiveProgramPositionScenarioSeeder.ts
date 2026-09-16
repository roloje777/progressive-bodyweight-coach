import AsyncStorage from "@react-native-async-storage/async-storage";

import { programs } from "@/data/programs";
import { hydrateExercise } from "@/utils/hydrateExercise";
import { getMatchOrBeatTargets } from "@/engine/MatchOrBeatEngine";
import {
  CompletedExercise,
  CompletedSession,
  CompletedSet,
} from "@/models/WorkoutLog";
import { Program, WorkoutDay } from "@/models/Program";
import { ProgramExercise } from "@/models/Exercise";
import { ItemStatus, WorkoutStatus } from "@/models/WorkoutStatus";
import { EMPTY_ADAPTIVE_PROGRAM_STATE } from "@/models/AdaptiveVolume";
import { replaceWorkoutHistoryForDev } from "@/storage/workoutStorage";
import { saveProgress } from "@/storage/progressStorage";
import { createActiveDeload } from "@/engine/DeloadEngine";
import { ActiveDeload, ActiveRepeatWeek, PendingGraduation } from "@/models/ProgramProgress";

const PROGRAM_EVALUATIONS_KEY = "program_evaluations";
const PROGRAM_LIFECYCLE_EVENTS_KEY = "program_lifecycle_events_v1";
const USER_PROGRESS_KEY = "USER_PROGRESS";
const ACTIVE_WORKOUT_KEY = "ACTIVE_WORKOUT";

export type LiveProgramPosition = {
  programIndex: number;
  weekIndex: number;
  dayIndex: number;
};

export type LiveProgramPositionSeedResult = {
  programId: string;
  level: string;
  week: number;
  day: number;
  seededWorkoutCount: number;
  seededCurrentProgramWorkoutCount: number;
  previousProgramsCompleted: number;
};

export async function resetLiveProgramPositionScenario(): Promise<void> {
  if (!__DEV__) return;

  await Promise.all([
    replaceWorkoutHistoryForDev([]),
    AsyncStorage.multiRemove([
      PROGRAM_EVALUATIONS_KEY,
      PROGRAM_LIFECYCLE_EVENTS_KEY,
      USER_PROGRESS_KEY,
      ACTIVE_WORKOUT_KEY,
    ]),
  ]);
}

/**
 * Positions the app at an exact live workout.
 *
 * The selected workout itself is NOT completed. Every scheduled workout before
 * it is populated with healthy, normal completed-session data.
 *
 * Earlier program levels are also populated so Level 2/3 positions have a
 * realistic preceding program history. Current-program Match-or-Beat history
 * therefore exists naturally once the selected position is beyond Week 1 Day 1.
 *
 * Settings are deliberately preserved.
 */
export async function seedLiveProgramPosition(
  position: LiveProgramPosition,
): Promise<LiveProgramPositionSeedResult> {
  if (!__DEV__) {
    throw new Error("Live program position scenarios are development-only.");
  }

  const { programIndex, weekIndex, dayIndex } = position;
  const program = programs[programIndex];

  if (!program) {
    throw new Error(`Invalid program index ${programIndex}.`);
  }
  if (weekIndex < 0 || weekIndex >= program.weeks) {
    throw new Error(`Invalid week ${weekIndex + 1} for ${program.id}.`);
  }
  if (dayIndex < 0 || dayIndex >= program.days.length) {
    throw new Error(`Invalid day ${dayIndex + 1} for ${program.id}.`);
  }

  await resetLiveProgramPositionScenario();

  const history: CompletedSession[] = [];
  const workouts: Record<
    string,
    { completedSets: number; totalSets: number; completed: boolean }
  > = {};

  const positionsToComplete: Array<{
    programIndex: number;
    weekIndex: number;
    dayIndex: number;
  }> = [];

  for (let pIndex = 0; pIndex <= programIndex; pIndex++) {
    const candidateProgram = programs[pIndex];

    for (let wIndex = 0; wIndex < candidateProgram.weeks; wIndex++) {
      for (let dIndex = 0; dIndex < candidateProgram.days.length; dIndex++) {
        if (
          pIndex === programIndex &&
          (wIndex > weekIndex ||
            (wIndex === weekIndex && dIndex >= dayIndex))
        ) {
          continue;
        }

        positionsToComplete.push({
          programIndex: pIndex,
          weekIndex: wIndex,
          dayIndex: dIndex,
        });
      }
    }
  }

  // Keep the newest seeded workout at least ~72h in the past so the live
  // target is not accidentally blocked by a mandatory/rest recommendation.
  const newestAgeDays = 3;
  const spacingDays = 2;

  for (let index = 0; index < positionsToComplete.length; index++) {
    const item = positionsToComplete[index];
    const seededProgram = programs[item.programIndex];
    const day = seededProgram.days[item.dayIndex];

    const daysAgo =
      newestAgeDays +
      (positionsToComplete.length - 1 - index) * spacingDays;

    const session = createHealthySession({
      program: seededProgram,
      day,
      history,
      weekIndex: item.weekIndex,
      dayIndex: item.dayIndex,
      daysAgo,
    });

    history.push(session);

    const totalSets = day.exercises
      .filter((exercise) => exercise.optional !== true)
      .reduce((sum, exercise) => sum + exercise.sets, 0);

    workouts[
      `${item.programIndex}-${item.weekIndex}-${item.dayIndex}`
    ] = {
      completedSets: totalSets,
      totalSets,
      completed: true,
    };
  }

  await replaceWorkoutHistoryForDev(history);

  await saveProgress({
    programIndex,
    week: weekIndex,
    day: dayIndex,
    workouts,
    pendingGraduation: null,
    activeRepeatWeek: null,
    activeDeload: null,
    adaptiveVolume: EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  const seededCurrentProgramWorkoutCount = history.filter(
    (session) => session.programId === program.id,
  ).length;

  console.log("🧪 LIVE PROGRAM POSITION SEEDED", {
    level: program.level,
    target: {
      week: weekIndex + 1,
      day: dayIndex + 1,
      dayId: program.days[dayIndex]?.id,
    },
    seededWorkoutCount: history.length,
    seededCurrentProgramWorkoutCount,
  });

  return {
    programId: program.id,
    level: program.level,
    week: weekIndex + 1,
    day: dayIndex + 1,
    seededWorkoutCount: history.length,
    seededCurrentProgramWorkoutCount,
    previousProgramsCompleted: programIndex,
  };
}

function createHealthySession(input: {
  program: Program;
  day: WorkoutDay;
  history: CompletedSession[];
  weekIndex: number;
  dayIndex: number;
  daysAgo: number;
}): CompletedSession {
  const { program, day, history, weekIndex, dayIndex, daysAgo } = input;

  const exercises = day.exercises
    .filter((exercise) => exercise.optional !== true)
    .map((exercise) => createHealthyExercise(exercise, history));

  const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const endWorkoutTime = completedAt.getTime();
  const startWorkoutTime = endWorkoutTime - 35 * 60 * 1000;

  const timeUnderTension = exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce((setTotal, set) => {
        if (set.durationSeconds != null) {
          return setTotal + set.durationSeconds;
        }
        if (set.durationLeft != null || set.durationRight != null) {
          return (
            setTotal + (set.durationLeft ?? 0) + (set.durationRight ?? 0)
          );
        }
        return setTotal;
      }, 0),
    0,
  );

  return {
    programId: program.id,
    dayId: day.id,
    weekIndex,
    dayIndex,
    status: WorkoutStatus.Completed,
    completedAt: completedAt.toISOString(),
    startWorkoutTime,
    endWorkoutTime,
    workoutDuration: 35 * 60,
    timeUnderTension,
    exercises,
    feedback: {
      rating: 4,
      tags: ["good-pump", "great-focus"],
      comment: "Live program-position healthy seeded workout",
    },
    sectionSkipped: false,
    workoutReason: "scheduled",
    trainingMode: "normal",
  };
}

function createHealthyExercise(
  programExercise: ProgramExercise,
  history: CompletedSession[],
): CompletedExercise {
  const hydrated = hydrateExercise(programExercise);

  const targetExercise = {
    exerciseId: programExercise.exerciseId,
    sets: Array.from({ length: programExercise.sets }, (_, index) => ({
      setNumber: index + 1,
      status: ItemStatus.Pending,
    })),
  };

  const targets = getMatchOrBeatTargets(
    targetExercise,
    history,
    programExercise.exerciseId,
    hydrated,
  );

  const sets: CompletedSet[] = Array.from(
    { length: programExercise.sets },
    (_, index) => {
      const setNumber = index + 1;
      const target = targets.find(
        (candidate) => candidate.setNumber === setNumber,
      );
      const baseline = getConfigBaseline(programExercise);
      const value = Math.max(1, (target?.target ?? baseline) + 1);

      const rest =
        setNumber === 1
          ? {}
          : {
              prescribedRestBeforeSet: 120,
              actualRestBeforeSet: 120,
              adaptiveRestAdjustmentBeforeSet: 0,
            };

      if (hydrated.type === "hold" || hydrated.type === "time") {
        return {
          setNumber,
          status: ItemStatus.Completed,
          durationSeconds: value,
          ...rest,
        };
      }

      if (programExercise.sideMode === "alternating") {
        return {
          setNumber,
          status: ItemStatus.Completed,
          repsLeft: value,
          repsRight: value,
          ...rest,
        };
      }

      return {
        setNumber,
        status: ItemStatus.Completed,
        repsCompleted: value,
        ...rest,
      };
    },
  );

  return {
    exerciseId: programExercise.exerciseId,
    sets,
    effortRating: 2,
  };
}

function getConfigBaseline(exercise: ProgramExercise): number {
  const config = exercise.config as any;

  if (config.durationSeconds != null) {
    return Math.max(1, Math.ceil(config.durationSeconds * 0.7));
  }

  if (config.minReps != null && config.maxReps != null) {
    return Math.max(1, Math.ceil((config.minReps + config.maxReps) / 2));
  }

  return 1;
}


export type LiveStateScenarioId =
  | "normal"
  | "mb-ready"
  | "pre-deload-fatigue"
  | "pre-deload-form"
  | "active-deload-fatigue"
  | "active-deload-form"
  | "active-pain-recovery"
  | "verification"
  | "repeat-week"
  | "graduation-ready"
  | "adaptive-rest-personalized";

export type LiveStateScenarioDefinition = {
  id: LiveStateScenarioId;
  label: string;
  description: string;
};

export const LIVE_STATE_SCENARIOS: LiveStateScenarioDefinition[] = [
  { id: "normal", label: "Normal Training", description: "Healthy history immediately before the selected live workout." },
  { id: "mb-ready", label: "Match-or-Beat Ready", description: "Healthy comparable history so the selected workout has meaningful MB targets." },
  { id: "pre-deload-fatigue", label: "Pre-Deload • Low Energy", description: "Two recent low-energy workouts. Add Low Energy on the live workout to test fatigue deload escalation." },
  { id: "pre-deload-form", label: "Pre-Deload • Form Breakdown", description: "Two recent form-breakdown workouts. Add Form Breakdown on the live workout to test form deload escalation." },
  { id: "active-deload-fatigue", label: "Active Deload • Fatigue", description: "The selected live workout is inside an active 60% fatigue deload week." },
  { id: "active-deload-form", label: "Active Deload • Form", description: "The selected live workout is inside an active 60% form deload week." },
  { id: "active-pain-recovery", label: "Active Pain Recovery", description: "The selected live workout is an active pain-recovery workout." },
  { id: "verification", label: "Verification", description: "The selected live workout is an 80% verification workout after a completed recovery week." },
  { id: "repeat-week", label: "Repeat Week", description: "The selected position is marked as repeat training while preserving normal progression feedback." },
  { id: "graduation-ready", label: "Graduation Ready", description: "Strong healthy history for testing the final progression/graduation decision." },
  { id: "adaptive-rest-personalized", label: "Adaptive Rest • Personalized Ready", description: "At least three healthy comparable exposures are created before the selected workout." },
];

export type LiveStateScenarioSeedResult = LiveProgramPositionSeedResult & {
  scenarioId: LiveStateScenarioId;
  scenarioLabel: string;
  instructions: string[];
};

/**
 * Seeds a lifecycle-aware starting point while keeping the selected workout live.
 * It deliberately writes the same persisted history/progress contracts used by
 * the real app rather than mocking a screen-only state.
 */
export async function seedLiveStateScenario(
  scenarioId: LiveStateScenarioId,
  position: LiveProgramPosition,
): Promise<LiveStateScenarioSeedResult> {
  const base = await seedLiveProgramPosition(position);
  const definition = LIVE_STATE_SCENARIOS.find((item) => item.id === scenarioId);
  if (!definition) throw new Error(`Unknown state scenario: ${scenarioId}`);

  const program = programs[position.programIndex];
  const rawHistory = await AsyncStorage.getItem("workout_history");
  let history: CompletedSession[] = rawHistory ? JSON.parse(rawHistory) : [];

  const rawProgress = await AsyncStorage.getItem(USER_PROGRESS_KEY);
  const progress = rawProgress ? JSON.parse(rawProgress) : {};

  let targetWeekIndex = position.weekIndex;
  let activeDeload: ActiveDeload | null = null;
  let activeRepeatWeek: ActiveRepeatWeek | null = null;
  let pendingGraduation: PendingGraduation | null = null;
  const instructions: string[] = [];

  const currentProgramHistory = () => history.filter((s) => s.programId === program.id);
  const tagRecent = (tag: string, count: number, rating: number) => {
    const candidates = currentProgramHistory().slice(-count);
    if (candidates.length < count) {
      throw new Error(`${definition.label} needs at least ${count} prior workouts. Choose a later Level/Week/Day position.`);
    }
    const ids = new Set(candidates.map((s) => `${s.programId}:${s.weekIndex}:${s.dayIndex}:${s.completedAt}`));
    history = history.map((session) => ids.has(`${session.programId}:${session.weekIndex}:${session.dayIndex}:${session.completedAt}`)
      ? { ...session, feedback: { rating, tags: [tag], comment: `State scenario: ${definition.label}` } }
      : session);
  };

  switch (scenarioId) {
    case "normal":
      instructions.push("Perform the selected workout normally. No exceptional lifecycle state is pre-activated.");
      break;

    case "mb-ready":
      if (currentProgramHistory().filter((s) => s.dayIndex === position.dayIndex).length < 1) {
        throw new Error("Match-or-Beat Ready needs a previous exposure to this workout day. Choose Week 2 or later.");
      }
      instructions.push("Use the live MB targets to test success, miss, or an exclusion feedback tag.");
      break;

    case "pre-deload-fatigue":
      tagRecent("low-energy", 2, 2);
      instructions.push("Complete the live workout with Low Energy again. The third recurring fatigue signal should escalate to Adaptive Deload.");
      break;

    case "pre-deload-form":
      tagRecent("form-breakdown", 2, 2);
      instructions.push("Complete the live workout with Form Breakdown again. The third recurring form signal should escalate to Adaptive Deload.");
      break;

    case "active-deload-fatigue":
    case "active-deload-form": {
      const reason = scenarioId === "active-deload-form" ? "form" : "fatigue";
      activeDeload = createActiveDeload(program.id, position.weekIndex - 1, reason);
      activeDeload = { ...activeDeload, deloadWeekIndex: position.weekIndex };
      instructions.push("This live workout should open with the reduced-load deload prescription: 60% targets, one fewer set (min 1), 1.5× rest, MB disabled.");
      break;
    }

    case "active-pain-recovery":
      activeDeload = createActiveDeload(program.id, position.weekIndex - 1, "pain");
      /**
       * The live State Scenario must open on an actionable recovery workout.
       * Pain Recovery uses mandatory FULL rest-day spacing, so seeding the
       * recovery start only 48 hours ago can legitimately leave the selected
       * day locked (depending on the configured recovery spacing).
       *
       * Put the synthetic recovery start safely in the past. There are no
       * completed pain-recovery sessions in this scenario yet, so the
       * TrainingScheduleEngine uses this timestamp as its scheduling reference.
       */
      activeDeload = {
        ...activeDeload,
        deloadWeekIndex: position.weekIndex,
        recoveryStartedAt: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
      instructions.push(
        "The selected position is an immediately actionable Pain Recovery workout. " +
        "Normal strength progression feedback should remain omitted.",
      );
      break;

    case "verification":
      activeDeload = createActiveDeload(program.id, position.weekIndex - 2, "fatigue");
      activeDeload = {
        ...activeDeload,
        deloadWeekIndex: Math.max(0, position.weekIndex - 1),
        phase: "verification",
        verificationWeekIndex: position.weekIndex,
      };
      instructions.push("The selected workout should use 80% verification targets, full 1–5 workout feedback, and the Verification Coach message.");
      instructions.push("Pass should clear recovery; failure should create another Deload → Verification cycle.");
      break;

    case "repeat-week":
      activeRepeatWeek = { programId: program.id, weekIndex: position.weekIndex, createdAt: new Date().toISOString() };
      instructions.push("The selected workout is normal training with workoutReason=repeat. Complete it to reconfirm progression readiness.");
      break;

    case "graduation-ready": {
      const next = programs[position.programIndex + 1];
      if (!next) {
        instructions.push("This is the final maintenance level, so there is no next program to graduate into.");
      } else {
        pendingGraduation = {
          programId: program.id,
          nextProgramId: next.id,
          earnedAtWeekIndex: position.weekIndex,
          earnedAt: new Date().toISOString(),
          confirmedAtWeekIndex: position.weekIndex,
          eligible: true,
        };
        instructions.push(`Graduation eligibility is active toward ${next.level}. Use the Coach to test Graduate or Train Another Week.`);
      }
      break;
    }

    case "adaptive-rest-personalized": {
      const comparable = currentProgramHistory().filter((s) => s.dayIndex === position.dayIndex && s.trainingMode === "normal" && (s.feedback?.rating ?? 0) > 2).length;
      if (comparable < 3) {
        throw new Error("Personalized Adaptive Rest needs 3 prior comparable exposures to this workout day. Choose Week 4 or later.");
      }
      instructions.push("Confirm Adaptive Rest is ON and Mode = Personalized in Settings. The selected day has at least 3 eligible comparable histories.");
      break;
    }
  }

  await replaceWorkoutHistoryForDev(history);
  await saveProgress({
    ...progress,
    programIndex: position.programIndex,
    week: targetWeekIndex,
    day: position.dayIndex,
    pendingGraduation,
    activeRepeatWeek,
    activeDeload,
    adaptiveVolume: progress.adaptiveVolume ?? EMPTY_ADAPTIVE_PROGRAM_STATE,
  });

  return {
    ...base,
    scenarioId,
    scenarioLabel: definition.label,
    instructions,
  };
}

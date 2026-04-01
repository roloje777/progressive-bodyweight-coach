import { useEffect, useState } from "react";
import { programs } from "@/data/programs";
import { saveProgress, loadProgress } from "@/storage/progressStorage";

export function useProgress() {
  const [programIndex, setProgramIndex] = useState(0);
  const [week, setWeek] = useState(0);
  const [day, setDay] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const program = programs[programIndex];

  // 🔥 Store workout progress per day
  const [workouts, setWorkouts] = useState<Record<string, any>>({});

  // --- Load saved progress and workouts on start ---
  useEffect(() => {
    const init = async () => {
      const saved = await loadProgress();
      if (saved) {
        setProgramIndex(saved.programIndex);
        setWeek(saved.week);
        setDay(saved.day);
        setWorkouts(saved.workouts ?? {}); // load past workout progress
      }
      setIsLoaded(true);
    };
    init();
  }, []);

  // --- Save progress + workouts whenever they change ---
  useEffect(() => {
    if (!isLoaded) return;
    saveProgress({ programIndex, week, day, workouts });
  }, [programIndex, week, day, workouts]);

  // --- Save individual workout completion ---
  const saveWorkoutProgress = (
    programIndex: number,
    week: number,
    day: number,
    data: { completedSets: number; totalSets: number; completed: boolean }
  ) => {
    const key = `${programIndex}-${week}-${day}`;
    setWorkouts((prev) => ({
      ...prev,
      [key]: data,
    }));
  };

  // --- Get completion % for a given day ---
  const getDayProgress = (index: number) => {
    const key = `${programIndex}-${week}-${index}`;
    const workout = workouts[key];
    if (!workout || workout.totalSets === 0) return 0;
    return workout.completedSets / workout.totalSets;
  };

  // --- Advance day/week/program after completing workout ---
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

    const nextProgram = programIndex + 1;
    if (nextProgram < programs.length) {
      setProgramIndex(nextProgram);
      setWeek(0);
      setDay(0);
    }
  };

  // --- Utility for dev testing ---
  const setTestProgress = (pIndex: number, w: number, d: number) => {
    if (!__DEV__) return;
    setProgramIndex(pIndex);
    setWeek(w);
    setDay(d);
  };

  const isDayUnlocked = (index: number) => index <= day;

  return {
    program,
    programIndex,
    week,
    day,
    completeWorkout,
    isDayUnlocked,
    isLoaded,
    setTestProgress,
    saveWorkoutProgress,
    getDayProgress,
  };
}
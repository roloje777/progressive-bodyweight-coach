import { useEffect, useState } from "react";
import { programs } from "@/data/programs";
import { saveProgress, loadProgress } from "@/storage/progressStorage";

export function useProgress() {
  const [programIndex, setProgramIndex] = useState(0);
  const [week, setWeek] = useState(0);
  const [day, setDay] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const program = programs[programIndex];

  // 🔥 LOAD ON START
  useEffect(() => {
    const init = async () => {
      const saved = await loadProgress();

      if (saved) {
        setProgramIndex(saved.programIndex);
        setWeek(saved.week);
        setDay(saved.day);
      }

      setIsLoaded(true);
    };

    init();
  }, []);

  // 🔥 SAVE ON CHANGE
  useEffect(() => {
    if (!isLoaded) return;

    saveProgress({ programIndex, week, day });
  }, [programIndex, week, day]);

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

  const setTestProgress = (pIndex: number, w: number, d: number) => {
    if (!__DEV__) return; // 🚫 blocked in production

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
    setTestProgress
  };
}

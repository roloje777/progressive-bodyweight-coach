import { programs } from "@/data/programs";

// 🔥 GLOBAL STATE (temporary simple solution)
let programIndex = 0;
let week = 0;
let day = 0;

export function useProgress() {
  const program = programs[programIndex];

  const completeWorkout = () => {
    const nextDay = day + 1;

    if (nextDay < program.days.length) {
      day = nextDay;
      return;
    }

    const nextWeek = week + 1;

    if (nextWeek < program.weeks) {
      week = nextWeek;
      day = 0;
      return;
    }

    const nextProgram = programIndex + 1;

    if (nextProgram < programs.length) {
      programIndex = nextProgram;
      week = 0;
      day = 0;
    }
  };

  const isDayUnlocked = (index: number) => {
    return index <= day;
  };

  return {
    program,
    programIndex,
    week,
    day,
    completeWorkout,
    isDayUnlocked,
  };
}
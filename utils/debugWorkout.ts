// utils/debugWorkout.ts
export function logWorkoutState(
  label: string,
  program: any,
  week: number,
  dayIndex: number
) {
  const day = program?.days?.[dayIndex];

  console.log(`\n===== ${label} =====`);
  console.log("Program:", program?.name);
  console.log("Program Index:", program?.id);
  console.log("Week:", week);
  console.log("Day Index:", dayIndex);
  console.log("Day Title:", day?.title);

  console.log("Exercises:");
  day?.exercises?.forEach((ex: any, i: number) => {
    console.log(
      `${i + 1}. ${ex.name} | type=${ex.type} | sets=${ex.sets}`
    );
  });

  console.log("========================\n");
}
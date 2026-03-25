import { Program } from "../models/Program";

export const maxProgram: Program = {
  id: "level3",
  name: "BODYWEIGHT HYPERTROPHY SYSTEM", // the program App Name
  description: "Progressive • Science-Backed • No Weights Required", // app subtitle / description
  goals: "High tension, long eccentrics, advanced leverage", // program goals
  level: "Level 3 - Max Hypertrophy",  // programs level
  restBetweenSets: 10,
  restBetweenExercises: 15,
  autoStartRest: true,
  getReadyCountdownSeconds: 3, // default 5
  countdownAlertThreshold: 6,
  playRestSound: true, // default true
  weeks: 4, // program duration
  days: [

  ]

}

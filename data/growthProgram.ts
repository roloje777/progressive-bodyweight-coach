import { Program } from "../models/Program";

export const growthProgram: Program = {
  id: "level2",
  name: "BODYWEIGHT HYPERTROPHY SYSTEM",
  description: "Progressive • Science-Backed • No Weights Required", 
  goals: "Mechanical tension + unilateral overload", 
  level: "Level 2 - Growth",  // programs level
  restBetweenSets: 10,
  restBetweenExercises: 15,
  autoStartRest: true,
  getReadyCountdownSeconds: 5, // default 5
  countdownAlertThreshold: 5,
  playRestSound: true, // default true
  weeks: 4, // program duration
  days: [

  ]

}

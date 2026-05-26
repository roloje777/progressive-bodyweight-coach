import AsyncStorage from "@react-native-async-storage/async-storage";

import { ProgramEvaluation } from "../models/ProgramEvaluation";

const STORAGE_KEY = "program_evaluations";

export async function saveProgramEvaluation(
  evaluation: ProgramEvaluation,
) {
  try {
    const existing = await AsyncStorage.getItem(
      STORAGE_KEY,
    );

    const evaluations: ProgramEvaluation[] = existing
      ? JSON.parse(existing)
      : [];

    evaluations.push(evaluation);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(evaluations),
    );

    console.log(
      "✅ Program evaluation saved:",
      evaluation.programId,
    );
  } catch (error) {
    console.error(
      "❌ Failed to save program evaluation",
      error,
    );
  }
}

export async function getProgramEvaluations(): Promise<
  ProgramEvaluation[]
> {
  try {
    const data = await AsyncStorage.getItem(
      STORAGE_KEY,
    );

    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(
      "❌ Failed to load evaluations",
      error,
    );

    return [];
  }
}
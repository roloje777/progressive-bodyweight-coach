import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "LAST_STARTED_PROGRAM_POSITION";

export type StartedProgramPosition = {
  programId: string;
  weekIndex: number;
  dayIndex: number;
  startedAt: number;
};

export async function saveStartedProgramPosition(
  position: Omit<StartedProgramPosition, "startedAt">,
): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ ...position, startedAt: Date.now() }),
  );
}

export async function loadStartedProgramPosition(): Promise<StartedProgramPosition | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StartedProgramPosition>;
    if (
      typeof parsed.programId !== "string" ||
      !Number.isInteger(parsed.weekIndex) ||
      !Number.isInteger(parsed.dayIndex) ||
      typeof parsed.startedAt !== "number"
    ) {
      return null;
    }
    return parsed as StartedProgramPosition;
  } catch {
    return null;
  }
}

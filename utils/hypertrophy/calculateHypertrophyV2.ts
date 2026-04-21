// --- QUALITY (stimulus quality: exercise selection)
export function getQualityScore(effectiveness: number, difficulty: number) {
  return (effectiveness + difficulty) / 2; // 0–5
}

// --- VOLUME (sets + reps stimulus)
export function getVolumeScore(avgSets: number, avgReps: number) {
  const maxSets = 5;
  const maxReps = 15;

  const setScore = Math.min(avgSets / maxSets, 1);
  const repScore = Math.min(avgReps / maxReps, 1);

  return ((setScore + repScore) / 2) * 5;
}

// --- PROGRAM EXPOSURE (frequency + duration)
export function getProgramScore(daysPerWeek: number, weeks: number) {
  const maxDays = 6;
  const maxWeeks = 8;

  const dayScore = Math.min(daysPerWeek / maxDays, 1);
  const weekScore = Math.min(weeks / maxWeeks, 1);

  return ((dayScore + weekScore) / 2) * 5;
}

// --- FINAL HYPERTROPHY (0–5)
export function calculateHypertrophyUnitV2({
  effectiveness,
  difficulty,
  avgSets,
  avgReps,
  daysPerWeek,
  weeks,
}: {
  effectiveness: number;
  difficulty: number;
  avgSets: number;
  avgReps: number;
  daysPerWeek: number;
  weeks: number;
}) {
  const quality = getQualityScore(effectiveness, difficulty);
  const volume = getVolumeScore(avgSets, avgReps);
  const program = getProgramScore(daysPerWeek, weeks);

  const hypertrophy =
    quality * 0.4 +
    volume * 0.35 +
    program * 0.25;

  return Math.min(hypertrophy, 5);
}

// --- PROGRESS (0–1 for UI)
export function calculateHypertrophyProgress({
  hypertrophyMax,
  currentDay,
  totalDays,
}: {
  hypertrophyMax: number;
  currentDay: number;
  totalDays: number;
}) {
  const completionRatio = currentDay / totalDays;

  const currentHypertrophy = hypertrophyMax * completionRatio;

  return {
    percentage: currentHypertrophy / 5,
    unit: currentHypertrophy,
  };
}
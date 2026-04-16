export function calculateHypertrophyPercentage(effectiveness: number, difficulty: number) {
  return ((effectiveness + difficulty) / 2)/5; // normalized 0–1
}

export function calculateHypertrophyUnit(effectiveness: number, difficulty: number) {
  return (effectiveness + difficulty) / 2 ;// normalized 0–1
}

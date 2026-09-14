export type AnalyticsScenarioId =
  | "fresh-install"
  | "normal-progression"
  | "plateau"
  | "fatigue-deload-recovery"
  | "pain-recovery"
  | "repeat-week"
  | "graduation"
  | "long-term"
  | "mixed-exercises"
  | "inconsistent-adherence"
  | "mb-stress-test";

export type AnalyticsScenarioDefinition = {
  id: AnalyticsScenarioId;
  title: string;
  description: string;
};

export const ANALYTICS_SCENARIOS: AnalyticsScenarioDefinition[] = [
  { id: "fresh-install", title: "Fresh install", description: "No history. Exercises empty and insufficient-data states." },
  { id: "normal-progression", title: "Normal progression", description: "Four healthy improving weeks with strong adherence and Match-or-Beat." },
  { id: "plateau", title: "Plateau", description: "Stable performance and readiness without recovery warnings." },
  { id: "fatigue-deload-recovery", title: "Fatigue → deload → recovery", description: "Performance pressure, fatigue signals, deload, then verification recovery." },
  { id: "pain-recovery", title: "Pain recovery", description: "Joint-discomfort history, excluded progression sets and pain-recovery workouts." },
  { id: "repeat-week", title: "Repeat week", description: "Graduation earned, another week chosen, then stronger repeat-week performance." },
  { id: "graduation", title: "Graduation journey", description: "Graduation earned and accepted, followed by the next program starting." },
  { id: "long-term", title: "Long-term journey", description: "About a year of data across programs for 6M / 1Y / ALL testing." },
  { id: "mixed-exercises", title: "Mixed exercise trends", description: "Improving, stable and declining exercises in the same training block." },
  { id: "inconsistent-adherence", title: "Inconsistent adherence", description: "Closed weeks with missed scheduled days to test adherence below 100%." },
  { id: "mb-stress-test", title: "Match-or-Beat stress test", description: "A deliberate mix of exceeded, matched, missed and excluded target evidence." },
];

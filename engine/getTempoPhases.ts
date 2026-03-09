// 1️⃣ Define the config type first
export interface TempoConfig {
  startPhase: "eccentric" | "concentric";
  eccentric: number;
  pauseEccentric?: number;   // pause after eccentric
  concentric: number;
  pauseConcentric?: number;      // pause after concentric
}

// 2️⃣ Define phase type
export type TempoPhase =
  | "eccentric"
  | "pauseEccentric"
  | "concentric"
  | "pauseConcentric";

// 3️⃣ Now you can safely use TempoConfig
export function buildTempoPhases(config: TempoConfig): TempoPhase[] {
  if (config.startPhase === "eccentric") {
    return ["eccentric", "pauseEccentric", "concentric", "pauseConcentric"];
  } else {
    return ["concentric", "pauseConcentric", "eccentric", "pauseEccentric"];
  }
}

export function getPhaseDuration(phase: TempoPhase, config: TempoConfig) {
  switch (phase) {
    case "eccentric":
      return config.eccentric;
    case "concentric":
      return config.concentric;
    case "pauseEccentric":
      return config.pauseEccentric|| 0;
    case "pauseConcentric":
      return config.pauseConcentric || 0;
  }
}

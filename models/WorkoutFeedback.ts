// models/WorkoutFeedback.ts

export type WorkoutFeedbackTagId =
  | "couldnt-finish"
  | "form-breakdown"
  | "joint-discomfort"
  | "low-energy"
  | "perfect-difficulty"
  | "good-pump"
  | "great-focus"
  | "could-do-more"
  | "too-easy";

export type WorkoutFeedbackOption = {
  id: WorkoutFeedbackTagId;
  label: string;
  emoji: string;
};

export const WORKOUT_FEEDBACK_OPTIONS_BY_RATING: Record<
  1 | 2 | 3 | 4 | 5,
  WorkoutFeedbackOption[]
> = {
  1: [
    { id: "couldnt-finish", label: "Couldn't finish", emoji: "🥵" },
    { id: "form-breakdown", label: "Form broke down", emoji: "😵‍💫" },
    { id: "joint-discomfort", label: "Joint discomfort", emoji: "⚠️" },
    { id: "low-energy", label: "Low energy", emoji: "😴" },
  ],
  2: [
    { id: "couldnt-finish", label: "Couldn't finish", emoji: "🥵" },
    { id: "form-breakdown", label: "Form broke down", emoji: "😵‍💫" },
    { id: "joint-discomfort", label: "Joint discomfort", emoji: "⚠️" },
    { id: "low-energy", label: "Low energy", emoji: "😴" },
  ],
  3: [
    { id: "perfect-difficulty", label: "Perfect difficulty", emoji: "😀" },
    { id: "good-pump", label: "Good pump", emoji: "💪" },
    { id: "great-focus", label: "Great focus", emoji: "🎯" },
  ],
  4: [
    { id: "could-do-more", label: "Could do more reps", emoji: "🔋" },
    { id: "good-pump", label: "Good pump", emoji: "💪" },
    { id: "great-focus", label: "Great focus", emoji: "🎯" },
  ],
  5: [
    { id: "could-do-more", label: "Could do more reps", emoji: "🔋" },
    { id: "too-easy", label: "Too easy", emoji: "🪶" },
    { id: "good-pump", label: "Good pump", emoji: "💪" },
    { id: "great-focus", label: "Great focus", emoji: "🎯" },
  ],
};


export type WorkoutFeedbackLike = {
  rating: number | null | undefined;
  tags?: readonly string[];
};

/**
 * A workout cannot be saved until the user has selected both
 * a rating and at least one reason/tag.
 */
export function isWorkoutFeedbackComplete(
  feedback: WorkoutFeedbackLike | null | undefined,
): boolean {
  return feedback?.rating != null && (feedback.tags?.length ?? 0) > 0;
}

/**
 * Legacy display strings are retained only for reading older persisted
 * workout history. New feedback stores stable IDs.
 */
const LEGACY_TAG_ALIASES: Record<WorkoutFeedbackTagId, string[]> = {
  "couldnt-finish": ["Couldn't finish 🥵"],
  "form-breakdown": ["Form broke down", "Form broke down 😵‍💫"],
  "joint-discomfort": ["Joint discomfort ⚠️"],
  "low-energy": ["Low energy 😴"],
  "perfect-difficulty": ["Perfect difficulty 😀"],
  "good-pump": ["Good pump 💪"],
  "great-focus": ["Great focus 🎯"],
  "could-do-more": ["Could do more reps 🤣", "Could do more reps 🔋"],
  "too-easy": ["Too easy 😛", "Too easy 🪶"],
};

export function hasWorkoutFeedbackTag(
  tags: readonly string[] | undefined,
  id: WorkoutFeedbackTagId,
): boolean {
  if (!tags?.length) {
    return false;
  }

  if (tags.includes(id)) {
    return true;
  }

  return LEGACY_TAG_ALIASES[id].some((legacy) => tags.includes(legacy));
}

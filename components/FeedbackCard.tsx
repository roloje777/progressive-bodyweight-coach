import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppPalette } from "@/hooks/use-app-palette";

import { AllowedFeedbackRating } from "@/engine/MatchOrBeatFeedbackEngine";
import {
  WORKOUT_FEEDBACK_OPTIONS_BY_RATING,
  WorkoutFeedbackTagId,
} from "@/models/WorkoutFeedback";

type Feedback = {
  rating: AllowedFeedbackRating | null;
  tags: WorkoutFeedbackTagId[];
  comment: string;
};

type Props = {
  onChange?: (feedback: Feedback) => void;
  allowedRatings?: AllowedFeedbackRating[];
};

const EMOJIS: {
  value: AllowedFeedbackRating;
  emoji: string;
  label: string;
}[] = [
  { value: 1, emoji: "😵", label: "Too Hard" },
  { value: 2, emoji: "😓", label: "Challenging" },
  { value: 3, emoji: "👍", label: "Just Right" },
  { value: 4, emoji: "😊", label: "Felt Good" },
  { value: 5, emoji: "😎", label: "Too Easy" },
];

export const FeedbackCard: React.FC<Props> = ({
  onChange,
  allowedRatings = [1, 2, 3, 4, 5],
}) => {
  const palette = useAppPalette();
  const [rating, setRating] = useState<AllowedFeedbackRating | null>(null);
  const [tags, setTags] = useState<WorkoutFeedbackTagId[]>([]);
  const [comment, setComment] = useState("");
  const [showInput, setShowInput] = useState(false);

  const availableEmojis = useMemo(
    () => EMOJIS.filter((item) => allowedRatings.includes(item.value)),
    [allowedRatings],
  );

  const availableChips = useMemo(() => {
    if (!rating) return [];
    return WORKOUT_FEEDBACK_OPTIONS_BY_RATING[rating];
  }, [rating]);

  const emitChange = (
    nextRating: AllowedFeedbackRating | null,
    nextTags: WorkoutFeedbackTagId[],
    nextComment: string,
  ) => {
    onChange?.({
      rating: nextRating,
      tags: nextTags,
      comment: nextComment,
    });
  };

  const toggleTag = (tag: WorkoutFeedbackTagId) => {
    let updated: WorkoutFeedbackTagId[];

    if (tags.includes(tag)) {
      updated = tags.filter((current) => current !== tag);
    } else {
      if (tags.length >= 3) return;
      updated = [...tags, tag];
    }

    setTags(updated);
    emitChange(rating, updated, comment);
  };

  const handleRating = (value: AllowedFeedbackRating) => {
    if (!allowedRatings.includes(value)) return;

    setRating(value);
    setTags([]);
    emitChange(value, [], comment);
  };

  const handleComment = (text: string) => {
    setComment(text);
    emitChange(rating, tags, text);
  };

  return (
    <View
      style={{
        backgroundColor: palette.surfaceAlt,
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
      }}
    >
      <Text
        style={{
          color: palette.text,
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        How did that feel?
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        {availableEmojis.map((item) => {
          const selected = rating === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => handleRating(item.value)}
              style={{ alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: selected ? 2 : 0,
                  borderColor: palette.primary,
                  transform: [{ scale: selected ? 1.2 : 1 }],
                }}
              >
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              </View>

              <Text
                style={{
                  color: selected ? palette.primary : palette.textMuted,
                  fontSize: 12,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {rating && (
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              color: palette.text,
              fontSize: 14,
              fontWeight: "700",
              marginBottom: 2,
            }}
          >
            What best describes this workout?
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 10 }}>
            Choose at least one. You can select up to three.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {availableChips.map((chip) => {
              const selected = tags.includes(chip.id);

              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => toggleTag(chip.id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: selected ? palette.primary : palette.surfaceAlt,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? "#000" : palette.text,
                      fontSize: 12,
                    }}
                  >
                    {chip.label} {chip.emoji}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          onPress={() => setShowInput(!showInput)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: palette.surfaceAlt,
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.textMuted,
          }}
        >
          <Text style={{ color: palette.primary, fontSize: 16, fontWeight: "600" }}>
            📝 Workout Notes (Optional)
          </Text>

          <Text style={{ color: palette.primary, fontSize: 18 }}>
            {showInput ? "−" : "+"}
          </Text>
        </TouchableOpacity>

        {showInput && (
          <TextInput
            value={comment}
            onChangeText={handleComment}
            placeholder="Anything you'd like to remember about today's workout..."
            placeholderTextColor={palette.textMuted}
            multiline
            style={{
              marginTop: 12,
              backgroundColor: palette.surfaceAlt,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.textMuted,
              padding: 14,
              color: palette.text,
              minHeight: 100,
              textAlignVertical: "top",
            }}
          />
        )}
      </View>
    </View>
  );
};

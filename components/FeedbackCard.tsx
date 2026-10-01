import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";

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
  labelKey: any;
}[] = [
  { value: 1, emoji: "😵", labelKey: "feedback.tooHard" },
  { value: 2, emoji: "😓", labelKey: "feedback.challenging" },
  { value: 3, emoji: "👍", labelKey: "feedback.justRight" },
  { value: 4, emoji: "😊", labelKey: "feedback.feltGood" },
  { value: 5, emoji: "😎", labelKey: "feedback.tooEasy" },
];

export const FeedbackCard: React.FC<Props> = ({
  onChange,
  allowedRatings = [1, 2, 3, 4, 5],
}) => {
  const palette = useAppPalette();
  const { t } = useTranslation();
  const [rating, setRating] = useState<AllowedFeedbackRating | null>(null);
  const [tags, setTags] = useState<WorkoutFeedbackTagId[]>([]);
  const [comment, setComment] = useState("");
  const [showInput, setShowInput] = useState(false);
  const tagLabelKeys: Record<WorkoutFeedbackTagId, any> = {
    "couldnt-finish": "feedback.tag.couldnt-finish",
    "form-breakdown": "feedback.tag.form-breakdown",
    "joint-discomfort": "feedback.tag.joint-discomfort",
    "low-energy": "feedback.tag.low-energy",
    "perfect-difficulty": "feedback.tag.perfect-difficulty",
    "good-pump": "feedback.tag.good-pump",
    "great-focus": "feedback.tag.great-focus",
    "could-do-more": "feedback.tag.could-do-more",
    "too-easy": "feedback.tag.too-easy",
  };


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
        {t("feedback.howFeel")}
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
                {t(item.labelKey)}
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
            {t("feedback.describe")}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 10 }}>
            {t("feedback.choose")}
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
                    {t(tagLabelKeys[chip.id])} {chip.emoji}
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
            {t("feedback.notes")}
          </Text>

          <Text style={{ color: palette.primary, fontSize: 18 }}>
            {showInput ? "−" : "+"}
          </Text>
        </TouchableOpacity>

        {showInput && (
          <TextInput
            value={comment}
            onChangeText={handleComment}
            placeholder={t("feedback.placeholder")}
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

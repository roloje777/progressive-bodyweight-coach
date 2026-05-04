import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";

type Feedback = {
  rating: number | null;
  tags: string[];
  comment: string;
};

type Props = {
  onChange?: (feedback: Feedback) => void;
};

const EMOJIS = [
  { value: 1, emoji: "😵", label: "Too Hard" },
  { value: 2, emoji: "😓", label: "Challenging" },
  { value: 3, emoji: "😐", label: "Just Right" },
  { value: 4, emoji: "😊", label: "Felt Good" },
  { value: 5, emoji: "😎", label: "Too Easy" },
];

export const FeedbackCard: React.FC<Props> = ({ onChange }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [showInput, setShowInput] = useState(false);

  // 🔥 Adaptive chips
  const availableChips = useMemo(() => {
    if (!rating) return [];

    if (rating <= 2) {
      return [
        "Couldn't finish",
        "Form broke down",
        "Joint discomfort ⚠️",
        "Low energy 😴",
      ];
    }

    if (rating === 3) {
      return ["Perfect difficulty", "Good pump 💪", "Great focus 🎯"];
    }

    return [
      "Could do more reps",
      "Too easy",
      "Good pump 💪",
      "Great focus 🎯",
    ];
  }, [rating]);

  const toggleTag = (tag: string) => {
    let updated: string[];

    if (tags.includes(tag)) {
      updated = tags.filter((t) => t !== tag);
    } else {
      if (tags.length >= 3) return; // max 3
      updated = [...tags, tag];
    }

    setTags(updated);
    emitChange(rating, updated, comment);
  };

  const handleRating = (value: number) => {
    setRating(value);
    setTags([]); // reset tags when rating changes
    emitChange(value, [], comment);
  };

  const handleComment = (text: string) => {
    setComment(text);
    emitChange(rating, tags, text);
  };

  const emitChange = (
    r: number | null,
    t: string[],
    c: string,
  ) => {
    onChange?.({
      rating: r,
      tags: t,
      comment: c,
    });
  };

  return (
    <View
      style={{
        backgroundColor: "#1e1e1e",
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
      }}
    >
      {/* Title */}
      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        How did that feel?
      </Text>

      {/* Emoji Selector */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        {EMOJIS.map((item) => {
          const selected = rating === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => handleRating(item.value)}
              style={{
                alignItems: "center",
                flex: 1,
              }}
            >
              <View
                style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: selected ? 2 : 0,
                  borderColor: "#FFD700",
                  transform: [{ scale: selected ? 1.2 : 1 }],
                }}
              >
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              </View>

              <Text
                style={{
                  color: selected ? "#FFD700" : "#aaa",
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

      {/* Chips */}
      {rating && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {availableChips.map((chip) => {
            const selected = tags.includes(chip);

            return (
              <TouchableOpacity
                key={chip}
                onPress={() => toggleTag(chip)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: selected ? "#FFD700" : "#333",
                }}
              >
                <Text
                  style={{
                    color: selected ? "#000" : "#fff",
                    fontSize: 12,
                  }}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Add Note Toggle */}
      <TouchableOpacity onPress={() => setShowInput(!showInput)}>
        <Text style={{ color: "#aaa", fontSize: 14 }}>
          {showInput ? "Hide note" : "Add note (optional)"}
        </Text>
      </TouchableOpacity>

      {/* Text Input */}
      {showInput && (
        <TextInput
          value={comment}
          onChangeText={handleComment}
          placeholder="e.g. Knee felt tight, increase reps next time"
          placeholderTextColor="#666"
          multiline
          style={{
            marginTop: 10,
            backgroundColor: "#2a2a2a",
            borderRadius: 10,
            padding: 10,
            color: "#fff",
            minHeight: 60,
          }}
        />
      )}
    </View>
  );
};
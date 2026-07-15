//PriimaryButton.tsx
import React from "react";
import { Pressable, Text } from "react-native";

import { appStyles } from "@/styles/appStyles";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        appStyles.button,
        disabled && appStyles.disabledButton,
        pressed && !disabled && appStyles.buttonPressed,
      ]}
      android_ripple={{
        color: "rgba(255,255,255,0.15)",
      }}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={appStyles.buttonText}>{title}</Text>
    </Pressable>
  );
}
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { AbortReason } from "@/models/AbortAttempt";
import { useAppPalette } from "@/hooks/use-app-palette";

const options: AbortReason[] = [
  "emergency",
  "unwell",
  "commitment",
  "time",
  "fatigue",
  "equipment",
  "technical",
  "other",
];
const reasonLabels: Record<"en" | "pt-PT", Record<AbortReason, string>> = {
  en: {
    emergency: "Emergency",
    unwell: "Not feeling well",
    commitment: "Unexpected commitment",
    time: "Ran out of time",
    fatigue: "Too fatigued",
    equipment: "Equipment or environment",
    technical: "Technical issue",
    other: "Other reason",
    pain: "Pain reported",
  },
  "pt-PT": {
    emergency: "Emergência",
    unwell: "Não me sinto bem",
    commitment: "Compromisso inesperado",
    time: "Fiquei sem tempo",
    fatigue: "Cansaço excessivo",
    equipment: "Equipamento ou ambiente",
    technical: "Problema técnico",
    other: "Outro motivo",
    pain: "Dor comunicada",
  },
};
export default function AbortCoach({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: AbortReason, notes: string) => Promise<void>;
}) {
  const { language } = useTranslation();
  const pt = language === "pt-PT";
  const palette = useAppPalette();
  const [reason, setReason] = useState<AbortReason | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (r: AbortReason) => {
    if (saving) return;
    setSaving(true);
    try {
      await onConfirm(r, notes);
      setReason(null);
      setNotes("");
    } catch {
      Alert.alert(
        pt ? "Não foi possível guardar" : "Could not save",
        pt
          ? "A tentativa não foi guardada. Tente novamente."
          : "The attempt was not saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 64,
          backgroundColor: palette.background,
          flexGrow: 1,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: palette.text,
            marginBottom: 12,
          }}
        >
          {pt ? "Coach — Antes de sair" : "Coach — Before you go"}
        </Text>
        <Text style={{ color: palette.text, marginBottom: 18 }}>
          {pt
            ? "Vou guardar o treino realizado até agora. Porque precisa de parar?"
            : "I'll save what you've done so far. Why do you need to stop?"}
        </Text>
        {options.map((r) => (
          <TouchableOpacity
            key={r}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === r }}
            onPress={() => setReason(r)}
            style={{
              padding: 13,
              marginBottom: 7,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: reason === r ? palette.primary : palette.border,
              backgroundColor: palette.surface,
            }}
          >
            <Text
              style={{
                color: palette.text,
                fontWeight: reason === r ? "bold" : "normal",
              }}
            >
              {reason === r ? "◉ " : "○ "}
              {reasonLabels[pt ? "pt-PT" : "en"][r]}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={{ color: palette.text, marginTop: 10 }}>
          {pt ? "Mais detalhes (opcional)" : "Additional details (optional)"}
        </Text>
        <TextInput
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder={pt ? "O que aconteceu?" : "What happened?"}
          placeholderTextColor={palette.textMuted}
          style={{
            color: palette.text,
            borderWidth: 1,
            borderColor: palette.border,
            minHeight: 85,
            textAlignVertical: "top",
            padding: 12,
            borderRadius: 8,
            marginTop: 8,
          }}
        />
        <TouchableOpacity
          disabled={!reason || saving}
          onPress={() => reason && void save(reason)}
          style={{
            backgroundColor: palette.primary,
            padding: 15,
            borderRadius: 10,
            marginTop: 18,
            opacity: !reason || saving ? 0.5 : 1,
          }}
        >
          <Text
            style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}
          >
            {pt ? "Guardar e terminar" : "Save and end workout"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={saving}
          onPress={() => void save("emergency")}
          style={{ padding: 15, marginTop: 12 }}
        >
          <Text style={{ color: palette.text, textAlign: "center" }}>
            {pt ? "Saída rápida — emergência" : "Emergency quick exit"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={saving}
          onPress={onCancel}
          style={{ padding: 15 }}
        >
          <Text style={{ color: palette.text, textAlign: "center" }}>
            {pt ? "Continuar treino" : "Continue workout"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

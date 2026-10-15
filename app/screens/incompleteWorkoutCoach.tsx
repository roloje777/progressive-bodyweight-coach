import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStyles } from "@/styles/appStyles";

export default function IncompleteWorkoutCoach() {
  const styles = useAppStyles();
  const { language } = useTranslation();
  const pt = String(language).toLowerCase().startsWith("pt");
  const params = useLocalSearchParams<{ percent?: string; completedSets?: string; totalSets?: string; reasons?: string }>();
  const percent = Number(params.percent);
  const completed = Number(params.completedSets);
  const total = Number(params.totalSets);
  let reasons: string[] = [];
  try { const parsed = JSON.parse(params.reasons ?? "[]"); if (Array.isArray(parsed)) reasons = parsed.filter((x): x is string => typeof x === "string"); } catch {}
  const primaryMissing = reasons.includes("primary_exercise_missing");
  const belowThreshold = reasons.includes("below_proposed_85_percent");
  const hasCounts = params.completedSets !== "" && params.totalSets !== "" && Number.isFinite(completed) && Number.isFinite(total) && total > 0;
  const hasPercent = params.percent !== "" && Number.isFinite(percent);
  const explanation = [
    ...(belowThreshold ? [pt ? "Foram concluídas menos de 85% das séries obrigatórias." : "Fewer than 85% of required sets were completed."] : []),
    ...(primaryMissing ? [pt ? "Pelo menos um exercício principal obrigatório não foi realizado." : "At least one required primary exercise was omitted."] : []),
  ];
  return (
    <SafeAreaView style={styles.graduationScreen} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.graduationScrollContent}>
        <View style={styles.graduationBadge}>
          <Text style={styles.graduationBadgeIcon}>💪</Text>
          <Text style={styles.graduationBadgeLabel}>{pt ? "TREINO REGISTADO" : "WORKOUT SAVED"}</Text>
        </View>
        <Text style={styles.graduationTitle}>{pt ? "Bom esforço hoje!" : "Good effort today!"}</Text>
        <Text style={styles.graduationLead}>
          {hasPercent ? `${Math.round(percent)}%` : pt ? "Resultado indisponível" : "Result unavailable"}
          {hasCounts ? ` (${completed}/${total} ${pt ? "séries" : "sets"})` : ""}
        </Text>
        <View style={styles.graduationCoachCard}>
          <Text style={styles.graduationCoachLabel}>COACH</Text>
          <Text style={styles.graduationCoachMessage}>
            {pt ? "Este treino não cumpriu os requisitos para avançar, mas o teu esforço ficou guardado." : "This workout did not meet the requirements to advance, but your effort has been saved."}
          </Text>
          {explanation.map((reason) => <Text key={reason} style={styles.graduationCoachMessage}>• {reason}</Text>)}
          <Text style={styles.graduationCoachMessage}>
            {pt ? "Recomendo que descanses o resto do dia. Quando te sentires preparado, podes repetir este treino. O mesmo dia continua disponível. A recuperação faz parte do progresso!" : "I recommend taking the rest of today to recover. When you feel ready, you can try this workout again. The same day remains available. Recovery is part of progress!"}
          </Text>
        </View>
        <View style={styles.graduationActions}>
          <PrimaryButton title={pt ? "Voltar ao início" : "Return Home"} onPress={() => router.replace("/")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

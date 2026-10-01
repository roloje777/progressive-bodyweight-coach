import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { useAppPalette, AppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";

type HelpTopicProps = {
  title: string;
  children: React.ReactNode;
};

function HelpTopic({ title, children }: HelpTopicProps) {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.topicHeader}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={24}
          color={palette.textMuted}
        />
      </Pressable>
      {open ? <View style={styles.topicBody}>{children}</View> : null}
    </View>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  return <Text style={styles.body}>{children}</Text>;
}

export default function HelpAboutScreen() {
  const palette = useAppPalette();
  const styles = createStyles(palette);
  const router = useRouter();
  const { setWeek1BaselineCoachEnabled } = useGeneralSettings();
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const emailSupport = () => {
    Linking.openURL(
      `mailto:pbh.coach@gmail.com?subject=${encodeURIComponent(`PBH Support — v${version}`)}`,
    ).catch(() => {
      Alert.alert(t("help.supportEmailTitle"), t("help.supportEmailMessage"));
    });
  };

  const resetHelpTips = () => {
    Alert.alert(
      t("help.resetTitle"),
      t("help.resetMessage"),
      [
        { text: t("help.cancel"), style: "cancel" },
        {
          text: t("help.reset"),
          onPress: () => {
            setWeek1BaselineCoachEnabled(true);
            Alert.alert(t("help.resetDoneTitle"), t("help.resetDoneMessage"));
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("help.backA11y")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>{t("settings.back")}</Text>
          </Pressable>

          <Text style={styles.title}>{t("settings.helpAbout.title")}</Text>
          <Text style={styles.intro}>{t("help.intro")}</Text>

          <Text style={styles.sectionLabel}>{t("help.gettingStarted")}</Text>
          <HelpTopic title={t("help.topic1.title")}>
            <BodyText>{t("help.topic1.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic2.title")}>
            <BodyText>{t("help.topic2.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic3.title")}>
            <BodyText>{t("help.topic3.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic4.title")}>
            <BodyText>{t("help.topic4.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic5.title")}>
            <BodyText>{t("help.topic5.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic6.title")}>
            <BodyText>{t("help.topic6.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic7.title")}>
            <BodyText>{t("help.topic7.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic8.title")}>
            <BodyText>{t("help.topic8.body")}</BodyText>
          </HelpTopic>

          <Text style={styles.sectionLabel}>{t("help.faq")}</Text>
          <HelpTopic title={t("help.topic9.title")}>
            <BodyText>{t("help.topic9.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic10.title")}>
            <BodyText>{t("help.topic10.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic11.title")}>
            <BodyText>{t("help.topic11.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic12.title")}>
            <BodyText>{t("help.topic12.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic13.title")}>
            <BodyText>{t("help.topic13.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic14.title")}>
            <BodyText>{t("help.topic14.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic15.title")}>
            <BodyText>{t("help.topic15.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic16.title")}>
            <BodyText>{t("help.topic16.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic17.title")}>
            <BodyText>{t("help.topic17.body")}</BodyText>
          </HelpTopic>
          <HelpTopic title={t("help.topic18.title")}>
            <BodyText>{t("help.topic18.body")}</BodyText>
          </HelpTopic>

          <Text style={styles.sectionLabel}>{t("help.support")}</Text>
          <Pressable
            onPress={emailSupport}
            accessibilityRole="button"
            accessibilityLabel={t("help.emailA11y")}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <MaterialIcons name="email" size={24} color={palette.accent} />
            <View style={styles.actionText}>
              <Text style={styles.cardTitle}>{t("help.emailSupport")}</Text>
              <Text style={styles.body}>pbh.coach@gmail.com</Text>
              <Text style={styles.meta}>{t("help.developerVersion", { version })}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            onPress={resetHelpTips}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <MaterialIcons name="restart-alt" size={24} color={palette.accent} />
            <View style={styles.actionText}>
              <Text style={styles.cardTitle}>{t("help.resetTips")}</Text>
              <Text style={styles.body}>{t("help.resetTipsDescription")}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>{t("help.about")}</Text>
          <View style={[styles.card, styles.aboutCard]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>PBH</Text>
            </View>
            <Text style={styles.aboutTitle}>Progressive Bodyweight Hypertrophy Coach</Text>
            <Text style={styles.meta}>{t("help.version", { version })}</Text>
            <Text style={[styles.body, styles.centerText]}>
              {t("help.aboutDescription")}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.metaLabel}>{t("help.authoredBy")}</Text>
            <Text style={styles.author}>João Emanuel Monica Rolo</Text>
          </View>

          <HelpTopic title={t("help.disclaimerTitle")}>
            <BodyText>
              {t("help.disclaimerBody")}
            </BodyText>
          </HelpTopic>
          <Text style={styles.sectionLabel}>{t("help.legal")}</Text>
          <Pressable onPress={() => router.push("/screens/legal/privacy")} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
            <MaterialIcons name="privacy-tip" size={24} color={palette.accent} />
            <View style={styles.actionText}><Text style={styles.cardTitle}>{t("help.privacy")}</Text><Text style={styles.body}>{t("help.privacyDescription")}</Text></View><Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/screens/legal/terms")} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
            <MaterialIcons name="gavel" size={24} color={palette.accent} />
            <View style={styles.actionText}><Text style={styles.cardTitle}>{t("help.terms")}</Text><Text style={styles.body}>{t("help.termsDescription")}</Text></View><Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/screens/legal/licenses")} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
            <MaterialIcons name="description" size={24} color={palette.accent} />
            <View style={styles.actionText}><Text style={styles.cardTitle}>{t("help.licenses")}</Text><Text style={styles.body}>{t("help.licensesDescription")}</Text></View><Text style={styles.chevron}>›</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (palette: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 18, paddingBottom: 44 },
  backButton: { alignSelf: "flex-start", paddingVertical: 6, marginBottom: 6 },
  backText: { color: palette.primary, fontWeight: "700", fontSize: 15 },
  title: { color: palette.text, fontSize: 30, fontWeight: "800" },
  intro: { color: palette.textMuted, fontSize: 15, lineHeight: 21, marginTop: 7, marginBottom: 18 },
  sectionLabel: { color: palette.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 15, marginBottom: 10 },
  topicHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  topicBody: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  cardTitle: { color: palette.text, fontSize: 16, fontWeight: "700", flex: 1 },
  body: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  meta: { color: palette.textMuted, fontSize: 13, marginTop: 10 },
  actionCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 15, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  actionText: { flex: 1, gap: 3 },
  pressed: { opacity: 0.72 },
  chevron: { color: palette.textMuted, fontSize: 25 },
  aboutCard: { alignItems: "center", paddingVertical: 22 },
  logoMark: { width: 74, height: 74, borderRadius: 22, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.accent, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoText: { color: palette.accent, fontSize: 25, fontWeight: "900", letterSpacing: 1 },
  aboutTitle: { color: palette.text, fontSize: 19, fontWeight: "800", textAlign: "center", lineHeight: 25 },
  centerText: { textAlign: "center", marginTop: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, width: "100%", marginVertical: 18 },
  metaLabel: { color: palette.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  author: { color: palette.text, fontSize: 16, fontWeight: "700", marginTop: 5 },
});

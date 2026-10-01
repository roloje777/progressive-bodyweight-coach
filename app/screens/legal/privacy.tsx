import { Stack, useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppPalette, AppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";

function Section({ title, children }: { title: string; children: React.ReactNode }) { const palette=useAppPalette(); const styles=createStyles(palette); return <View style={styles.section}><Text style={styles.heading}>{title}</Text><Text style={styles.body}>{children}</Text></View>; }
export default function PrivacyPolicyScreen() { const palette=useAppPalette(); const styles=createStyles(palette); const router=useRouter(); const { t }=useTranslation(); return <>
<Stack.Screen options={{headerShown:false}}/><SafeAreaView style={styles.screen} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
<Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>{t("legal.back")}</Text></Pressable>
<Text style={styles.title}>{t("privacy.title")}</Text><Text style={styles.meta}>Progressive Bodyweight Hypertrophy Coach (PBH){"\n"}{t("legal.lastUpdated", {date:t("legal.updatedDate")})}</Text>
<Pressable onPress={()=>Linking.openURL(t("privacy.url"))} style={styles.onlineButton} accessibilityRole="link"><Text style={styles.onlineButtonText}>{t("privacy.online")}</Text></Pressable>
        <Section title={t("privacy.s1.title")}>{t("privacy.s1.body")}</Section>
        <Section title={t("privacy.s2.title")}>{t("privacy.s2.body")}</Section>
        <Section title={t("privacy.s3.title")}>{t("privacy.s3.body")}</Section>
        <Section title={t("privacy.s4.title")}>{t("privacy.s4.body")}</Section>
        <Section title={t("privacy.s5.title")}>{t("privacy.s5.body")}</Section>
        <Section title={t("privacy.s6.title")}>{t("privacy.s6.body")}</Section>
        <Section title={t("privacy.s7.title")}>{t("privacy.s7.body")}</Section>
        <Section title={t("privacy.s8.title")}>{t("privacy.s8.body")}</Section>
        <Section title={t("privacy.s9.title")}>{t("privacy.s9.body")}</Section>
        <Section title={t("privacy.s10.title")}>{t("privacy.s10.body")}</Section>
        <Section title={t("privacy.s11.title")}>{t("privacy.s11.body")}</Section>
        <Section title={t("privacy.s12.title")}>{t("privacy.s12.body")}</Section>
        <Section title={t("privacy.s13.title")}>{t("privacy.s13.body")}</Section>
</ScrollView></SafeAreaView></>; }
const createStyles=(palette:AppPalette)=>StyleSheet.create({screen:{flex:1,backgroundColor:palette.background},content:{padding:18,paddingBottom:44},back:{alignSelf:"flex-start",paddingVertical:6,marginBottom:8},backText:{color:palette.primary,fontWeight:"700",fontSize:15},title:{color:palette.text,fontSize:30,fontWeight:"800"},meta:{color:palette.textMuted,fontSize:13,lineHeight:19,marginTop:7,marginBottom:20},section:{backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,borderRadius:14,padding:15,marginBottom:10},heading:{color:palette.accent,fontSize:15,fontWeight:"800",marginBottom:7},onlineButton:{alignSelf:"flex-start",backgroundColor:palette.surfaceAlt,borderWidth:1,borderColor:palette.accent,borderRadius:10,paddingVertical:10,paddingHorizontal:13,marginBottom:18},onlineButtonText:{color:palette.accent,fontSize:14,fontWeight:"800"},body:{color:palette.textMuted,fontSize:14,lineHeight:21}});

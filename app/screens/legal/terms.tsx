import { Stack, useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppPalette, AppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
function Section({title,children}:{title:string;children:React.ReactNode}){const palette=useAppPalette();const s=createStyles(palette);return <View style={s.section}><Text style={s.heading}>{title}</Text><Text style={s.body}>{children}</Text></View>}
export default function TermsScreen(){const palette=useAppPalette();const s=createStyles(palette);const router=useRouter();const {t}=useTranslation();return <><Stack.Screen options={{headerShown:false}}/><SafeAreaView style={s.screen} edges={["top"]}><ScrollView contentContainerStyle={s.content}><Pressable onPress={()=>router.back()} style={s.back}><Text style={s.backText}>{t("legal.back")}</Text></Pressable><Text style={s.title}>{t("terms.title")}</Text><Text style={s.meta}>Progressive Bodyweight Hypertrophy Coach (PBH){"\n"}{t("legal.lastUpdated",{date:t("legal.updatedDate")})}</Text><Pressable onPress={()=>Linking.openURL(t("terms.url"))} style={s.onlineButton} accessibilityRole="link"><Text style={s.onlineButtonText}>{t("terms.online")}</Text></Pressable><Section title={t("terms.s1.title")}>{t("terms.s1.body")}</Section>
<Section title={t("terms.s2.title")}>{t("terms.s2.body")}</Section>
<Section title={t("terms.s3.title")}>{t("terms.s3.body")}</Section>
<Section title={t("terms.s4.title")}>{t("terms.s4.body")}</Section>
<Section title={t("terms.s5.title")}>{t("terms.s5.body")}</Section>
<Section title={t("terms.s6.title")}>{t("terms.s6.body")}</Section>
<Section title={t("terms.s7.title")}>{t("terms.s7.body")}</Section>
<Section title={t("terms.s8.title")}>{t("terms.s8.body")}</Section>
<Section title={t("terms.s9.title")}>{t("terms.s9.body")}</Section>
<Section title={t("terms.s10.title")}>{t("terms.s10.body")}</Section>
<Section title={t("terms.s11.title")}>{t("terms.s11.body")}</Section></ScrollView></SafeAreaView></>}
const createStyles=(palette: AppPalette)=>StyleSheet.create({screen:{flex:1,backgroundColor:palette.background},content:{padding:18,paddingBottom:44},back:{alignSelf:"flex-start",paddingVertical:6,marginBottom:8},backText:{color:palette.primary,fontWeight:"700",fontSize:15},title:{color:palette.text,fontSize:30,fontWeight:"800"},meta:{color:palette.textMuted,fontSize:13,lineHeight:19,marginTop:7,marginBottom:20},section:{backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,borderRadius:14,padding:15,marginBottom:10},heading:{color:palette.accent,fontSize:15,fontWeight:"800",marginBottom:7},onlineButton:{alignSelf:"flex-start",backgroundColor:palette.surfaceAlt,borderWidth:1,borderColor:palette.accent,borderRadius:10,paddingVertical:10,paddingHorizontal:13,marginBottom:18},onlineButtonText:{color:palette.accent,fontSize:14,fontWeight:"800"},body:{color:palette.textMuted,fontSize:14,lineHeight:21}});

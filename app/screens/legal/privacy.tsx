import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const UPDATED = "19 September 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.heading}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return <>
    <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Help & About</Text></Pressable>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.meta}>Progressive Bodyweight Hypertrophy Coach (PBH){"\n"}Last updated: {UPDATED}</Text>
        <Section title="1. Who is responsible for PBH">PBH is developed and published by João Rolo. Privacy enquiries can be sent to pbh.coach@gmail.com.</Section>
        <Section title="2. Data PBH stores">PBH stores training information needed to provide its features, such as workout history, exercise performance, Match or Beat targets, workout and exercise feedback, recovery and progression state, training schedule preferences, adaptive-training settings and other app preferences. In the current PBH 1.0 design, this information is stored locally on your device.</Section>
        <Section title="3. Data PBH does not automatically collect">PBH 1.0 does not require a PBH account and does not operate a PBH cloud service that automatically uploads your workout history. PBH does not include advertising or behavioural advertising, and the current release does not use a PBH analytics service to build a profile of your training activity.</Section>
        <Section title="4. How your data is used">Locally stored training information is used to operate PBH features, including workout history, personal targets, progression, scheduling, recovery guidance and adaptive coaching. PBH does not sell your training information.</Section>
        <Section title="5. Exporting and sharing">PBH can let you export or share training information. Exporting or sharing is initiated by you. Once you choose another app, service or destination through your device's sharing facilities, that recipient's privacy practices apply to the copy you send.</Section>
        <Section title="6. External links and media">Some exercise-guide content may open external web resources. When you choose to open an external site or service, that third party may receive information normally associated with a web request and applies its own privacy policy. PBH does not control those third-party services.</Section>
        <Section title="7. Device permissions">PBH requests only permissions required for enabled app functionality. PBH does not require microphone recording permission for its normal audio coaching; audio prompts are playback-only. Future versions that add new permissions or data practices will require this policy and relevant in-app/Play disclosures to be updated.</Section>
        <Section title="8. Retention and deletion">Because PBH 1.0 stores its training data locally, that data remains on your device until it is removed through PBH functionality, app/device data controls, or by uninstalling/clearing the app as applicable. Exported copies are controlled by the destination to which you chose to save or share them.</Section>
        <Section title="9. Security">PBH is designed to minimise unnecessary data collection by keeping its core training records on the device. No method of electronic storage can be guaranteed to be completely secure, so you should also protect access to your device and any exported training files.</Section>
        <Section title="10. Health and fitness information">PBH uses the training and feedback information you enter to provide fitness-related functionality. PBH provides general exercise and training guidance and is not a medical diagnostic or treatment service.</Section>
        <Section title="11. Children and family use">PBH is not designed to knowingly collect children's personal information through a PBH account or PBH server. Parents or guardians remain responsible for deciding whether exercise content is appropriate for a minor and for providing suitable supervision.</Section>
        <Section title="12. Changes to this policy">This policy may be updated when PBH features, legal requirements or data practices change. The updated policy will show a revised date.</Section>
        <Section title="13. Contact">Privacy and data questions: pbh.coach@gmail.com{"\n"}Developer: João Rolo</Section>
      </ScrollView>
    </SafeAreaView>
  </>;
}

const styles = StyleSheet.create({screen:{flex:1,backgroundColor:"#07100B"},content:{padding:18,paddingBottom:44},back:{alignSelf:"flex-start",paddingVertical:6,marginBottom:8},backText:{color:"#FFD700",fontWeight:"700",fontSize:15},title:{color:"#FFF",fontSize:30,fontWeight:"800"},meta:{color:"#8D9891",fontSize:13,lineHeight:19,marginTop:7,marginBottom:20},section:{backgroundColor:"#111A14",borderWidth:1,borderColor:"#26332A",borderRadius:14,padding:15,marginBottom:10},heading:{color:"#8BEA9A",fontSize:15,fontWeight:"800",marginBottom:7},body:{color:"#C5CDC8",fontSize:14,lineHeight:21}});

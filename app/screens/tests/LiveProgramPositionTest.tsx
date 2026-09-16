import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { programs } from "@/data/programs";
import { useProgress } from "@/hooks/useProgress";
import {
  LIVE_STATE_SCENARIOS,
  LiveStateScenarioId,
  resetLiveProgramPositionScenario,
  seedLiveStateScenario,
} from "@/utils/testing/LiveProgramPositionScenarioSeeder";

export default function LiveProgramPositionTest() {
  const { refreshProgressState } = useProgress();
  const [running, setRunning] = React.useState(false);
  const [scenario, setScenario] = React.useState<LiveStateScenarioId>("normal");
  const [scenarioOpen, setScenarioOpen] = React.useState(false);
  const [programIndex, setProgramIndex] = React.useState(0);
  const [weekIndex, setWeekIndex] = React.useState(0);
  const [dayIndex, setDayIndex] = React.useState(0);
  const program = programs[programIndex];
  const selectedScenario = LIVE_STATE_SCENARIOS.find((item) => item.id === scenario)!;

  const seed = async () => {
    try {
      setRunning(true);
      const result = await seedLiveStateScenario(scenario, { programIndex, weekIndex, dayIndex });
      await refreshProgressState();
      Alert.alert("State scenario ready", [result.scenarioLabel, result.level, `Week ${result.week}, Day ${result.day}`, "", `${result.seededWorkoutCount} prior workouts populated.`, "", ...result.instructions].join("\n"), [
        { text: "Stay here", style: "cancel" },
        { text: "Open Home", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error) {
      Alert.alert("Seed failed", error instanceof Error ? error.message : String(error));
    } finally { setRunning(false); }
  };

  const reset = async () => {
    try { setRunning(true); await resetLiveProgramPositionScenario(); await refreshProgressState(); Alert.alert("Reset complete", "Live test data cleared."); }
    catch (error) { Alert.alert("Reset failed", error instanceof Error ? error.message : String(error)); }
    finally { setRunning(false); }
  };

  if (!__DEV__) return <View style={styles.center}><Stack.Screen options={{headerShown:false}}/><Text style={styles.title}>Development only</Text></View>;

  return <View style={styles.root}>
    <Stack.Screen options={{headerShown:false}}/>
    <View style={styles.header}><Pressable onPress={()=>router.back()}><Text style={styles.back}>← Back</Text></Pressable><Text style={styles.title}>Live Lifecycle Tester</Text><Text style={styles.subtitle}>Choose a state, then Level / Week / Day. The app seeds realistic history immediately before that live position.</Text></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.label}>STATE SCENARIO</Text>
      <Pressable style={styles.selector} onPress={()=>setScenarioOpen(!scenarioOpen)}><View style={{flex:1}}><Text style={styles.selectorValue}>{selectedScenario.label}</Text><Text style={styles.selectorHelp}>{selectedScenario.description}</Text></View><Text style={styles.chevron}>{scenarioOpen?"▲":"▼"}</Text></Pressable>
      {scenarioOpen && <View style={styles.menu}>{LIVE_STATE_SCENARIOS.map(item=><Pressable key={item.id} style={[styles.menuItem,item.id===scenario&&styles.menuSelected]} onPress={()=>{setScenario(item.id);setScenarioOpen(false)}}><Text style={[styles.menuTitle,item.id===scenario&&styles.yellow]}>{item.label}</Text><Text style={styles.menuHelp}>{item.description}</Text></Pressable>)}</View>}

      <Text style={styles.label}>LEVEL</Text><View style={styles.row}>{programs.map((p,i)=><Pressable key={p.id} style={[styles.chip,i===programIndex&&styles.chipSelected]} onPress={()=>{setProgramIndex(i);setWeekIndex(0);setDayIndex(0)}}><Text style={[styles.chipText,i===programIndex&&styles.chipTextSelected]}>Level {i+1}</Text></Pressable>)}</View>
      <Text style={styles.selectedMeta}>{program.level}</Text>

      <Text style={styles.label}>WEEK</Text><View style={styles.row}>{Array.from({length:program.weeks},(_,i)=><Pressable key={i} style={[styles.chip,i===weekIndex&&styles.chipSelected]} onPress={()=>setWeekIndex(i)}><Text style={[styles.chipText,i===weekIndex&&styles.chipTextSelected]}>Week {i+1}</Text></Pressable>)}</View>
      <Text style={styles.label}>DAY</Text><View style={styles.row}>{program.days.map((d,i)=><Pressable key={d.id} style={[styles.dayChip,i===dayIndex&&styles.chipSelected]} onPress={()=>setDayIndex(i)}><Text style={[styles.chipText,i===dayIndex&&styles.chipTextSelected]}>Day {i+1}</Text><Text style={[styles.dayName,i===dayIndex&&{color:"#222"}]} numberOfLines={2}>{d.title.replace(/^Day\s+\d+\s*-\s*/i,"")}</Text></Pressable>)}</View>

      <View style={styles.summary}><Text style={styles.summaryTitle}>LIVE STARTING POINT</Text><Text style={styles.summaryMain}>{selectedScenario.label}</Text><Text style={styles.summaryText}>{program.level} • Week {weekIndex+1} • Day {dayIndex+1}</Text><Text style={styles.summaryText}>The selected workout itself remains uncompleted.</Text></View>
      <Pressable disabled={running} onPress={seed} style={styles.seedButton}>{running?<ActivityIndicator color="#111"/>:<Text style={styles.seedText}>Populate State Scenario</Text>}</Pressable>
      <Pressable disabled={running} onPress={reset} style={styles.resetButton}><Text style={styles.resetText}>Reset Live Test Data</Text></Pressable>
      <Text style={styles.note}>Settings are preserved. Some scenarios require enough preceding history; the tester will tell you when a selected Week/Day is too early for that state.</Text>
    </ScrollView>
  </View>;
}

const styles=StyleSheet.create({root:{flex:1,backgroundColor:"#111"},center:{flex:1,backgroundColor:"#111",alignItems:"center",justifyContent:"center"},header:{paddingTop:54,paddingHorizontal:20,paddingBottom:16,borderBottomWidth:1,borderBottomColor:"#2a2a2a"},back:{color:"#FFD700",fontSize:16,marginBottom:14},title:{color:"#fff",fontSize:24,fontWeight:"800"},subtitle:{color:"#aaa",fontSize:14,lineHeight:20,marginTop:8},content:{padding:16,paddingBottom:48},label:{color:"#FFD700",fontSize:12,fontWeight:"800",letterSpacing:1,marginTop:18,marginBottom:8},selector:{backgroundColor:"#1b1b1b",borderWidth:1,borderColor:"#444",borderRadius:14,padding:14,flexDirection:"row",alignItems:"center"},selectorValue:{color:"#fff",fontSize:17,fontWeight:"800"},selectorHelp:{color:"#999",fontSize:12,lineHeight:17,marginTop:4},chevron:{color:"#FFD700",marginLeft:12},menu:{backgroundColor:"#181818",borderRadius:14,borderWidth:1,borderColor:"#333",marginTop:6,overflow:"hidden"},menuItem:{padding:13,borderBottomWidth:1,borderBottomColor:"#292929"},menuSelected:{backgroundColor:"#242424"},menuTitle:{color:"#fff",fontWeight:"700"},menuHelp:{color:"#888",fontSize:11,lineHeight:15,marginTop:3},yellow:{color:"#FFD700"},row:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{backgroundColor:"#222",borderRadius:10,borderWidth:1,borderColor:"#3a3a3a",paddingHorizontal:13,paddingVertical:10},dayChip:{width:"31%",minHeight:62,backgroundColor:"#222",borderRadius:10,borderWidth:1,borderColor:"#3a3a3a",padding:9,alignItems:"center",justifyContent:"center"},chipSelected:{backgroundColor:"#FFD700",borderColor:"#FFD700"},chipText:{color:"#ddd",fontWeight:"700"},chipTextSelected:{color:"#111"},dayName:{color:"#999",fontSize:10,textAlign:"center",marginTop:3},selectedMeta:{color:"#888",fontSize:12,marginTop:7},summary:{backgroundColor:"#1b1b1b",borderRadius:14,padding:16,marginTop:24,borderWidth:1,borderColor:"#333"},summaryTitle:{color:"#888",fontSize:11,fontWeight:"800",letterSpacing:1},summaryMain:{color:"#FFD700",fontSize:19,fontWeight:"800",marginTop:6},summaryText:{color:"#ccc",fontSize:13,marginTop:5},seedButton:{minHeight:54,borderRadius:12,backgroundColor:"#FFD700",alignItems:"center",justifyContent:"center",marginTop:16},seedText:{color:"#111",fontSize:16,fontWeight:"900"},resetButton:{minHeight:50,borderRadius:12,borderWidth:1,borderColor:"#FF3B30",alignItems:"center",justifyContent:"center",marginTop:12},resetText:{color:"#FF3B30",fontWeight:"700"},note:{color:"#777",fontSize:12,lineHeight:18,textAlign:"center",marginTop:14}});

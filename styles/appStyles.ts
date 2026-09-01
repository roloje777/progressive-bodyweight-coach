//styles/appStyles.ts
import { StyleSheet } from "react-native";
import { TrainingScheduleSettingsProvider } from "@/context/TrainingScheduleSettingsContext";

export const appTokens = {
  colors: {
    primary: "#FFD700",
    background: "#111",
    card: "#222",
    accent: "#4CAF50",
    danger: "#FF3B30",
    muted: "#aaa",
    text: "#fff",
  },

  iconSizes: {
    small: 22,
    medium: 28,
    large: 34,
  },
};

export const appStyles = StyleSheet.create({
container: {
  flex: 1,
  justifyContent: "flex-start",
  // alignItems: "center",
  padding: 20,
  backgroundColor: "#111",
},
scrollContainer: {
  flexGrow: 1,
  padding: 20,
  backgroundColor: "#111",
},
exerciseContainer:{
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
},
  screen: {
  flex: 1,
  backgroundColor: "#111",
},

  timer: {
    fontSize: 50,
    color: "white",
    marginVertical: 10,
  },
button: {
  backgroundColor: "#FF6B00",
  margin:5,
  borderRadius: 14,
  paddingVertical: 18,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",

  // Android
  elevation: 6,

  // iOS
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.35,
  shadowRadius: 6,
},

 stopButton: {
  backgroundColor: "#FF3B30",
  paddingVertical: 18,
  paddingHorizontal: 40,
},

  disabledButton: {
    backgroundColor: "#555",
  },

buttonText: {
  color: "#FFF",
  fontWeight: "700",
  fontSize: 20,
  letterSpacing: 0.5,
  padding: 5,
},

  setText: {
    color: "#FFD700",
    fontSize: 18,
    marginTop: 5,
  },
  phaseText: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFF",
    padding: 8,
    // marginLeft: 10,
    borderRadius: 8,
    width: 80,
    color: "white",
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  state: { color: "white", fontSize: 16, marginTop: 10 },
  currentSet: {
    fontSize: 20,
    color: "#00FF00",
    marginVertical: 5,
  },

  target: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  visualContainer: {
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 30,
},

holdLabel: {
  fontSize: 26,
  color: "#FFD700",
  fontWeight: "bold",
  marginBottom: 10,
},

bigTimer: {
  fontSize: 90,
  fontWeight: "bold",
  color: "white",
},

secondsLabel: {
  fontSize: 16,
  color: "#aaa",
  marginBottom: 20,
},

progressBarBackground: {
  width: "80%",
  height: 14,
  backgroundColor: "#333",
  borderRadius: 10,
  overflow: "hidden",
},

progressBarFill: {
  height: "100%",
  backgroundColor: "#FF6B00",
},
progressBarOvertime: {
  height: "100%",
  backgroundColor: "#FF3B30",
},
dayProgressBar: {
  width: "100%",        // full width of the card
  height: 6,            // height of the progress bar
  backgroundColor: "#333", // background for empty progress
  borderRadius: 4,
  marginTop: 8,
  overflow: "hidden",
},
summaryCard: {
  backgroundColor: "#222",
  padding: 15,
  borderRadius: 10,
  marginBottom: 15,
  width: "100%",
},

exerciseTitle: {
  color: "white",
  fontSize: 18,
  marginBottom: 5,
  fontWeight: "bold",
},

summaryDate: {
  color: "#aaa",
  fontSize: 16,
  marginBottom: 20,
  textAlign: "center",
},

summaryMessage: {
  fontSize: 18,
  color: "#FFD700",
  textAlign: "center",
  marginVertical: 20,
},

summaryContainer: {
  width: "100%",
  marginTop: 10,
},
// Workout Details / Summary styles

header: {
  color: "white",
  fontWeight: "600",
  marginBottom: 5,
},
headerContainer: {
  padding: 20,
  backgroundColor: "#111",
  alignItems: "center",
},

subHeader: {
  color: "#aaa",
  marginBottom: 10,
},

totalWorkout: {
  color: "#4CAF50",
  marginBottom: 20,
  fontWeight: "bold",
  fontSize: 16,
},

exerciseTotal: {
  color: "#4CAF50",
  marginBottom: 5,
},

errorText: {
  color: "white",
  fontSize: 16,
  textAlign: "center",
},
historyCard: {
  backgroundColor: "#222",
  padding: 15,
  marginBottom: 15,
  borderRadius: 10,
  width: "100%",
},

historyDate: {
  color: "white",
  fontWeight: "bold",
  marginBottom: 5,
},

historyText: {
  color: "#ccc",
},

workoutHeader: {
  width: "100%",
  marginBottom: 20,
},

rowBetween: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 6,
},

labelLeft: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},

labelRight: {
  color: "#FFD700",
  fontSize: 16,
},

titleLeft: {
  fontSize: 26,
  fontWeight: "bold",
  color: "white",
},

titleRight: {
  fontSize: 16,
  color: "#FFD700",
},

startButtonContainer: {
  marginTop: 20,
  alignItems: "center",
  width: "100%",
},
dateRow: {
  width: "100%",
  alignItems: "flex-end",
  marginBottom: 10,
},

dateText: {
  color: "#FFD700",
  fontSize: 14,
},

programInfo: {
  width: "100%",
  marginBottom: 15,
},

dayTitle: {
  color: "white",
  fontSize: 18,
  fontWeight: "600",
},

programLevel: {
  color: "#aaa",
  fontSize: 16,
  marginTop: 2,
},

estimateText: {
  color: "#FFD700",
  fontSize: 16,
  textAlign: "center",
  marginVertical: 20,
},
exerciseList: {
  width: "100%",
  marginTop: 10,
},

exerciseCard: {
  backgroundColor: "#222",
  padding: 15,
  borderRadius: 12,
  marginBottom: 12,
  width: "100%",
   borderWidth: 1,
   borderColor: "#444",
},

exerciseName: {
  color: "#FFD700",
  // color: "#4CAF50", 
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 6,
},

exerciseMeta: {
  flexDirection: "row",
  justifyContent: "space-between",
},

exerciseType: {
  color: "#FFD700",
  textTransform: "capitalize",
},

exerciseSets: {
  color: "#4CAF50",
  fontWeight: "bold",
},
exerciseDescription: {
  fontSize: 14,
  color: "#888", // softer, secondary text
  marginTop: 2,
  marginBottom: 8,
  textAlign: "center",
},
toggleContainer: {
  marginBottom: 20,
  gap: 12,
},

card: {
  padding: 16,
  borderRadius: 12,
  width:"100%",
},

cardEnabled: {
  backgroundColor: "#4CAF50",
},

cardDisabled: {
  backgroundColor: "#2A2A2A",
},

cardTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#fff",
},

recommended: {
  fontSize: 12,
  color: "#FFD700",
  marginTop: 4,
},

status: {
  marginTop: 8,
  fontWeight: "bold",
  color: "#fff",
  alignSelf: "flex-end",
},
dayCardBase: {
  padding: 18,
  borderRadius: 16,
},

dayCardCurrent: {
  backgroundColor: "#4CAF50",
},

dayCardUnlocked: {
  backgroundColor: "#2C2C2E",
},

dayCardLocked: {
  backgroundColor: "#1A1A1A",
},
dayTitleUnlocked: {
  color: "#fff",
},

dayTitleLocked: {
  color: "#777",
},

dayStatusUnlocked: {
  color: "#fff",
},

dayStatusLocked: {
  color: "#555",
},
progressText: {
  marginTop: 8,
  color: "#aaa",
},

daysContainer: {
  width: "100%",
  gap: 16,
},

nextSection: {
  marginTop: 32,
  width: "100%",
},

lockedPrograms: {
  marginTop: 12,
  opacity: 0.4,
},
inlineToggleRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 12,
},

inlineToggle: {
  padding: 10,
  borderRadius: 10,
},

toggleOn: {
  backgroundColor: "#4CAF50",
},

toggleOff: {
  backgroundColor: "#444",
},

toggleText: {
  fontSize: 18,
},
optionRow: {
  flexDirection: "row",
  gap: 12,
  marginTop: 14,
},

optionCard: {
  flex: 1,
  borderRadius: 14,
  paddingVertical: 12,
  alignItems: "center",
  justifyContent: "center",
},

optionActive: {
  backgroundColor: "#4CAF50",
},

optionInactive: {
  backgroundColor: "#2A2A2A",
},

optionIcon: {
  fontSize: 22,
  marginBottom: 4,
},

optionLabel: {
  color: "white",
  fontSize: 13,
  fontWeight: "600",
},
todayBadge: {
  position: "absolute",
  top: 10,
  right: 10,
  backgroundColor: "#ff5252",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  zIndex: 10,
},
todayText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 12,
},
exerciseImage: {
  width: "100%",
  height: 200,
  borderRadius: 12,
  marginBottom: 16,
  backgroundColor: "#505461",
},

sectionTitle: {
  fontSize: 18,
  fontWeight: "600",
  marginTop: 16,
  marginBottom: 6,
  color: "#FFD700",
},

text: {
  fontSize: 14,
  lineHeight: 20,
   color: "#ccc", 
},

warningText: {
  fontSize: 14,
  color: "#FF6B6B", 
  marginBottom: 4,
},

videoPlaceholder: {
  height: 180,
  backgroundColor: "#eee",
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
},
scrollContent: {
  padding: 20,
},
tagContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 12,
},

tag: {
  backgroundColor: "#E0E0E0",
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 16,
  marginRight: 8,
  marginBottom: 8,
},

primaryTag: {
  backgroundColor: "#4CAF50",
},

secondaryTag: {
  backgroundColor: "#81C784",
},

tagText: {
  color: "#000",
  fontSize: 12,
  fontWeight: "600",
},

subSectionTitle: {
  color: "#FFD700",
  fontSize: 14,
  fontWeight: "600",
  marginTop: 6,
  marginBottom: 4,
},
videoLinkButton: {
  backgroundColor: "#FF0000",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 10,
  alignItems: "center",
  marginBottom: 20,
},

videoLinkText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
},
video: {
  width: "100%",
  height: 200,
  borderRadius: 12,
  backgroundColor: "#000",
},
topBarContainer: {
  paddingTop: 50,
  paddingBottom: 20,
  alignItems: "center",
  backgroundColor: "#111",
},

topBarTitle: {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 10,
  color:"#00FFAA",
},

topBarDescription: {
  marginTop: 10,
  fontSize: 13,
  color: "#aaa",
},

arcCenter: {
  position: "absolute",
  top: 80,
  alignItems: "center",
},

daysLeft: {
  fontSize: 28,
  fontWeight: "bold",
},

daysLabel: {
  fontSize: 12,
  color: "#aaa",
},

sideRow: {
  position: "absolute",
  width: "100%",
  top: 110,
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: 40,
},

sideText: {
  fontSize: 14,
  color: "#ccc",
},
weekDayText: {
  color: "#aaa",
  fontSize: 13,
  marginTop: 4,
  textAlign: "center",
},
arcLabels: {
  marginTop: 10,
  alignItems: "center",
},

arcLabel1: {
  color: "#00FFAA",
  fontSize: 13,
},
arcLabel2: {
 color:"#FFD700",
  fontSize: 13,
  
},

// completeWorkoutButton: {
//   backgroundColor: "#4CAF50",
//   marginTop: 20,
//   marginBottom: 20,
//   paddingVertical: 18,
//   borderRadius: 14,
//   alignItems: "center",
// },
startWorkoutContainer: {
  paddingTop: 12,
  paddingHorizontal: 4,
  backgroundColor: "#111",

  borderTopWidth: 1,
  borderTopColor: "#2A2A2A",
},
buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
},
tempoArrow: {
  fontSize: 80,
  color: "#0099cc",
},
tempoLabel: {
  fontSize: 26,
  fontWeight: "bold",
  color: "white",
  marginTop: 10,
},
menuButton: {
  position: "absolute",
  top: 8,
  right: 8,
  padding: 8,
},
sectionDivider: {
  height: 1,
  backgroundColor: "#555",
  marginVertical: 20,
},

// -----------------------------------
// GRADUATION COACH
// -----------------------------------

graduationScreen: {
  flex: 1,
  backgroundColor: "#111",
},

graduationScrollContent: {
  flexGrow: 1,
  paddingHorizontal: 20,
  paddingTop: 30,
  paddingBottom: 40,
},

graduationBadge: {
  alignSelf: "center",
  alignItems: "center",
  justifyContent: "center",

  width: 150,
  height: 150,

  borderRadius: 75,

  backgroundColor: "#222",

  borderWidth: 2,
  borderColor: "#FFD700",

  marginBottom: 24,
},

graduationBadgeIcon: {
  fontSize: 56,
  marginBottom: 6,
},

graduationBadgeLabel: {
  color: "#FFD700",

  fontSize: 13,

  fontWeight: "800",

  letterSpacing: 1.5,
},

graduationTitle: {
  color: "#fff",

  fontSize: 30,

  fontWeight: "800",

  textAlign: "center",

  marginBottom: 12,
},

graduationLead: {
  color: "#aaa",

  fontSize: 17,

  lineHeight: 25,

  textAlign: "center",

  marginBottom: 28,
},

graduationCoachCard: {
  width: "100%",

  backgroundColor: "#222",

  borderRadius: 16,

  padding: 20,

  borderWidth: 1,
  borderColor: "#444",

  marginBottom: 20,
},

graduationCoachLabel: {
  color: "#FFD700",

  fontSize: 13,

  fontWeight: "800",

  letterSpacing: 1.5,

  marginBottom: 12,
},

graduationCoachMessage: {
  color: "#fff",

  fontSize: 16,

  lineHeight: 24,

  marginBottom: 12,
},

graduationTransitionCard: {
  width: "100%",

  backgroundColor: "#1A1A1A",

  borderRadius: 16,

  padding: 20,

  marginBottom: 24,

  borderWidth: 1,
  borderColor: "#333",

  alignItems: "center",
},

graduationProgramBlock: {
  width: "100%",

  alignItems: "center",

  paddingVertical: 10,
},

graduationProgramLabel: {
  color: "#888",

  fontSize: 12,

  fontWeight: "700",

  letterSpacing: 1.2,

  marginBottom: 6,
},

graduationProgramLevel: {
  color: "#fff",

  fontSize: 20,

  fontWeight: "700",

  textAlign: "center",
},

graduationNextProgramLevel: {
  color: "#FFD700",

  fontSize: 22,

  fontWeight: "800",

  textAlign: "center",
},

graduationArrow: {
  color: "#4CAF50",

  fontSize: 30,

  fontWeight: "bold",

  marginVertical: 4,
},

graduationActions: {
  width: "100%",

  marginTop: 4,
},

graduationSecondaryButton: {
  width: "100%",

  marginTop: 14,

  paddingVertical: 16,

  paddingHorizontal: 20,

  borderRadius: 14,

  borderWidth: 1,
  borderColor: "#FFD700",

  alignItems: "center",
  justifyContent: "center",

  backgroundColor: "#222",
},

graduationSecondaryButtonText: {
  color: "#FFD700",

  fontSize: 17,

  fontWeight: "700",
},

graduationChoiceNote: {
  color: "#aaa",

  fontSize: 13,

  lineHeight: 19,

  textAlign: "center",

  marginTop: 12,

  paddingHorizontal: 8,
},

graduationAchievementPlaceholder: {
  width: "100%",

  marginTop: 30,

  padding: 18,

  backgroundColor: "#1A1A1A",

  borderRadius: 14,

  borderWidth: 1,
  borderColor: "#333",

  alignItems: "center",
},

graduationAchievementTitle: {
  color: "#FFD700",

  fontSize: 15,

  fontWeight: "700",

  marginBottom: 6,
},

graduationAchievementText: {
  color: "#777",

  fontSize: 13,

  lineHeight: 19,

  textAlign: "center",
},


recoveryFieldLabel: {
  color: "#ccc",
  marginTop: 8,
  marginBottom: 8,
  fontSize: 14,
  fontWeight: "600",
},

recoveryDurationRow: {
  flexDirection: "row",
  justifyContent: "center",
  gap: 18,
  marginBottom: 16,
},

recoveryDurationColumn: {
  width: 105,
  alignItems: "center",
  backgroundColor: "#16252C",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#365A68",
  paddingVertical: 10,
},

recoveryStepperButton: {
  width: 44,
  height: 34,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  backgroundColor: "#24434F",
},

recoveryStepperButtonText: {
  color: "#B3E5FC",
  fontSize: 22,
  fontWeight: "700",
  lineHeight: 24,
},

recoveryDurationValue: {
  color: "#fff",
  fontSize: 30,
  fontWeight: "800",
  marginTop: 8,
},

recoveryDurationUnit: {
  color: "#8EA9B4",
  fontSize: 12,
  marginBottom: 8,
},

recoveryHelperText: {
  color: "#888",
  fontSize: 12,
  lineHeight: 18,
  marginBottom: 12,
},

graduationVerificationBadge: {
  alignSelf: "center",
  alignItems: "center",
  justifyContent: "center",
  width: 176,
  height: 176,
  borderRadius: 88,
  backgroundColor: "#222",
  borderWidth: 2,
  borderColor: "#4CAF50",
  marginBottom: 24,
  paddingHorizontal: 20,
},

graduationVerificationBadgeIcon: {
  color: "#4CAF50",
  fontSize: 46,
  fontWeight: "800",
  lineHeight: 50,
  marginBottom: 4,
},

graduationVerificationBadgeLabel: {
  color: "#A5D6A7",
  fontSize: 11,
  lineHeight: 15,
  fontWeight: "800",
  letterSpacing: 1,
  textAlign: "center",
  maxWidth: 130,
},

graduationProgramName: {
  color: "#fff",
  fontSize: 20,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 4,
},

graduationProgramMeta: {
  color: "#888",
  fontSize: 13,
  lineHeight: 18,
  textAlign: "center",
},
scheduleSettingsScreen: {
  flex: 1,
  backgroundColor: "#111",
},

scheduleSettingsContent: {
  padding: 20,
  paddingBottom: 40,
},

scheduleSettingsTitle: {
  color: "#fff",
  fontSize: 30,
  fontWeight: "800",
  marginBottom: 24,
},

scheduleSettingsSectionTitle: {
  color: "#FFD700",
  fontSize: 13,
  fontWeight: "800",
  letterSpacing: 1.2,
  marginBottom: 10,
},

scheduleSettingCard: {
  backgroundColor: "#222",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#363636",
  padding: 16,
  marginBottom: 14,
},

scheduleSettingHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
},

scheduleSettingHeaderText: {
  flex: 1,
},

scheduleSettingTitle: {
  color: "#fff",
  fontSize: 17,
  fontWeight: "700",
},

scheduleSettingValueLabel: {
  color: "#FFD700",
  fontSize: 12,
  fontWeight: "700",
  marginTop: 4,
  textTransform: "uppercase",
},

scheduleSettingDescription: {
  color: "#bbb",
  fontSize: 14,
  lineHeight: 20,
  marginTop: 8,
},

scheduleLearnMore: {
  color: "#4FC3F7",
  fontSize: 13,
  fontWeight: "700",
  marginTop: 9,
},

scheduleExpandedHelp: {
  color: "#9fa9ad",
  fontSize: 13,
  lineHeight: 19,
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: "#363636",
},

scheduleStepperRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
  marginVertical: 18,
},

scheduleStepperButton: {
  width: 52,
  height: 52,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#4FC3F7",
  backgroundColor: "#173846",
  alignItems: "center",
  justifyContent: "center",
},

scheduleStepperButtonDisabled: {
  backgroundColor: "#1b1b1b",
  borderColor: "#333",
},

scheduleStepperButtonText: {
  color: "#fff",
  fontSize: 28,
  fontWeight: "700",
  lineHeight: 30,
},

scheduleStepperButtonTextDisabled: {
  color: "#555",
},

scheduleStepperValueBlock: {
  minWidth: 78,
  alignItems: "center",
},

scheduleStepperValue: {
  color: "#FFD700",
  fontSize: 32,
  fontWeight: "800",
},

scheduleStepperUnit: {
  color: "#aaa",
  fontSize: 13,
  marginTop: 2,
},

scheduleSafetyCard: {
  flexDirection: "row",
  gap: 12,
  backgroundColor: "#14292F",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#2E5964",
  padding: 16,
  marginTop: 2,
  marginBottom: 20,
},

scheduleSafetyIcon: {
  fontSize: 24,
},

scheduleSafetyTextBlock: {
  flex: 1,
},

scheduleSafetyTitle: {
  color: "#B3E5FC",
  fontSize: 14,
  fontWeight: "800",
  lineHeight: 19,
},

scheduleSafetyText: {
  color: "#b7c4c9",
  fontSize: 13,
  lineHeight: 19,
  marginTop: 5,
},

scheduleRestoreButton: {
  borderWidth: 1,
  borderColor: "#666",
  borderRadius: 14,
  paddingVertical: 15,
  paddingHorizontal: 16,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 4,
},

scheduleRestoreButtonText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "800",
  letterSpacing: 0.4,
},

scheduleRestoreNote: {
  color: "#888",
  fontSize: 12,
  lineHeight: 18,
  textAlign: "center",
  marginTop: 10,
  paddingHorizontal: 12,
},

});

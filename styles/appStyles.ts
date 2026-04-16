import { StyleSheet } from "react-native";

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
    margin: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
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
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
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
    marginLeft: 10,
    borderRadius: 8,
    width: 80,
    color: "white",
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


});

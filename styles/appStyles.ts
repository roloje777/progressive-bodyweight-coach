//styles/appStyles.ts
import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { AppPalette, useAppPalette } from "@/hooks/use-app-palette";

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

function createAppStyles(palette: AppPalette) {
  return StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    // alignItems: "center",
    padding: 20,
    backgroundColor: palette.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: palette.background,
  },
  exerciseContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
  },
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },

  timer: {
    fontSize: 50,
    color: palette.text,
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#FF6B00",
    margin: 5,
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
    backgroundColor: palette.danger,
    paddingVertical: 18,
    paddingHorizontal: 40,
  },

  disabledButton: {
    backgroundColor: palette.border,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 20,
    letterSpacing: 0.5,
    padding: 5,
  },

  setText: {
    color: palette.primary,
    fontSize: 18,
    marginTop: 5,
  },
  phaseText: {
    fontSize: 18,
    color: palette.primary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.text,
    padding: 8,
    // marginLeft: 10,
    borderRadius: 8,
    width: 80,
    color: palette.text,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: palette.text,
    marginBottom: 20,
    textAlign: "center",
  },
  state: { color: palette.text, fontSize: 16, marginTop: 10 },
  currentSet: {
    fontSize: 20,
    color: "#00FF00",
    marginVertical: 5,
  },

  target: {
    fontSize: 18,
    color: palette.primary,
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
    color: palette.primary,
    fontWeight: "bold",
    marginBottom: 10,
  },

  bigTimer: {
    fontSize: 90,
    fontWeight: "bold",
    color: palette.text,
  },

  secondsLabel: {
    fontSize: 16,
    color: palette.textMuted,
    marginBottom: 20,
  },

  progressBarBackground: {
    width: "80%",
    height: 14,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 10,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF6B00",
  },
  progressBarOvertime: {
    height: "100%",
    backgroundColor: palette.danger,
  },
  dayProgressBar: {
    width: "100%", // full width of the card
    height: 6, // height of the progress bar
    backgroundColor: palette.surfaceAlt, // background for empty progress
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  summaryCard: {
    backgroundColor: palette.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
  },

  exerciseTitle: {
    color: palette.text,
    fontSize: 18,
    marginBottom: 5,
    fontWeight: "bold",
  },

  summaryDate: {
    color: palette.textMuted,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },

  summaryMessage: {
    fontSize: 18,
    color: palette.primary,
    textAlign: "center",
    marginVertical: 20,
  },

  summaryContainer: {
    width: "100%",
    marginTop: 10,
  },
  // Workout Details / Summary styles

  header: {
    color: palette.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: palette.background,
    alignItems: "center",
  },

  subHeader: {
    color: palette.textMuted,
    marginBottom: 10,
  },

  totalWorkout: {
    color: palette.accent,
    marginBottom: 20,
    fontWeight: "bold",
    fontSize: 16,
  },

  exerciseTotal: {
    color: palette.accent,
    marginBottom: 5,
  },

  errorText: {
    color: palette.text,
    fontSize: 16,
    textAlign: "center",
  },
  historyCard: {
    backgroundColor: palette.surface,
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    width: "100%",
  },

  historyDate: {
    color: palette.text,
    fontWeight: "bold",
    marginBottom: 5,
  },

  historyText: {
    color: palette.textMuted,
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
    color: palette.text,
    fontSize: 16,
    fontWeight: "600",
  },

  labelRight: {
    color: palette.primary,
    fontSize: 16,
  },

  titleLeft: {
    fontSize: 26,
    fontWeight: "bold",
    color: palette.text,
  },

  titleRight: {
    fontSize: 16,
    color: palette.primary,
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
    color: palette.primary,
    fontSize: 14,
  },

  programInfo: {
    width: "100%",
    marginBottom: 15,
  },

  dayTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "600",
  },

  programLevel: {
    color: palette.textMuted,
    fontSize: 16,
    marginTop: 2,
  },

  estimateText: {
    color: palette.primary,
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  exerciseList: {
    width: "100%",
    marginTop: 10,
  },

  exerciseCard: {
    backgroundColor: palette.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: palette.border,
  },

  exerciseName: {
    color: palette.primary,
    // color: palette.accent,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  exerciseMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  exerciseType: {
    color: palette.primary,
    textTransform: "capitalize",
  },

  exerciseSets: {
    color: palette.accent,
    fontWeight: "bold",
  },
  exerciseDescription: {
    fontSize: 14,
    color: palette.textMuted, // softer, secondary text
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
    width: "100%",
  },

  cardEnabled: {
    backgroundColor: palette.accent,
  },

  cardDisabled: {
    backgroundColor: palette.surfaceAlt,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
  },

  recommended: {
    fontSize: 12,
    color: palette.primary,
    marginTop: 4,
  },

  status: {
    marginTop: 8,
    fontWeight: "bold",
    color: palette.text,
    alignSelf: "flex-end",
  },
  dayCardBase: {
    padding: 18,
    borderRadius: 16,
  },

  dayCardCurrent: {
    backgroundColor: palette.accent,
  },

  dayCardUnlocked: {
    backgroundColor: palette.surfaceAlt,
  },

  dayCardLocked: {
    backgroundColor: palette.surfaceElevated,
  },
  dayTitleUnlocked: {
    color: palette.text,
  },

  dayTitleLocked: {
    color: "#777",
  },

  dayStatusUnlocked: {
    color: palette.text,
  },

  dayStatusLocked: {
    color: palette.border,
  },
  progressText: {
    marginTop: 8,
    color: palette.textMuted,
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
    backgroundColor: palette.accent,
  },

  toggleOff: {
    backgroundColor: palette.border,
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
    backgroundColor: palette.accent,
  },

  optionInactive: {
    backgroundColor: palette.surfaceAlt,
  },

  optionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },

  optionLabel: {
    color: palette.text,
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
    color: palette.text,
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
    color: palette.primary,
  },

  text: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
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
    backgroundColor: palette.accent,
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
    color: palette.primary,
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
    color: palette.text,
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
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: palette.background,
  },

  topBarEyebrow: {
    color: "#777",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  topBarTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: palette.text,
    textAlign: "center",
  },

  topBarDescription: {
    marginTop: 10,
    fontSize: 13,
    color: palette.textMuted,
  },

  topBarStatusRingContainer: {
    width: 118,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },

  topBarStatusRingCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  topBarStateLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  topBarProgressPercent: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 1,
  },

  topBarProgressCaption: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: -2,
  },

  topBarCoachHeadline: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 330,
  },

  topBarEvidenceRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
    maxWidth: 360,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  topBarEvidenceItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  topBarEvidenceDivider: {
    width: 1,
    backgroundColor: palette.surfaceAlt,
    marginHorizontal: 8,
  },

  topBarEvidenceLabel: {
    color: "#777",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  topBarEvidenceValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  topBarAdherenceText: {
    color: "#777",
    fontSize: 11,
    marginTop: 3,
  },

  topBarAnalyticsLink: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
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
    color: palette.textMuted,
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
    color: palette.textMuted,
  },
  weekDayText: {
    color: palette.textMuted,
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
    color: palette.primary,
    fontSize: 13,
  },

  // completeWorkoutButton: {
  //   backgroundColor: palette.accent,
  //   marginTop: 20,
  //   marginBottom: 20,
  //   paddingVertical: 18,
  //   borderRadius: 14,
  //   alignItems: "center",
  // },
  startWorkoutContainer: {
    paddingTop: 12,
    paddingHorizontal: 4,
    backgroundColor: palette.background,

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
    color: palette.text,
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
    backgroundColor: palette.border,
    marginVertical: 20,
  },

  // -----------------------------------
  // WORKOUT DETAIL
  // -----------------------------------

  detailOverviewCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 22,
    width: "100%",
  },
  detailProgramLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  detailWorkoutTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  detailContextText: {
    color: palette.textMuted,
    fontSize: 15,
    marginBottom: 14,
  },
  detailModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  detailModeBadgeText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  detailSectionTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 12,
    width: "100%",
  },
  detailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
    width: "100%",
  },
  detailStatItem: {
    backgroundColor: palette.surface,
    borderRadius: 10,
    padding: 12,
    minWidth: "47%",
    flexGrow: 1,
    flexBasis: "47%",
  },
  detailStatLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 5,
  },
  detailStatValue: {
    color: palette.accent,
    fontSize: 17,
    fontWeight: "bold",
  },
  detailInfoCard: {
    backgroundColor: palette.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 18,
    width: "100%",
  },
  detailInfoRow: {
    color: palette.textMuted,
    fontSize: 15,
    marginBottom: 7,
  },
  detailFeedbackComment: {
    color: palette.text,
    fontSize: 15,
    marginTop: 4,
  },
  detailSetList: {
    marginTop: 8,
  },
  detailWarningText: {
    color: "#FF6B6B",
    marginBottom: 5,
  },
  detailExportHint: {
    color: palette.textMuted,
    marginBottom: 12,
    width: "100%",
  },
  detailExportRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
    width: "100%",
  },
  detailExportButton: {
    flex: 1,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  detailExportButtonText: {
    color: palette.text,
    fontWeight: "bold",
  },

  // -----------------------------------
  // GRADUATION COACH
  // -----------------------------------

  graduationScreen: {
    flex: 1,
    backgroundColor: palette.background,
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

    borderRadius: 70,

    backgroundColor: palette.surface,

    borderWidth: 2,
    borderColor: palette.primary,

    marginBottom: 24,
  },

  graduationBadgeIcon: {
    fontSize: 56,
    marginBottom: 6,
  },

  graduationBadgeLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 15,
    letterSpacing: 0.4,
    width: "100%",
    paddingHorizontal: 4,
  },

  graduationTitle: {
    color: palette.text,

    fontSize: 30,

    fontWeight: "800",

    textAlign: "center",

    marginBottom: 12,
  },

  graduationLead: {
    color: palette.textMuted,

    fontSize: 17,

    lineHeight: 25,

    textAlign: "center",

    marginBottom: 28,
  },

  graduationCoachCard: {
    width: "100%",

    backgroundColor: palette.surface,

    borderRadius: 16,

    padding: 20,

    borderWidth: 1,
    borderColor: palette.border,

    marginBottom: 20,
  },

  graduationCoachLabel: {
    color: palette.primary,

    fontSize: 13,

    fontWeight: "800",

    letterSpacing: 1.5,

    marginBottom: 12,
  },

  graduationCoachMessage: {
    color: palette.text,

    fontSize: 16,

    lineHeight: 24,

    marginBottom: 12,
  },

  graduationTransitionCard: {
    width: "100%",

    backgroundColor: palette.surfaceElevated,

    borderRadius: 16,

    padding: 20,

    marginBottom: 24,

    borderWidth: 1,
    borderColor: palette.surfaceAlt,

    alignItems: "center",
  },

  graduationProgramBlock: {
    width: "100%",

    alignItems: "center",

    paddingVertical: 10,
  },

  graduationProgramLabel: {
    color: palette.textMuted,

    fontSize: 12,

    fontWeight: "700",

    letterSpacing: 1.2,

    marginBottom: 6,
  },

  graduationProgramLevel: {
    color: palette.text,

    fontSize: 20,

    fontWeight: "700",

    textAlign: "center",
  },

  graduationNextProgramLevel: {
    color: palette.primary,

    fontSize: 22,

    fontWeight: "800",

    textAlign: "center",
  },

  graduationArrow: {
    color: palette.accent,

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
    borderColor: palette.primary,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: palette.surface,
  },

  graduationSecondaryButtonText: {
    color: palette.primary,

    fontSize: 17,

    fontWeight: "700",
  },

  graduationChoiceNote: {
    color: palette.textMuted,

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

    backgroundColor: palette.surfaceElevated,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: palette.surfaceAlt,

    alignItems: "center",
  },

  graduationAchievementTitle: {
    color: palette.primary,

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
    color: palette.textMuted,
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
    backgroundColor: palette.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
  },

  recoveryStepperButton: {
    width: 44,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: palette.surface,
  },

  recoveryStepperButtonText: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },

  recoveryDurationValue: {
    color: palette.text,
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
    color: palette.textMuted,
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
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.accent,
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  graduationVerificationBadgeIcon: {
    color: palette.accent,
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
    color: palette.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },

  graduationProgramMeta: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  scheduleSettingsScreen: {
    flex: 1,
    backgroundColor: palette.background,
  },

  scheduleSettingsContent: {
    padding: 20,
    paddingBottom: 40,
  },

  scheduleSettingsTitle: {
    color: palette.text,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 24,
  },

  scheduleSettingsSectionTitle: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  scheduleSettingCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
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
    color: palette.text,
    fontSize: 17,
    fontWeight: "700",
  },

  scheduleSettingValueLabel: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },

  scheduleSettingDescription: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  scheduleLearnMore: {
    color: palette.info,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 9,
  },

  scheduleExpandedHelp: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.border,
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
    borderColor: palette.info,
    backgroundColor: palette.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleStepperButtonDisabled: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },

  scheduleStepperButtonText: {
    color: palette.text,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },

  scheduleStepperButtonTextDisabled: {
    color: palette.border,
  },

  scheduleStepperValueBlock: {
    minWidth: 78,
    alignItems: "center",
  },

  scheduleStepperValue: {
    color: palette.primary,
    fontSize: 32,
    fontWeight: "800",
  },

  scheduleStepperUnit: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  scheduleSafetyCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
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
    color: palette.info,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },

  scheduleSafetyText: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  scheduleRestoreButton: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  scheduleRestoreButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  scheduleRestoreNote: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  });
}

export function useAppStyles() {
  const palette = useAppPalette();
  return useMemo(() => createAppStyles(palette), [palette]);
}


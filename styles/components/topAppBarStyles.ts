import { StyleSheet } from "react-native";
import { appTokens } from "../appStyles";

export const topAppBarStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: appTokens.colors.background,
  },

  pill: {
    flex: 1,
    marginHorizontal: 6,
    padding: 10,
    backgroundColor: appTokens.colors.card,
    borderRadius: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: appTokens.colors.muted,
  },

  level: {
    fontSize: 16,
    fontWeight: "bold",
    color: appTokens.colors.text,
    marginVertical: 4,
  },

  barBackground: {
    height: 6,
    backgroundColor: "#333", // could also become a token later
    borderRadius: 4,
    overflow: "hidden",
  },

  barFill: {
    height: 6,
    borderRadius: 4,
  },
});
import { Redirect } from "expo-router";

// Legacy Expo-template Explore route. Help & About now lives under Settings.
export default function ExploreRedirect() {
  return <Redirect href="/screens/helpAbout" />;
}

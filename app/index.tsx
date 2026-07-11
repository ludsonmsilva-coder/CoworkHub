import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function Index() {
  const { user, role, isLoading } = useAuth();
  const { isDark } = useAppPreferences();

  if (isLoading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? "bg-paper-dark" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#0E4A7A" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (role === "operator") return <Redirect href="/(operator)/dashboard" />;
  if (role === "member") return <Redirect href="/(member)/home" />;
  return <Redirect href="/(auth)/onboarding" />;
}

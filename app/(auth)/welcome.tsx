import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { LokaroLogo } from "@/components/branding/LokaroLogo";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function Welcome() {
  const { t, isDark } = useAppPreferences();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-white"}`}>
      <View className="flex-1 items-center justify-center px-6 md:px-8">
        <View className="w-full max-w-md items-center">
        <LokaroLogo
          size={72}
          subtitle={isDark ? "Workspace operations" : "Gestão de coworking"}
          dark={isDark}
        />
          <Text className={`text-base text-center mt-4 leading-6 max-w-[320px] ${isDark ? "text-slate-300" : "text-ink-low"}`}>
            {t("auth.welcome.subtitle")}
          </Text>
        </View>
      </View>
      <View className="w-full max-w-md self-center px-6 md:px-8 pb-10 gap-3">
        <Button title={t("auth.welcome.signup")} onPress={() => router.push("/(auth)/signup")} />
        <Button
          title={t("auth.welcome.login")}
          variant="outline"
          onPress={() => router.push("/(auth)/login")}
        />
      </View>
    </SafeAreaView>
  );
}

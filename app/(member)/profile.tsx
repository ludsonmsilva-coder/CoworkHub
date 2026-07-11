import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";

function InfoRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-3.5 border-b ${isDark ? "border-border-dark" : "border-gray-100"}`}>
      <Text className={`text-sm ${isDark ? "text-slate-400" : "text-ink-low"}`}>{label}</Text>
      <Text className={`font-medium text-sm ${isDark ? "text-slate-100" : "text-ink"}`}>{value}</Text>
    </View>
  );
}

export default function Profile() {
  const { member, space, user, signOut } = useAuth();
  const { t, isDark } = useAppPreferences();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      <ScreenHeader title={t("profile.title")} />
      <ScrollView contentContainerClassName="px-5 pb-8">
        <View className={`rounded-2xl px-4 border ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
          <InfoRow label={t("profile.name")} value={member?.name ?? "–"} isDark={isDark} />
          <InfoRow label={t("profile.email")} value={user?.email ?? "–"} isDark={isDark} />
          <InfoRow label={t("profile.space")} value={space?.name ?? "–"} isDark={isDark} />
          <InfoRow label={t("profile.status")} value={member?.status ?? "–"} isDark={isDark} />
        </View>
        <View className="mt-6">
          <Button title={t("common.signOut")} variant="outline" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

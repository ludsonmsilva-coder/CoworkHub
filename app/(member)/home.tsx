import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarRange } from "lucide-react-native";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function MemberHome() {
  const { member, space } = useAuth();
  const { t, isDark } = useAppPreferences();
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.greeting.morning")
      : hour < 18
        ? t("dashboard.greeting.afternoon")
        : t("dashboard.greeting.evening");

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      <View className="px-5 pt-2 pb-4">
        <Text className={`text-sm ${isDark ? "text-slate-400" : "text-ink-low"}`}>
          {greeting}, {member?.name?.split(" ")[0]} 👋
        </Text>
        <Text className={`text-2xl font-bold mt-0.5 ${isDark ? "text-slate-100" : "text-ink"}`}>
          {space?.name}
        </Text>
      </View>
      <EmptyState
        icon={CalendarRange}
        title={t("memberHome.empty")}
        subtitle={t("memberHome.emptyDesc")}
      />
    </SafeAreaView>
  );
}

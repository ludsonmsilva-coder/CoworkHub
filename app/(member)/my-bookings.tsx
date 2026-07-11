import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarRange } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function MyBookings() {
  const { t } = useAppPreferences();
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScreenHeader title={t("tabs.myBookings")} subtitle={t("myBookings.subtitle")} />
      <EmptyState
        icon={CalendarRange}
        title={t("myBookings.empty")}
        subtitle={t("myBookings.emptyDesc")}
      />
    </SafeAreaView>
  );
}

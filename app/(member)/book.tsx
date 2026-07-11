import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarPlus } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function Book() {
  const { t } = useAppPreferences();
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScreenHeader title={t("tabs.book")} subtitle={t("memberBook.subtitle")} />
      <EmptyState
        icon={CalendarPlus}
        title={t("memberBook.empty")}
        subtitle={t("memberBook.emptyDesc")}
      />
    </SafeAreaView>
  );
}

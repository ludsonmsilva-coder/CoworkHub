import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useAppPreferences } from "@/hooks/useAppPreferences";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: Props) {
  const { isDark } = useAppPreferences();

  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="h-16 w-16 rounded-2xl bg-primary-light items-center justify-center mb-4">
        <Icon size={28} color="#0E4A7A" />
      </View>
      <Text className={`text-lg font-semibold text-center ${isDark ? "text-slate-100" : "text-ink"}`}>
        {title}
      </Text>
      {subtitle ? (
        <Text className={`text-sm text-center mt-1.5 leading-5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

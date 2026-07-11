import { Text, View } from "react-native";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { isDark } = useAppPreferences();

  return (
    <View className="px-5 pt-2 pb-4">
      <Text className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>
        {title}
      </Text>
      {subtitle ? (
        <Text className={`mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

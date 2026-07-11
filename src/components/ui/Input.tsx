import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useAppPreferences } from "@/hooks/useAppPreferences";

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...rest }: Props) {
  const { isDark } = useAppPreferences();

  return (
    <View className="w-full mb-4">
      <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
        {label}
      </Text>
      <TextInput
        className={`h-14 rounded-2xl border px-4 text-base ${
          isDark ? "text-slate-100 bg-card-dark border-border-dark" : "text-ink bg-white"
        } ${
          error ? "border-danger" : "border-gray-200 focus:border-primary"
        }`}
        placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
        {...rest}
      />
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}

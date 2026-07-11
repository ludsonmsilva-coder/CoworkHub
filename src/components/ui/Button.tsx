import { ActivityIndicator, Pressable, Text } from "react-native";
import { useAppPreferences } from "@/hooks/useAppPreferences";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  loading,
  variant = "primary",
  disabled,
}: Props) {
  const { isDark } = useAppPreferences();
  const isDisabled = disabled || loading;

  const base = "h-14 rounded-2xl items-center justify-center w-full";
  const styles = {
    primary: `${base} bg-primary ${isDisabled ? "opacity-50" : "active:bg-primary-dark"}`,
    outline: `${base} border-2 border-primary bg-transparent ${isDisabled ? "opacity-50" : ""}`,
    ghost: `${base} bg-transparent`,
  };
  const textStyles = {
    primary: "text-white font-semibold text-base",
    outline: "text-primary font-semibold text-base",
    ghost: `${isDark ? "text-slate-300" : "text-ink-low"} font-medium text-base`,
  };

  return (
    <Pressable
      className={styles[variant]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#0E4A7A"} />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}

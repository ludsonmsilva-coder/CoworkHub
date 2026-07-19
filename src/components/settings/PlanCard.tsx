import { Linking, Pressable, Text, View } from "react-native";
import { Crown } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { cancelPlanUrl, planLimit, upgradeUrl } from "@/lib/plans";

export function PlanCard() {
  const { t, isDark, language } = useAppPreferences();
  const { space } = useAuth();

  const plan = space?.plan ?? "free";
  const limit = planLimit(plan);

  const { data: unitCount } = useQuery({
    queryKey: ["unit-count", space?.id],
    enabled: !!space?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("space_id", space!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const used = unitCount ?? 0;
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const nearLimit = !unlimited && used >= limit - 1;

  return (
    <View
      className={`rounded-2xl p-4 mb-4 border ${
        isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className={`h-9 w-9 rounded-xl items-center justify-center mr-2.5 ${
              plan === "free" ? "bg-primary-light" : "bg-amber-100"
            }`}
          >
            <Crown size={18} color={plan === "free" ? "#2563EB" : "#D97706"} />
          </View>
          <View>
            <Text
              className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}
            >
              {t(`plan.name.${plan}`)}
            </Text>
            <Text
              className={`text-xs ${isDark ? "text-slate-400" : "text-ink-low"}`}
            >
              {unlimited
                ? t("plan.usageUnlimited", { used: String(used) })
                : t("plan.usage", { used: String(used), limit: String(limit) })}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {plan !== "pro" ? (
            <Pressable
              onPress={() => Linking.openURL(upgradeUrl(language))}
              className="px-4 py-2 rounded-full bg-primary active:bg-primary-dark"
            >
              <Text className="text-white text-sm font-semibold">
                {t("plan.upgradeCta")}
              </Text>
            </Pressable>
          ) : null}

          {plan !== "free" ? (
            <Pressable
              onPress={() => Linking.openURL(cancelPlanUrl(language, plan))}
              className={`px-4 py-2 rounded-full border ${
                isDark ? "border-red-500/50 bg-red-500/10" : "border-red-200 bg-red-50"
              }`}
            >
              <Text className="text-danger text-sm font-semibold">{t("plan.cancelCta")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {plan !== "free" ? (
        <Text className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
          {t("plan.cancelHint")}
        </Text>
      ) : null}

      {!unlimited ? (
        <View
          className={`h-1.5 rounded-full overflow-hidden ${
            isDark ? "bg-slate-800" : "bg-gray-100"
          }`}
        >
          <View
            className={`h-1.5 rounded-full ${nearLimit ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </View>
      ) : null}
    </View>
  );
}

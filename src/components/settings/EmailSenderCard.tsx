import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Mail, Lock } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { upgradeUrl } from "@/lib/plans";
import { showAlert } from "@/utils/alert";

export function EmailSenderCard() {
  const { t, isDark, language } = useAppPreferences();
  const { space, refresh } = useAuth();
  const qc = useQueryClient();

  const isPaid = space?.plan === "starter" || space?.plan === "pro";
  const [name, setName] = useState("");

  useEffect(() => {
    setName(space?.email_sender_name ?? space?.name ?? "");
  }, [space?.email_sender_name, space?.name]);

  const save = useMutation({
    mutationFn: async (value: string) => {
      const clean = value.replace(/[<>"]/g, "").trim();
      if (clean.length < 2 || clean.length > 40) throw new Error("INVALID");
      const { error } = await supabase
        .from("spaces")
        .update({ email_sender_name: clean })
        .eq("id", space!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh?.();
      qc.invalidateQueries();
      showAlert(t("common.success"), t("sender.saved"));
    },
    onError: (err: any) => {
      if (err?.message === "INVALID") {
        showAlert(t("common.attention"), t("sender.invalid"));
      } else {
        showAlert(t("common.error"), t("sender.error"));
      }
    },
  });

  return (
    <View
      className={`rounded-2xl p-4 mb-4 border ${
        isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"
      }`}
    >
      <View className="flex-row items-center mb-2">
        <View className="h-9 w-9 rounded-xl items-center justify-center mr-2.5 bg-primary-light">
          <Mail size={18} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>
            {t("sender.title")}
          </Text>
          <Text className={`text-xs ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("sender.subtitle")}
          </Text>
        </View>
      </View>

      {isPaid ? (
        <>
          <Input
            label=""
            placeholder={space?.name ?? "Lokaro"}
            value={name}
            onChangeText={setName}
            maxLength={40}
          />
          <Text className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("sender.preview")}: {(name || space?.name || "Lokaro").replace(/[<>"]/g, "").trim() || "Lokaro"} &lt;lembretes@lokaro.co&gt;
          </Text>
          <Button
            title={t("sender.save")}
            onPress={() => save.mutate(name)}
            loading={save.isPending}
          />
        </>
      ) : (
        <View
          className={`rounded-xl p-3 flex-row items-center ${
            isDark ? "bg-slate-800" : "bg-gray-50"
          }`}
        >
          <Lock size={16} color={isDark ? "#94a3b8" : "#6B7280"} />
          <Text className={`text-xs flex-1 ml-2 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("sender.locked")}
          </Text>
          <Pressable
            onPress={() => Linking.openURL(upgradeUrl(language))}
            className="px-3 py-1.5 rounded-full bg-primary"
          >
            <Text className="text-white text-xs font-semibold">
              {t("plan.upgradeCta")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showAlert } from "@/utils/alert";
import { useAppPreferences } from "@/hooks/useAppPreferences";

const TIMEZONES = [
  { label: "New York (EUA – Leste)", value: "America/New_York" },
  { label: "Chicago (EUA – Central)", value: "America/Chicago" },
  { label: "Denver (EUA – Montanha)", value: "America/Denver" },
  { label: "Los Angeles (EUA – Pacífico)", value: "America/Los_Angeles" },
  { label: "Londres (Reino Unido)", value: "Europe/London" },
  { label: "Berlim (Alemanha)", value: "Europe/Berlin" },
  { label: "Paris (França)", value: "Europe/Paris" },
  { label: "Madri (Espanha)", value: "Europe/Madrid" },
  { label: "São Paulo (Brasil)", value: "America/Sao_Paulo" },
];

const CURRENCIES = [
  { label: "Dólar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "Libra (GBP)", value: "GBP" },
  { label: "Real (BRL)", value: "BRL" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-14 rounded-2xl border px-4 flex-row items-center justify-between mb-2 ${
        selected ? "border-primary bg-primary-light" : "border-gray-200 bg-white"
      }`}
    >
      <Text className={selected ? "text-primary font-semibold" : "text-ink"}>
        {label}
      </Text>
      {selected ? <Text className="text-primary font-bold">✓</Text> : null}
    </Pressable>
  );
}

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const { t } = useAppPreferences();
  const [step, setStep] = useState(1);
  const [spaceName, setSpaceName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("spaces").insert({
      name: spaceName.trim(),
      slug: `${slugify(spaceName)}-${Math.random().toString(36).slice(2, 6)}`,
      owner_id: user.id,
      timezone,
      currency,
    });

    if (error) {
      setLoading(false);
      showAlert(t("common.error"), t("onboarding.error"));
      return;
    }

    await refresh();
    setLoading(false);
    router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="flex-grow px-6 md:px-8 pt-6 pb-10">
        <View className="w-full max-w-lg self-center">
          {/* Indicador de progresso */}
          <View className="flex-row gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  s <= step ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </View>

          {step === 1 && (
            <View className="flex-1">
              <Text className="text-2xl font-bold text-ink mb-1">
                {t("onboarding.step1Title")}
              </Text>
              <Text className="text-ink-low mb-6">
                {t("onboarding.step1Desc")}
              </Text>
              <Input
                label={t("onboarding.spaceName")}
                placeholder={t("onboarding.spaceNamePlaceholder")}
                value={spaceName}
                onChangeText={setSpaceName}
              />
              <Button
                title={t("common.continue")}
                onPress={() => {
                  if (spaceName.trim().length < 3) {
                    showAlert(t("common.attention"), t("onboarding.nameTooShort"));
                    return;
                  }
                  setStep(2);
                }}
              />
            </View>
          )}

          {step === 2 && (
            <View className="flex-1">
              <Text className="text-2xl font-bold text-ink mb-1">
                {t("onboarding.step2Title")}
              </Text>
              <Text className="text-ink-low mb-6">
                {t("onboarding.step2Desc")}
              </Text>
              {TIMEZONES.map((tz) => (
                <OptionRow
                  key={tz.value}
                  label={tz.label}
                  selected={timezone === tz.value}
                  onPress={() => setTimezone(tz.value)}
                />
              ))}
              <View className="mt-4 gap-3">
                <Button title={t("common.continue")} onPress={() => setStep(3)} />
                <Button title={t("common.back")} variant="ghost" onPress={() => setStep(1)} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View className="flex-1">
              <Text className="text-2xl font-bold text-ink mb-1">
                {t("onboarding.step3Title")}
              </Text>
              <Text className="text-ink-low mb-6">
                {t("onboarding.step3Desc")}
              </Text>
              {CURRENCIES.map((c) => (
                <OptionRow
                  key={c.value}
                  label={c.label}
                  selected={currency === c.value}
                  onPress={() => setCurrency(c.value)}
                />
              ))}
              <View className="mt-4 gap-3">
                <Button
                  title={t("onboarding.finish")}
                  onPress={handleFinish}
                  loading={loading}
                />
                <Button title={t("common.back")} variant="ghost" onPress={() => setStep(2)} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

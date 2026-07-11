import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PlanCard } from "@/components/settings/PlanCard";
import { EmailSenderCard } from "@/components/settings/EmailSenderCard";
import { LogoPicker } from "@/components/settings/LogoPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateSpaceSettings } from "@/hooks/useSpaceSettings";
import type { Space } from "@/types";
import { showAlert } from "@/utils/alert";
import {
  useAppPreferences,
  type AppLanguage,
  type AppTheme,
} from "@/hooks/useAppPreferences";
import { LokaroLogo } from "@/components/branding/LokaroLogo";

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/London",
  "Europe/Madrid",
  "Asia/Tokyo",
  "UTC",
];

const CURRENCIES: Space["currency"][] = ["USD", "EUR", "GBP", "BRL"];

export default function SettingsScreen() {
  const { space, user, signOut, refresh } = useAuth();
  const { t, isDark, theme, language, setTheme, setLanguage } = useAppPreferences();
  const updateSpace = useUpdateSpaceSettings();
  const resolvedThemeLabel = isDark
    ? t("settings.theme.currentDark")
    : t("settings.theme.currentLight");

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState<Space["currency"]>("USD");
  const [logoUrl, setLogoUrl] = useState("");

  const [nameError, setNameError] = useState<string | undefined>();
  const [logoError, setLogoError] = useState<string | undefined>();

  useEffect(() => {
    setName(space?.name ?? "");
    setTimezone(space?.timezone ?? "America/Sao_Paulo");
    setCurrency(space?.currency ?? "USD");
    setLogoUrl(space?.logo_url ?? "");
  }, [space?.id, space?.name, space?.timezone, space?.currency, space?.logo_url]);

  const hasChanges = useMemo(() => {
    if (!space) return false;
    return (
      name.trim() !== (space.name ?? "") ||
      timezone !== (space.timezone ?? "") ||
      currency !== (space.currency ?? "USD") ||
      logoUrl.trim() !== (space.logo_url ?? "")
    );
  }, [space, name, timezone, currency, logoUrl]);

  function validate() {
    let valid = true;
    setNameError(undefined);
    setLogoError(undefined);

    if (!name.trim() || name.trim().length < 3) {
      setNameError("Informe um nome com pelo menos 3 caracteres.");
      valid = false;
    }

    if (logoUrl.trim() && !/^https?:\/\//i.test(logoUrl.trim())) {
      setLogoError("A URL deve começar com http:// ou https://");
      valid = false;
    }

    return valid;
  }

  async function handleSave() {
    if (!space?.id) return;
    if (!validate()) return;

    try {
      await updateSpace.mutateAsync({
        id: space.id,
        input: {
          name: name.trim(),
          timezone,
          currency,
          logo_url: logoUrl.trim() || null,
        },
      });
      await refresh();
      showAlert("Sucesso", "Configurações salvas com sucesso.");
    } catch {
      showAlert("Erro", "Não foi possível salvar as configurações.");
    }
  }

  function resetForm() {
    setName(space?.name ?? "");
    setTimezone(space?.timezone ?? "America/Sao_Paulo");
    setCurrency(space?.currency ?? "USD");
    setLogoUrl(space?.logo_url ?? "");
    setNameError(undefined);
    setLogoError(undefined);
  }

  const themeOptions: { value: AppTheme; label: string }[] = [
    {
      value: "system",
      label: t("settings.theme.systemDynamic", { current: resolvedThemeLabel.toLowerCase() }),
    },
    { value: "light", label: t("settings.theme.light") },
    { value: "dark", label: t("settings.theme.dark") },
  ];

  const languageOptions: { value: AppLanguage; label: string }[] = [
    { value: "pt-BR", label: t("settings.language.pt-BR") },
    { value: "en-US", label: t("settings.language.en-US") },
    { value: "es", label: t("settings.language.es") },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      <ScreenHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <ScrollView contentContainerClassName="px-5 pb-8">
        <PlanCard />
        <EmailSenderCard />
        <View className={`rounded-2xl p-4 border mb-4 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
          <Text className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-100" : "text-ink"}`}>
            {t("settings.branding")}
          </Text>
          <Text className={`text-xs mb-3 leading-5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("settings.brandingDesc")}
          </Text>
          <View className={`rounded-xl px-3 py-3 mb-4 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
            <LokaroLogo size={48} subtitle={space?.name ?? t("brand.name")} dark={isDark} />
          </View>

          <Input
            label={t("settings.spaceName")}
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Lokaro Centro"
            error={nameError}
          />

          <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
            {t("settings.timezone")}
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {TIMEZONES.map((tz) => {
              const selected = tz === timezone;
              return (
                <Pressable
                  key={tz}
                  onPress={() => setTimezone(tz)}
                  className={`px-3 py-2 rounded-full border ${
                    selected
                      ? "bg-primary border-primary"
                      : isDark
                        ? "bg-card-dark border-border-dark"
                        : "bg-white border-gray-200"
                  }`}
                  style={({ pressed }) =>
                    pressed
                      ? {
                          transform: [{ scale: 0.98 }],
                          opacity: 0.92,
                        }
                      : undefined
                  }
                >
                  <Text className={`text-xs font-semibold ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    {tz}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
            {t("settings.currency")}
          </Text>
          <View className="flex-row gap-2 mb-4">
            {CURRENCIES.map((curr) => {
              const selected = curr === currency;
              return (
                <Pressable
                  key={curr}
                  onPress={() => setCurrency(curr)}
                  className={`px-4 py-2 rounded-full border ${
                    selected
                      ? "bg-primary border-primary"
                      : isDark
                        ? "bg-card-dark border-border-dark"
                        : "bg-white border-gray-200"
                  }`}
                  style={({ pressed }) =>
                    pressed
                      ? {
                          transform: [{ scale: 0.98 }],
                          opacity: 0.92,
                        }
                      : undefined
                  }
                >
                  <Text className={`text-sm font-semibold ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    {curr}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <LogoPicker
            currentUrl={logoUrl.trim()}
            onUploaded={(url) => setLogoUrl(url)}
          />
          <Input
            label={t("settings.logoUrl")}
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            error={logoError}
          />
        </View>

        <View className={`rounded-2xl p-4 border mb-4 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
          <Text className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-100" : "text-ink"}`}>
            {t("settings.appearance")}
          </Text>

          <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
            {t("settings.theme")}
          </Text>
          <View className="flex-row gap-2 mb-4">
            {themeOptions.map((item) => {
              const selected = item.value === theme;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    void setTheme(item.value);
                  }}
                  className={`px-4 py-2 rounded-full border ${
                    selected
                      ? "bg-primary border-primary"
                      : isDark
                        ? "bg-card-dark border-border-dark"
                        : "bg-white border-gray-200"
                  }`}
                  style={({ pressed }) =>
                    pressed
                      ? {
                          transform: [{ scale: 0.98 }],
                          opacity: 0.92,
                        }
                      : undefined
                  }
                >
                  <Text className={`text-sm font-semibold ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className={`text-xs mb-4 leading-5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("settings.theme.systemHelp", { current: resolvedThemeLabel.toLowerCase() })}
          </Text>

          <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
            {t("settings.language")}
          </Text>
          <View className="flex-row gap-2">
            {languageOptions.map((item) => {
              const selected = item.value === language;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    void setLanguage(item.value);
                  }}
                  className={`px-4 py-2 rounded-full border ${
                    selected
                      ? "bg-primary border-primary"
                      : isDark
                        ? "bg-card-dark border-border-dark"
                        : "bg-white border-gray-200"
                  }`}
                  style={({ pressed }) =>
                    pressed
                      ? {
                          transform: [{ scale: 0.98 }],
                          opacity: 0.92,
                        }
                      : undefined
                  }
                >
                  <Text className={`text-sm font-semibold ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className={`rounded-2xl p-4 border mb-4 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
          <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("settings.loggedAccount")}
          </Text>
          <Text className={`font-medium ${isDark ? "text-slate-100" : "text-ink"}`}>{user?.email ?? "–"}</Text>
        </View>

        <Text className={`text-xs mt-1 mb-5 px-1 leading-5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
          {t("settings.persistence")}
        </Text>

        {updateSpace.isPending ? (
          <View className={`mb-4 rounded-xl p-3 border flex-row items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-primary-light border-blue-100"}`}>
            <ActivityIndicator size="small" color="#0E4A7A" />
            <Text className={`text-xs ml-2 ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
              Salvando configurações...
            </Text>
          </View>
        ) : null}

        <View className="mb-3">
          <Button
            title={t("settings.save")}
            onPress={() => {
              void handleSave();
            }}
            loading={updateSpace.isPending}
            disabled={!hasChanges}
          />
        </View>

        <View className="mb-6">
          <Button
            title={t("settings.discard")}
            variant="ghost"
            onPress={resetForm}
            disabled={!hasChanges || updateSpace.isPending}
          />
        </View>

        <Button title={t("common.signOut")} variant="outline" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

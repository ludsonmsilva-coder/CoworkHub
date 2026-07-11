import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showAlert } from "@/utils/alert";
import { LokaroLogo } from "@/components/branding/LokaroLogo";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function Login() {
  const { t, isDark } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      showAlert(t("common.attention"), t("auth.login.fillFields"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      showAlert(t("common.error"), t("auth.login.invalid"));
      return;
    }
    router.replace("/");
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10">
            <LokaroLogo size={58} showWordmark={false} dark={isDark} />
            <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-slate-100" : "text-ink"}`}>
              {t("auth.login.title")}
            </Text>
            <Text className={`${isDark ? "text-slate-400" : "text-ink-low"} mt-1`}>
              {t("auth.login.subtitle")}
            </Text>
          </View>

          <Input
            label="Email"
            placeholder="voce@exemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label={t("auth.password")}
            placeholder={t("auth.yourPassword")}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View className="mt-2 gap-3">
            <Button title={t("auth.login.submit")} onPress={handleLogin} loading={loading} />
            <Button
              title={t("auth.login.signup")}
              variant="ghost"
              onPress={() => router.replace("/(auth)/signup")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

export default function Signup() {
  const { t, isDark } = useAppPreferences();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      showAlert(t("common.attention"), t("auth.signup.fillFields"));
      return;
    }
    if (password.length < 6) {
      showAlert(t("common.attention"), t("auth.signup.shortPassword"));
      return;
    }
    if (password !== confirm) {
      showAlert(t("common.attention"), t("auth.signup.mismatch"));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);

    if (error) {
      showAlert("Erro ao criar conta", error.message);
      return;
    }

    if (!data.session) {
      showAlert(t("auth.signup.confirmEmailTitle"), t("auth.signup.confirmEmailDesc"));
      router.replace("/(auth)/login");
      return;
    }

    router.replace("/(auth)/onboarding");
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-white"}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-8 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <LokaroLogo size={58} showWordmark={false} dark={isDark} />
            <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-slate-100" : "text-ink"}`}>
              {t("auth.signup.title")}
            </Text>
            <Text className={`${isDark ? "text-slate-400" : "text-ink-low"} mt-1`}>
              {t("auth.signup.subtitle")}
            </Text>
          </View>

          <Input
            label={t("auth.signup.name")}
            placeholder={t("auth.signup.namePlaceholder")}
            value={name}
            onChangeText={setName}
          />
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
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label={t("auth.confirmPassword")}
            placeholder={t("auth.confirmPlaceholder")}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          <View className="mt-2 gap-3">
            <Button title={t("auth.signup.submit")} onPress={handleSignup} loading={loading} />
            <Button
              title={t("auth.signup.login")}
              variant="ghost"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

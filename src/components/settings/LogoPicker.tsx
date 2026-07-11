import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { showAlert } from "@/utils/alert";

function base64ToBytes(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = chars.indexOf(clean[i]);
    const b = chars.indexOf(clean[i + 1]);
    const c = chars.indexOf(clean[i + 2]);
    const d = chars.indexOf(clean[i + 3]);
    bytes[p++] = (a << 2) | (b >> 4);
    if (c >= 0) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (d >= 0) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes.slice(0, p);
}

interface Props {
  currentUrl: string;
  onUploaded: (publicUrl: string) => void;
}

export function LogoPicker({ currentUrl, onUploaded }: Props) {
  const { t, isDark } = useAppPreferences();
  const { space } = useAuth();
  const [uploading, setUploading] = useState(false);

  async function pickAndUpload() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert(t("common.attention"), t("logo.permission"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);

      // Redimensionar para a resolução certa de logo (512px)
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.PNG, base64: true }
      );

      if (!resized.base64) throw new Error("NO_BASE64");

      const path = `${space!.id}/logo.png`;
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, base64ToBytes(resized.base64), {
          contentType: "image/png",
          upsert: true,
        });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      // cache-buster para os emails sempre pegarem a versão nova
      const url = `${data.publicUrl}?v=${Date.now()}`;
      onUploaded(url);
      showAlert(t("common.success"), t("logo.uploaded"));
    } catch {
      showAlert(t("common.error"), t("logo.error"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-3">
        {currentUrl ? (
          <Image
            source={{ uri: currentUrl }}
            style={{ width: 56, height: 56, borderRadius: 12 }}
            resizeMode="contain"
          />
        ) : (
          <View
            className={`h-14 w-14 rounded-xl items-center justify-center ${
              isDark ? "bg-slate-800" : "bg-gray-100"
            }`}
          >
            <ImagePlus size={22} color={isDark ? "#94a3b8" : "#6B7280"} />
          </View>
        )}
        <Pressable
          onPress={pickAndUpload}
          disabled={uploading}
          className={`px-4 py-2.5 rounded-xl border ${
            isDark ? "border-border-dark bg-card-dark" : "border-gray-200 bg-white"
          } ${uploading ? "opacity-50" : ""}`}
        >
          <Text className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-ink"}`}>
            {uploading ? t("logo.uploading") : t("logo.pick")}
          </Text>
        </Pressable>
      </View>
      <Text className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
        {t("logo.hint")}
      </Text>
    </View>
  );
}

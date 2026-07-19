import { useEffect, useState } from "react";
import {
  Linking,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSaveRoom, type RoomInput } from "@/hooks/useRooms";
import { upgradeUrl } from "@/lib/plans";
import type { Room, RoomType } from "@/types";
import { showAlert, showConfirm } from "@/utils/alert";
import { useAppPreferences } from "@/hooks/useAppPreferences";

const TYPES: RoomType[] = ["meeting_room", "hot_desk", "private_office", "house", "kitnet", "apartment"];
const MONTHLY_TYPES: RoomType[] = ["house", "kitnet", "apartment"];

const COLORS = [
  "#2563EB", "#059669", "#DC2626", "#D97706",
  "#7C3AED", "#DB2777", "#0891B2", "#4B5563",
];

function normalizeTime(raw: string, fallback: string) {
  const clean = raw.trim();
  let h: number | null = null;
  let m: number | null = null;
  const withColon = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (withColon) {
    h = Number(withColon[1]);
    m = Number(withColon[2]);
  } else {
    const digits = clean.replace(/\D/g, "");
    if (digits.length === 1 || digits.length === 2) {
      h = Number(digits);
      m = 0;
    } else if (digits.length === 3) {
      h = Number(digits.slice(0, 1));
      m = Number(digits.slice(1));
    } else if (digits.length === 4) {
      h = Number(digits.slice(0, 2));
      m = Number(digits.slice(2));
    }
  }
  if (h === null || m === null || h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  room?: Room | null;
}

export function RoomFormModal({ visible, onClose, room }: Props) {
  const { t, isDark, language } = useAppPreferences();
  const { height: viewportHeight } = useWindowDimensions();
  const isEdit = !!room;
  const save = useSaveRoom();

  const [name, setName] = useState("");
  const [type, setType] = useState<RoomType>("meeting_room");
  const [capacity, setCapacity] = useState("1");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isActive, setIsActive] = useState(true);
  const [is24h, setIs24h] = useState(false);
  const [openTime, setOpenTime] = useState("07:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const isMonthlyPrice = MONTHLY_TYPES.includes(type);
  const webMaxHeight = Math.max(420, Math.min(760, viewportHeight - 24));

  useEffect(() => {
    if (visible) {
      setName(room?.name ?? "");
      setType(room?.type ?? "meeting_room");
      setCapacity(String(room?.capacity ?? 1));
      setPrice(room?.price_per_hour ? String(room.price_per_hour) : "");
      setColor(room?.color ?? COLORS[0]);
      setIsActive(room?.is_active ?? true);
      setIs24h(room?.is_24h ?? false);
      setOpenTime((room?.open_time ?? "07:00").slice(0, 5));
      setCloseTime((room?.close_time ?? "21:00").slice(0, 5));
    }
  }, [visible, room]);

  async function handleSave() {
    if (name.trim().length < 2) {
      showAlert(t("common.attention"), t("room.nameRequired"));
      return;
    }
    const cap = parseInt(capacity, 10);
    if (!cap || cap < 1) {
      showAlert(t("common.attention"), t("room.capacityInvalid"));
      return;
    }

    const input: RoomInput = {
      name: name.trim(),
      type,
      capacity: cap,
      price_per_hour: price ? parseFloat(price.replace(",", ".")) : null,
      color,
      is_active: isActive,
      is_24h: is24h,
      open_time: is24h ? "00:00" : normalizeTime(openTime, "07:00"),
      close_time: is24h ? "23:59" : normalizeTime(closeTime, "21:00"),
    };

    try {
      await save.mutateAsync({ id: room?.id, input });
      onClose();
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "";
      if (msg.startsWith("PLAN_LIMIT")) {
        const limit = msg.split(":")[1] ?? "2";
        showConfirm(
          t("plan.limitTitle"),
          t("plan.limitMsg", { limit }),
          () => Linking.openURL(upgradeUrl(language)),
          t("plan.upgradeCta")
        );
      } else {
        showAlert(t("common.error"), t("room.saveError"));
      }
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className={`flex-1 bg-black/40 ${Platform.OS === "web" ? "justify-center" : "justify-end"}`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: Platform.OS === "web" ? "center" : "flex-end" }}
        >
          <View
            className={`${Platform.OS === "web" ? "w-[95%] max-w-3xl self-center rounded-3xl" : "max-h-[90%] rounded-t-3xl"} overflow-hidden ${isDark ? "bg-paper-dark" : "bg-white"}`}
            style={Platform.OS === "web" ? { maxHeight: webMaxHeight } : undefined}
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>
                {isEdit ? t("room.modal.edit") : t("room.modal.new")}
              </Text>
              <Pressable
                onPress={onClose}
                className={`h-9 w-9 rounded-full items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
              >
                <X size={18} color="#3D4451" />
              </Pressable>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-5 pb-8"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Input
                label={t("room.name")}
                placeholder={t("room.namePlaceholder")}
                value={name}
                onChangeText={setName}
              />

              <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{t("room.type")}</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {TYPES.map((opt) => {
                  const sel = type === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setType(opt)}
                      className={`px-4 py-2.5 rounded-full border ${
                        sel
                          ? "bg-primary border-primary"
                          : isDark
                            ? "bg-card-dark border-border-dark"
                            : "bg-white border-gray-200"
                      }`}
                      style={Platform.OS === "web" ? { minWidth: 128, alignItems: "center" } : undefined}
                    >
                      <Text className={`text-sm font-medium ${sel ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                        {t(`roomType.${opt}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="flex-col md:flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label={t("room.capacity")}
                    keyboardType="number-pad"
                    value={capacity}
                    onChangeText={setCapacity}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label={t(isMonthlyPrice ? "room.pricePerMonth" : "room.pricePerHour")}
                    placeholder={t("room.optional")}
                    keyboardType="decimal-pad"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>

              <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                {t("room.color")}
              </Text>
              <View className="flex-row flex-wrap gap-3 mb-5">
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    className={`h-10 w-10 rounded-full items-center justify-center ${
                      color === c ? (isDark ? "border-2 border-slate-100" : "border-2 border-ink") : ""
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c ? (
                      <Text className="text-white font-bold">✓</Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>

              <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                {t("room.businessHours")}
              </Text>
              <View className="flex-row items-center justify-between mb-3">
                <Text className={`font-medium ${isDark ? "text-slate-100" : "text-ink"}`}>{t("room.open24h")}</Text>
                <Switch
                  value={is24h}
                  onValueChange={setIs24h}
                  trackColor={{ true: "#0E4A7A" }}
                />
              </View>
              {!is24h ? (
                <View className="flex-col md:flex-row gap-3 mb-1">
                  <View className="flex-1">
                    <Input
                      label={t("room.opensAt")}
                      placeholder="0700"
                      keyboardType="number-pad"
                      value={openTime}
                      onChangeText={setOpenTime}
                      onBlur={() => setOpenTime(normalizeTime(openTime, "07:00"))}
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label={t("room.closesAt")}
                      placeholder="2100"
                      keyboardType="number-pad"
                      value={closeTime}
                      onChangeText={setCloseTime}
                      onBlur={() => setCloseTime(normalizeTime(closeTime, "21:00"))}
                    />
                  </View>
                </View>
              ) : null}
              {!is24h ? (
                <Text className={`text-xs mb-5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                  {t("room.hoursHelp")}
                </Text>
              ) : null}

              <View className="flex-row items-center justify-between mb-6">
                <Text className={`font-medium ${isDark ? "text-slate-100" : "text-ink"}`}>{t("room.isActive")}</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ true: "#0E4A7A" }}
                />
              </View>

              <Button
                title={isEdit ? t("room.modal.save") : t("room.modal.create")}
                onPress={handleSave}
                loading={save.isPending}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

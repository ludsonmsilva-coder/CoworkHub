import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateLease } from "@/hooks/useLeases";
import { useRooms } from "@/hooks/useRooms";
import { useMembers } from "@/hooks/useMembers";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { showAlert } from "@/utils/alert";

const DUE_DAYS = [1, 5, 10, 15, 20, 25];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LeaseFormModal({ visible, onClose }: Props) {
  const { t, isDark } = useAppPreferences();
  const { data: rooms } = useRooms(true);
  const { data: members } = useMembers("", null);
  const create = useCreateLease();

  const [unitId, setUnitId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [rent, setRent] = useState("");
  const [dueDay, setDueDay] = useState(5);
  const [customDay, setCustomDay] = useState("");

  useEffect(() => {
    if (visible) {
      setUnitId(null);
      setMemberId(null);
      setRent("");
      setDueDay(5);
      setCustomDay("");
    }
  }, [visible]);

  const eligibleMembers = (members ?? []).filter(
    (m) => m.status !== "inactive"
  );

  async function handleSave() {
    if (!unitId) return showAlert(t("common.attention"), t("lease.chooseUnit"));
    if (!memberId)
      return showAlert(t("common.attention"), t("booking.chooseMember"));

    const rentValue = parseFloat(rent.replace(/\./g, "").replace(",", "."));
    if (!rentValue || rentValue <= 0) {
      return showAlert(t("common.attention"), t("lease.rentInvalid"));
    }

    let day = dueDay;
    if (customDay.trim()) {
      const parsed = parseInt(customDay, 10);
      if (!parsed || parsed < 1 || parsed > 28) {
        return showAlert(t("common.attention"), t("lease.dueDayInvalid"));
      }
      day = parsed;
    }

    try {
      await create.mutateAsync({
        unit_id: unitId,
        member_id: memberId,
        monthly_rent: rentValue,
        due_day: day,
        starts_on: todayISO(),
      });
      onClose();
    } catch (err: any) {
      if (err?.message === "UNIT_OCCUPIED") {
        showAlert(t("lease.occupiedTitle"), t("lease.occupiedMsg"));
      } else {
        showAlert(t("common.error"), t("lease.saveError"));
      }
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className={`rounded-t-3xl max-h-[90%] ${isDark ? "bg-paper-dark" : "bg-white"}`}
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text
                className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}
              >
                {t("lease.newTitle")}
              </Text>
              <Pressable
                onPress={onClose}
                className={`h-9 w-9 rounded-full items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
              >
                <X size={18} color={isDark ? "#cbd5e1" : "#3D4451"} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerClassName="px-5 pb-8"
              keyboardShouldPersistTaps="handled"
            >
              {/* Unidade */}
              <Text
                className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}
              >
                {t("lease.unit")}
              </Text>
              {(rooms ?? []).length === 0 ? (
                <Text
                  className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-ink-low"}`}
                >
                  {t("booking.noRooms")}
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {(rooms ?? []).map((r) => {
                    const sel = unitId === r.id;
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => setUnitId(r.id)}
                        className={`px-4 py-2.5 rounded-full border flex-row items-center ${
                          sel
                            ? "border-primary bg-primary-light"
                            : isDark
                              ? "bg-card-dark border-border-dark"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <View
                          className="h-2.5 w-2.5 rounded-full mr-2"
                          style={{ backgroundColor: r.color }}
                        />
                        <Text
                          className={`text-sm font-medium ${
                            sel
                              ? "text-primary"
                              : isDark
                                ? "text-slate-300"
                                : "text-ink-mid"
                          }`}
                        >
                          {r.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Inquilino */}
              <Text
                className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}
              >
                {t("lease.tenant")}
              </Text>
              <View className="mb-4" style={{ maxHeight: 180 }}>
                <ScrollView nestedScrollEnabled>
                  {eligibleMembers.map((m) => {
                    const sel = memberId === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMemberId(m.id)}
                        className={`h-12 rounded-xl border px-4 flex-row items-center justify-between mb-2 ${
                          sel
                            ? "border-primary bg-primary-light"
                            : isDark
                              ? "bg-card-dark border-border-dark"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text
                          className={
                            sel
                              ? "text-primary font-semibold"
                              : isDark
                                ? "text-slate-200"
                                : "text-ink"
                          }
                        >
                          {m.name}
                        </Text>
                        {sel ? (
                          <Text className="text-primary font-bold">✓</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Valor mensal */}
              <Input
                label={t("lease.monthlyRent")}
                placeholder="1500,00"
                keyboardType="decimal-pad"
                value={rent}
                onChangeText={setRent}
              />

              {/* Dia de vencimento */}
              <Text
                className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}
              >
                {t("lease.dueDay")}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {DUE_DAYS.map((d) => {
                  const sel = dueDay === d && !customDay.trim();
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        setDueDay(d);
                        setCustomDay("");
                      }}
                      className={`px-4 py-2.5 rounded-full border ${
                        sel
                          ? "bg-primary border-primary"
                          : isDark
                            ? "bg-card-dark border-border-dark"
                            : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          sel
                            ? "text-white"
                            : isDark
                              ? "text-slate-300"
                              : "text-ink-mid"
                        }`}
                      >
                        {t("lease.dayN", { d })}
                      </Text>
                    </Pressable>
                  );
                })}
                <View style={{ width: 110 }}>
                  <Input
                    label=""
                    placeholder={t("lease.otherDay")}
                    keyboardType="number-pad"
                    value={customDay}
                    onChangeText={setCustomDay}
                  />
                </View>
              </View>

              <Text
                className={`text-xs mb-5 ${isDark ? "text-slate-400" : "text-ink-low"}`}
              >
                {t("lease.autoInfo")}
              </Text>

              <Button
                title={t("lease.create")}
                onPress={handleSave}
                loading={create.isPending}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

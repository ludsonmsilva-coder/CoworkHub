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
import {
  useCreateMember,
  useUpdateMember,
  type MemberInput,
} from "@/hooks/useMembers";
import type { Member, MemberStatus } from "@/types";
import { showAlert } from "@/utils/alert";
import { useAppPreferences } from "@/hooks/useAppPreferences";

const STATUS_OPTIONS: MemberStatus[] = ["active", "trial", "overdue", "inactive"];

interface Props {
  visible: boolean;
  onClose: () => void;
  member?: Member | null; // se vier, é edição
}

export function MemberFormModal({ visible, onClose, member }: Props) {
  const { t, isDark } = useAppPreferences();
  const isEdit = !!member;
  const create = useCreateMember();
  const update = useUpdateMember();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<MemberStatus>("active");

  useEffect(() => {
    if (visible) {
      setName(member?.name ?? "");
      setEmail(member?.email ?? "");
      setPhone(member?.phone ?? "");
      setStatus(member?.status ?? "active");
    }
  }, [visible, member]);

  const loading = create.isPending || update.isPending;

  async function handleSave() {
    if (name.trim().length < 2) {
      showAlert(t("common.attention"), t("member.nameRequired"));
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      showAlert(t("common.attention"), t("member.emailInvalid"));
      return;
    }

    const input: MemberInput = { name, email, phone, status };

    try {
      if (isEdit && member) {
        await update.mutateAsync({ id: member.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err: any) {
      if (err?.code === "23505") {
        showAlert(t("member.emailDupTitle"), t("member.emailDupDesc"));
      } else {
        showAlert(t("common.error"), t("member.saveError"));
      }
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className={`rounded-t-3xl max-h-[90%] ${isDark ? "bg-paper-dark" : "bg-white"}`}>
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>
                {isEdit ? t("member.modal.edit") : t("member.modal.new")}
              </Text>
              <Pressable
                onPress={onClose}
                className={`h-9 w-9 rounded-full items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                style={({ pressed }) =>
                  pressed
                    ? {
                        transform: [{ scale: 0.96 }],
                        opacity: 0.9,
                      }
                    : undefined
                }
              >
                <X size={18} color="#3D4451" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerClassName="px-5 pb-8"
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label={t("member.name")}
                placeholder={t("member.namePlaceholder")}
                value={name}
                onChangeText={setName}
              />
              <Input
                label={t("member.email")}
                placeholder={t("member.emailPlaceholder")}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                label={t("member.phone")}
                placeholder={t("room.optional")}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                {t("member.status")}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {STATUS_OPTIONS.map((opt) => {
                  const selected = status === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setStatus(opt)}
                      className={`px-4 py-2.5 rounded-full border ${
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
                      <Text
                        className={`text-sm font-medium ${
                          selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"
                        }`}
                      >
                        {t(`badge.${opt}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Button
                title={isEdit ? t("member.modal.save") : t("member.modal.create")}
                onPress={handleSave}
                loading={loading}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

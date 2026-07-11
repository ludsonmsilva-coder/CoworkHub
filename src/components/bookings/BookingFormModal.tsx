import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useCreateBooking } from "@/hooks/useBookings";
import { useRooms } from "@/hooks/useRooms";
import { useMembers } from "@/hooks/useMembers";
import { showAlert, showConfirm } from "@/utils/alert";
import { useAppPreferences } from "@/hooks/useAppPreferences";

type DurationUnit = "hours" | "days" | "months";

const DURATION_UNITS: DurationUnit[] = ["hours", "days", "months"];

function formatTimeInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  if (digits.length === 3) return `${digits.slice(0, 1)}:${digits.slice(1)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseDurationValue(input: string, unit: DurationUnit) {
  const clean = input.trim();

  if (unit === "hours") {
    const hhmm = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) {
      const h = Number(hhmm[1]);
      const m = Number(hhmm[2]);
      if (m >= 60) return null;
      return h + m / 60;
    }
  }

  const normalized = clean.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  dayISO: string; // "2026-07-02"
}

export function BookingFormModal({ visible, onClose, dayISO }: Props) {
  const { t, isDark } = useAppPreferences();
  const { data: rooms } = useRooms(true);
  const { data: members } = useMembers("", null);
  const create = useCreateBooking();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [startTimeInput, setStartTimeInput] = useState("08:00");
  const [durationValueInput, setDurationValueInput] = useState("1");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("hours");
  const [reminderHours, setReminderHours] = useState<number | null>(24);

  useEffect(() => {
    if (!visible) {
      setStartTimeInput("08:00");
      setDurationValueInput("1");
      setDurationUnit("hours");
    }
  }, [visible]);

  function parseTimeInput(value: string) {
    const clean = value.trim();

    // Aceita com dois-pontos: "9:30", "10:00"
    let hours: number | null = null;
    let minutes: number | null = null;

    const withColon = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (withColon) {
      hours = Number(withColon[1]);
      minutes = Number(withColon[2]);
    } else {
      // Aceita só dígitos: "8" -> 08:00, "10" -> 10:00, "930" -> 09:30, "1030" -> 10:30
      const digits = clean.replace(/\D/g, "");
      if (digits.length === 1 || digits.length === 2) {
        hours = Number(digits);
        minutes = 0;
      } else if (digits.length === 3) {
        hours = Number(digits.slice(0, 1));
        minutes = Number(digits.slice(1));
      } else if (digits.length === 4) {
        hours = Number(digits.slice(0, 2));
        minutes = Number(digits.slice(2));
      }
    }

    if (hours === null || minutes === null) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return {
      hours,
      minutes,
      normalized: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    };
  }

  function computeEndDate(startsAt: Date, durationValue: number, unit: DurationUnit) {
    const end = new Date(startsAt);

    if (unit === "months") {
      end.setMonth(end.getMonth() + durationValue);
      return end;
    }

    if (unit === "days") {
      end.setTime(end.getTime() + durationValue * 24 * 60 * 60 * 1000);
      return end;
    }

    end.setTime(end.getTime() + durationValue * 60 * 60 * 1000);
    return end;
  }

  const eligibleMembers = useMemo(
    () => (members ?? []).filter((m) => m.status !== "overdue" && m.status !== "inactive"),
    [members]
  );

  const bookingPreview = useMemo(() => {
    const parsedTime = parseTimeInput(startTimeInput);
    const durationValue = parseDurationValue(durationValueInput, durationUnit);

    if (!parsedTime || !durationValue) {
      return null;
    }

    const starts = new Date(`${dayISO}T00:00:00`);
    starts.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    const ends = computeEndDate(starts, durationValue, durationUnit);

    const fmt = (d: Date) =>
      d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    return {
      starts,
      ends,
      startLabel: fmt(starts),
      endLabel: fmt(ends),
    };
  }, [dayISO, startTimeInput, durationValueInput, durationUnit]);

  async function handleSave() {
    if (!roomId) return showAlert(t("common.attention"), t("booking.chooseRoom"));
    if (!memberId) return showAlert(t("common.attention"), t("booking.chooseMember"));
    if (!startTimeInput.trim()) {
      return showAlert("Atenção", "Informe o horário inicial no formato HH:MM.");
    }

    const parsedTime = parseTimeInput(startTimeInput);
    if (!parsedTime) {
      return showAlert("Atenção", "Informe a hora com 3 ou 4 dígitos (ex.: 900 ou 0930).");
    }
    setStartTimeInput(parsedTime.normalized);

    const durationValue = parseDurationValue(durationValueInput, durationUnit);
    if (!durationValue) {
      return showAlert(
        "Atenção",
        durationUnit === "hours"
          ? "Informe uma duração válida. Ex.: 1,5 ou 1:30."
          : "Informe uma duração válida maior que zero."
      );
    }

    if (durationUnit === "months" && !Number.isInteger(durationValue)) {
      return showAlert("Atenção", "Para meses, use apenas número inteiro (ex.: 1, 2, 3).");
    }

    const starts = new Date(`${dayISO}T00:00:00`);
    starts.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    const ends = computeEndDate(starts, durationValue, durationUnit);

    const doCreate = async () => {
    try {
      await create.mutateAsync({
        room_id: roomId,
        member_id: memberId,
        starts_at: starts,
        ends_at: ends,
        reminder_hours: reminderHours,
      });
      setRoomId(null);
      setMemberId(null);
      setStartTimeInput("08:00");
      setDurationValueInput("1");
      setDurationUnit("hours");
      onClose();
    } catch (err: any) {
      if (err?.message === "CONFLICT") {
        showAlert(t("booking.conflictTitle"), t("booking.conflictMsg"));
      } else if (
        typeof err?.message === "string" &&
        err.message.startsWith("OUTSIDE_BUSINESS_HOURS")
      ) {
        const range = err.message.split(":").slice(1).join(":") || "07:00-21:00";
        const [open, close] = range.split("-");
        showAlert(t("booking.outsideTitle"), t("booking.outsideMsg", { open, close }));
      } else {
        showAlert(t("common.error"), t("booking.createError"));
      }
    }
    };

    if (starts.getTime() < Date.now()) {
      showConfirm(t("booking.pastTitle"), t("booking.pastMsg"), doCreate, t("booking.pastConfirm"));
      return;
    }

    await doCreate();
  }

  const dayLabel = new Date(`${dayISO}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className={`rounded-t-3xl ${isDark ? "bg-paper-dark" : "bg-white"}`} style={{ maxHeight: "92%" }}>
          <View className="flex-row items-center justify-between px-5 pt-5 pb-1">
            <View>
              <Text className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>{t("booking.modal.new")}</Text>
              <Text className={`text-xs capitalize ${isDark ? "text-slate-400" : "text-ink-low"}`}>{dayLabel}</Text>
            </View>
            <Pressable
              onPress={onClose}
              className={`h-9 w-9 rounded-full items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
            >
              <X size={18} color="#3D4451" />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="px-5 pb-8 pt-3">
            {/* Sala */}
            <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{t("booking.room")}</Text>
            {(rooms ?? []).length === 0 ? (
              <Text className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                {t("booking.noRooms")}
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {(rooms ?? []).map((r) => {
                  const sel = roomId === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setRoomId(r.id)}
                      className={`px-4 py-2.5 rounded-full border flex-row items-center ${
                        sel
                          ? "border-primary bg-primary-light"
                          : isDark
                            ? "border-border-dark bg-card-dark"
                            : "border-gray-200 bg-white"
                      }`}
                    >
                      <View
                        className="h-2.5 w-2.5 rounded-full mr-2"
                        style={{ backgroundColor: r.color }}
                      />
                      <Text className={`text-sm font-medium ${sel ? "text-primary" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                        {r.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Membro */}
            <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{t("booking.member")}</Text>
            {eligibleMembers.length === 0 ? (
              <Text className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                {t("booking.noMembers")}
              </Text>
            ) : (
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
                              ? "border-border-dark bg-card-dark"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text className={sel ? "text-primary font-semibold" : isDark ? "text-slate-100" : "text-ink"}>
                          {m.name}
                        </Text>
                        {sel ? <Text className="text-primary font-bold">✓</Text> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Início */}
            <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{t("booking.start")}</Text>
            <TextInput
              className={`h-12 rounded-xl border px-4 text-base mb-4 ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
              placeholder="0900"
              placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
              value={startTimeInput}
              onChangeText={(value) => setStartTimeInput(formatTimeInput(value))}
              onBlur={() => {
                const parsed = parseTimeInput(startTimeInput);
                if (parsed) setStartTimeInput(parsed.normalized);
              }}
              autoCapitalize="none"
              keyboardType="number-pad"
              maxLength={5}
            />

            {/* Duração */}
            <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{t("booking.duration")}</Text>
            <View className="flex-row items-center gap-2 mb-3">
              <TextInput
                className={`h-12 w-24 rounded-xl border px-4 text-base ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
                placeholder={durationUnit === "hours" ? "1,5" : "1"}
                placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                value={durationValueInput}
                onChangeText={setDurationValueInput}
                keyboardType="numbers-and-punctuation"
              />
              <View className="flex-row flex-wrap gap-2 flex-1">
                {DURATION_UNITS.map((u) => {
                  const sel = durationUnit === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => setDurationUnit(u)}
                      className={`px-4 py-2.5 rounded-full border ${
                        sel
                          ? "bg-primary border-primary"
                          : isDark
                            ? "bg-card-dark border-border-dark"
                            : "bg-white border-gray-200"
                      }`}
                    >
                      <Text className={`text-sm font-medium ${sel ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                        {t(`duration.${u}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text className={`text-xs mb-6 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
              {t("booking.timeHelp")}
            </Text>

            {/* Lembrete por email */}
            <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
              {t("booking.reminder")}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {[
                { label: t("reminder.none"), value: null },
                { label: t("reminder.before", { h: 1 }), value: 1 },
                { label: t("reminder.before", { h: 2 }), value: 2 },
                { label: t("reminder.before", { h: 6 }), value: 6 },
                { label: t("reminder.before", { h: 24 }), value: 24 },
                { label: t("reminder.before", { h: 48 }), value: 48 },
              ].map((opt) => {
                const sel = reminderHours === opt.value;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => setReminderHours(opt.value)}
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
                        sel ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className={`text-xs mb-6 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
              {t("booking.reminderHelp")}
            </Text>

            <View className={`rounded-2xl p-4 mb-6 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-primary-light border-blue-100"}`}>
              <Text className="text-primary font-semibold mb-2">{t("booking.summary")}</Text>
              {bookingPreview ? (
                <>
                  <Text className={`text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    {t("booking.summaryStart")}: <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>{bookingPreview.startLabel}</Text>
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    {t("booking.summaryEnd")}: <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>{bookingPreview.endLabel}</Text>
                  </Text>
                </>
              ) : (
                <Text className={`text-sm ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                  {t("booking.summaryHint")}
                </Text>
              )}
            </View>

            <Button
              title={t("booking.modal.confirm")}
              onPress={handleSave}
              loading={create.isPending}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

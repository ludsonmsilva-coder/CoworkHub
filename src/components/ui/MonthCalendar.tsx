import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAppPreferences } from "@/hooks/useAppPreferences";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toLocalISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEKDAYS_BY_LANG: Record<string, string[]> = {
  "pt-BR": ["D", "S", "T", "Q", "Q", "S", "S"],
  "en-US": ["S", "M", "T", "W", "T", "F", "S"],
  "es": ["D", "L", "M", "X", "J", "V", "S"],
};

interface Props {
  selected: string; // "2026-07-02"
  onSelect: (iso: string) => void;
  /** dias com reserva: recebem um pontinho */
  markedDays?: Set<string>;
  /** avisa quando o usuário troca o mês visível ("2026-07") */
  onMonthChange?: (monthISO: string) => void;
}

export function MonthCalendar({ selected, onSelect, markedDays, onMonthChange }: Props) {
  const { language } = useAppPreferences();
  const WEEKDAYS = WEEKDAYS_BY_LANG[language] ?? WEEKDAYS_BY_LANG["pt-BR"];
  const selDate = new Date(`${selected}T12:00:00`);
  const [viewYear, setViewYear] = useState(selDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selDate.getMonth());

  const todayISO = toLocalISODate(new Date());

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
    onMonthChange?.(`${y}-${pad(m + 1)}`);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstDay.toLocaleDateString(language, {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-3">
      {/* Cabeçalho mês/ano */}
      <View className="flex-row items-center justify-between mb-2">
        <Pressable
          onPress={() => changeMonth(-1)}
          className="h-9 w-9 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
        >
          <ChevronLeft size={18} color="#3D4451" />
        </Pressable>
        <Text className="text-ink font-bold capitalize">{monthLabel}</Text>
        <Pressable
          onPress={() => changeMonth(1)}
          className="h-9 w-9 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
        >
          <ChevronRight size={18} color="#3D4451" />
        </Pressable>
      </View>

      {/* Dias da semana */}
      <View className="flex-row mb-1">
        {WEEKDAYS.map((w, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-[11px] font-semibold text-ink-low">{w}</Text>
          </View>
        ))}
      </View>

      {/* Grade de dias */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} className="flex-row">
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} className="flex-1 py-1" />;
            const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
            const isSel = iso === selected;
            const isToday = iso === todayISO;
            const hasBooking = markedDays?.has(iso) ?? false;
            return (
              <View key={col} className="flex-1 items-center py-0.5">
                <Pressable
                  onPress={() => onSelect(iso)}
                  className={`h-9 w-9 rounded-full items-center justify-center ${
                    isSel
                      ? "bg-primary"
                      : isToday && !hasBooking
                      ? "bg-primary-light"
                      : "active:bg-gray-100"
                  }`}
                  style={
                    !isSel && hasBooking
                      ? {
                          backgroundColor: "rgba(20,184,166,0.16)",
                          borderWidth: 1.5,
                          borderColor: "#14B8A6",
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSel ? "text-white" : isToday && !hasBooking ? "text-primary" : "text-ink"
                    }`}
                    style={!isSel && hasBooking ? { color: "#0D9488" } : undefined}
                  >
                    {day}
                  </Text>
                  <View
                    style={{
                      height: 5,
                      width: 5,
                      borderRadius: 3,
                      marginTop: 1,
                      backgroundColor: hasBooking
                        ? isSel
                          ? "#FFFFFF"
                          : "#14B8A6"
                        : "transparent",
                    }}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

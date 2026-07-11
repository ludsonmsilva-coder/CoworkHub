import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAppPreferences } from "@/hooks/useAppPreferences";

type Period = "today" | "week" | "month";

function money(value: number, currency: string, locale: string) {
  const allowed = ["USD", "EUR", "GBP", "BRL"];
  const safe = allowed.includes(currency) ? currency : "USD";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safe,
    minimumFractionDigits: 2,
  }).format(value);
}

function readAmount(row: Record<string, unknown>) {
  if (typeof row.amount === "number") return row.amount;
  if (typeof row.amount_cents === "number") return row.amount_cents / 100;
  return 0;
}

function paidDate(row: Record<string, unknown>) {
  const raw =
    (typeof row.paid_at === "string" && row.paid_at) ||
    (typeof row.due_date === "string" && row.due_date) ||
    null;
  return raw ? new Date(raw) : null;
}

export function RevenueSummary({ currency }: { currency: string }) {
  const { space } = useAuth();
  const { t, language, isDark } = useAppPreferences();
  const [period, setPeriod] = useState<Period>("month");
  const PERIODS: { key: Period; label: string }[] = [
    { key: "today", label: t("revenue.today") },
    { key: "week", label: t("revenue.week") },
    { key: "month", label: t("revenue.month") },
  ];

  const { data } = useQuery({
    queryKey: ["revenue-summary", space?.id],
    enabled: !!space?.id,
    queryFn: async () => {
      // Faturas pagas dos últimos 6 meses
      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const { data: rows, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("space_id", space!.id)
        .eq("status", "paid");

      if (error) throw error;
      return (rows ?? []).filter((r) => {
        const d = paidDate(r as Record<string, unknown>);
        return d && d >= since;
      }) as Record<string, unknown>[];
    },
  });

  const summary = useMemo(() => {
    const rows = data ?? [];
    const now = new Date();

    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    const startWeek = new Date(startToday);
    startWeek.setDate(startWeek.getDate() - 6);

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let today = 0;
    let week = 0;
    let month = 0;

    // Últimos 6 meses (do mais antigo pro atual)
    const buckets: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d
          .toLocaleDateString(language, { month: "short" })
          .replace(".", ""),
        total: 0,
      });
    }

    for (const row of rows) {
      const d = paidDate(row);
      if (!d) continue;
      if (d > now) continue; // datas futuras não contam como recebido
      const amount = readAmount(row);

      if (d >= startToday) today += amount;
      if (d >= startWeek) week += amount;
      if (d >= startMonth) month += amount;

      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.total += amount;
    }

    return { today, week, month, buckets };
  }, [data]);

  const selectedValue =
    period === "today"
      ? summary.today
      : period === "week"
      ? summary.week
      : summary.month;

  const maxBucket = Math.max(...summary.buckets.map((b) => b.total), 1);

  return (
    <View className={`mx-5 mb-3 rounded-2xl border p-4 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="h-8 w-8 rounded-xl bg-green-50 items-center justify-center mr-2">
            <TrendingUp size={16} color="#059669" />
          </View>
          <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>{t("revenue.title")}</Text>
        </View>
        <View className={`flex-row rounded-xl p-0.5 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg ${
                period === p.key ? (isDark ? "bg-card-dark" : "bg-white shadow-sm") : ""
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  period === p.key ? "text-primary" : isDark ? "text-slate-400" : "text-ink-low"
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>
        {money(selectedValue, currency, language)}
      </Text>
      <Text className={`text-xs mt-0.5 mb-4 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
        {period === "today"
          ? t("revenue.receivedToday")
          : period === "week"
          ? t("revenue.receivedWeek")
          : t("revenue.receivedMonth")}
      </Text>

      {/* Gráfico de barras — últimos 6 meses */}
      <View className="flex-row items-end justify-between" style={{ height: 96 }}>
        {summary.buckets.map((b, i) => {
          const h = Math.max((b.total / maxBucket) * 72, b.total > 0 ? 6 : 2);
          const isCurrent = i === summary.buckets.length - 1;
          return (
            <View key={b.key} className="flex-1 items-center justify-end">
              <Text className={`text-[10px] mb-1 ${isDark ? "text-slate-500" : "text-ink-low"}`}>
                {b.total > 0 ? money(b.total, currency, language).replace(/\u00a0/g, "") : ""}
              </Text>
              <View
                className={`w-7 rounded-t-md ${
                  isCurrent ? "bg-primary" : "bg-primary-light"
                }`}
                style={{ height: h }}
              />
              <Text
                className={`text-[10px] mt-1 capitalize ${
                  isCurrent ? "text-primary font-semibold" : isDark ? "text-slate-400" : "text-ink-low"
                }`}
              >
                {b.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

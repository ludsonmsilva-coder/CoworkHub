import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  DoorOpen,
  Plus,
  Users,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LokaroLogo } from "@/components/branding/LokaroLogo";
import { useAppPreferences } from "@/hooks/useAppPreferences";

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tint,
  bg,
  isDark,
  featured,
  onPress,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint: string;
  tint: string;
  bg: string;
  isDark: boolean;
  featured?: boolean;
  onPress?: () => void;
}) {
  const cardClass = `rounded-3xl p-4 border mb-3 ${
    featured
      ? isDark
        ? "bg-slate-900 border-cyan-400/30"
        : "bg-[#EAF6FF] border-[#BFE2F8]"
      : isDark
        ? "bg-card-dark border-border-dark"
        : "bg-white border-gray-100"
  }`;
  const width = featured ? "100%" : "48%";

  const inner = (
    <>
      <View className="flex-row items-start justify-between">
        <View
          className="h-10 w-10 rounded-2xl items-center justify-center mb-3"
          style={{ backgroundColor: bg }}
        >
          <Icon size={18} color={tint} />
        </View>
        {onPress ? (
          <ChevronRight size={18} color={isDark ? "#67E8F9" : "#0E7490"} />
        ) : null}
      </View>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-ink-low"}`}>
        {label}
      </Text>
      <Text className={`text-3xl font-bold mt-1 ${isDark ? "text-slate-100" : "text-ink"}`}>{value}</Text>
      <Text className={`text-sm mt-2 leading-5 ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{hint}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cardClass}
        style={({ pressed }) => ({
          width,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.95 : 1,
        })}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View className={cardClass} style={{ width }}>
      {inner}
    </View>
  );
}

function QuickAction({
  label,
  onPress,
  isDark,
}: {
  label: string;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-2xl px-4 py-3 border ${
        isDark ? "bg-slate-950/70 border-white/10" : "bg-white/80 border-white"
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
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 rounded-xl items-center justify-center bg-primary/10">
          <Plus size={18} color="#0E4A7A" />
        </View>
        <ChevronRight size={18} color={isDark ? "#CBD5E1" : "#334155"} />
      </View>
      <Text className={`text-sm font-semibold mt-3 ${isDark ? "text-slate-100" : "text-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Dashboard() {
  const { space } = useAuth();
  const { t, isDark } = useAppPreferences();

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-kpis", space?.id],
    enabled: !!space?.id,
    queryFn: async () => {
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const [members, rooms, bookingsToday, pendingInvoices] =
        await Promise.all([
          supabase
            .from("members")
            .select("*", { count: "exact", head: true })
            .eq("space_id", space!.id)
            .eq("status", "active"),
          supabase
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("space_id", space!.id)
            .eq("is_active", true),
          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("space_id", space!.id)
            .eq("status", "confirmed")
            .gte("starts_at", start)
            .lte("starts_at", end),
          supabase
            .from("invoices")
            .select("*", { count: "exact", head: true })
            .eq("space_id", space!.id)
            .eq("status", "pending"),
        ]);

      return {
        members: members.count ?? 0,
        rooms: rooms.count ?? 0,
        bookingsToday: bookingsToday.count ?? 0,
        pendingInvoices: pendingInvoices.count ?? 0,
      };
    },
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.greeting.morning")
      : hour < 18
        ? t("dashboard.greeting.afternoon")
        : t("dashboard.greeting.evening");

  const bookingsToday = data?.bookingsToday ?? 0;
  const pendingInvoices = data?.pendingInvoices ?? 0;
  const members = data?.members ?? 0;
  const rooms = data?.rooms ?? 0;

  const bookingsHint =
    bookingsToday === 0
      ? t("dashboard.bookingsEmpty")
      : bookingsToday === 1
        ? t("dashboard.bookingsSingle")
        : t("dashboard.bookingsMany", { count: bookingsToday });

  const invoiceHint =
    pendingInvoices === 0
      ? t("dashboard.invoicesEmpty")
      : pendingInvoices === 1
        ? t("dashboard.invoicesSingle")
        : t("dashboard.invoicesMany", { count: pendingInvoices });

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      <ScrollView
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View className="px-5 pt-2 pb-5">
          <View
            className={`rounded-[28px] overflow-hidden border px-4 pt-4 pb-4 ${
              isDark ? "bg-[#10233A] border-cyan-400/30" : "bg-[#DFF2FF] border-[#B7E3FB]"
            }`}
          >
            <View
              className="absolute -top-14 -right-10 h-36 w-36 rounded-full"
              style={{ backgroundColor: isDark ? "rgba(34,211,238,0.14)" : "rgba(14,74,122,0.10)" }}
            />
            <View
              className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full"
              style={{ backgroundColor: isDark ? "rgba(125,211,252,0.10)" : "rgba(255,255,255,0.45)" }}
            />

            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-cyan-100" : "text-primary"}`}>
                  {t("dashboard.heroKicker")}
                </Text>
                <Text className={`text-sm mt-2 ${isDark ? "text-slate-200" : "text-ink-mid"}`}>{greeting} 👋</Text>
                <Text className={`text-[28px] font-bold mt-1 ${isDark ? "text-white" : "text-ink"}`}>
                  {space?.name}
                </Text>
                <Text className={`text-sm leading-5 mt-2 ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                  {t("dashboard.heroDesc")}
                </Text>
              </View>

              <View className={`rounded-2xl p-2 ${isDark ? "bg-white/10" : "bg-white/70"}`}>
                <LokaroLogo
                  size={36}
                  subtitle={t("brand.name")}
                  showWordmark={false}
                  dark={isDark}
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-4">
              <QuickAction
                label={t("dashboard.ctaBookings")}
                onPress={() => router.push("/(operator)/bookings")}
                isDark={isDark}
              />
              <QuickAction
                label={t("dashboard.ctaMembers")}
                onPress={() => router.push("/(operator)/members")}
                isDark={isDark}
              />
            </View>
          </View>
        </View>

        <View className="px-5">
          <Text className={`text-sm font-semibold mb-3 ${isDark ? "text-slate-300" : "text-ink"}`}>
            {t("dashboard.focus")}
          </Text>
        </View>

        <View className="px-5 flex-row flex-wrap justify-between">
          <KpiCard
            icon={Users}
            label={t("dashboard.activeMembers")}
            value={members}
            hint={t("dashboard.membersHint")}
            tint="#0E4A7A"
            bg="#E8F0F7"
            isDark={isDark}
            onPress={() => router.push("/(operator)/members")}
          />
          <KpiCard
            icon={CalendarCheck}
            label={t("dashboard.todayBookings")}
            value={bookingsToday}
            hint={bookingsHint}
            tint="#059669"
            bg="#ECFDF5"
            isDark={isDark}
            featured
            onPress={() => router.push("/(operator)/today-bookings")}
          />
          <KpiCard
            icon={DoorOpen}
            label={t("dashboard.activeRooms")}
            value={rooms}
            hint={t("dashboard.roomsHint")}
            tint="#155E75"
            bg="#ECFEFF"
            isDark={isDark}
            onPress={() =>
              router.push({
                pathname: "/(operator)/bookings",
                params: { tab: "rooms" },
              })
            }
          />
          <KpiCard
            icon={AlertCircle}
            label={t("dashboard.pendingInvoices")}
            value={pendingInvoices}
            hint={invoiceHint}
            tint="#DC2626"
            bg="#FEF2F2"
            isDark={isDark}
            onPress={() => router.push("/(operator)/finance")}
          />
        </View>

        <View className={`mx-5 mt-2 rounded-3xl p-4 ${isDark ? "bg-card-dark border border-border-dark" : "bg-white border border-gray-100"}`}>
          <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>{t("dashboard.nextSteps")}</Text>
          <Text className={`text-sm mt-2 leading-6 ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
            {t("dashboard.nextStepsDesc")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

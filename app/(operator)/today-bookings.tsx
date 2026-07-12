import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CalendarCheck, ChevronLeft, Users } from "lucide-react-native";
import { EmptyState } from "@/components/ui/EmptyState";
import { toLocalISODate } from "@/components/ui/MonthCalendar";
import { useBookingsByDay, useCancelBooking } from "@/hooks/useBookings";
import { showConfirm } from "@/utils/alert";
import { useAppPreferences } from "@/hooks/useAppPreferences";

export default function TodayBookings() {
  const { t, isDark, language } = useAppPreferences();
  const today = toLocalISODate(new Date());
  const { data: bookings, refetch, isRefetching, isLoading } =
    useBookingsByDay(today);
  const cancel = useCancelBooking();

  const dateLabel = new Date().toLocaleDateString(language, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const count = bookings?.length ?? 0;

  function confirmCancel(id: string) {
    showConfirm(
      t("bookings.cancelTitle"),
      t("bookings.cancelMsg"),
      () => cancel.mutate(id),
      t("bookings.cancelTitle")
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      {/* Cabeçalho com botão voltar */}
      <View className="px-5 pt-2 pb-4 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className={`h-9 w-9 rounded-full items-center justify-center mr-2 ${
            isDark ? "bg-slate-800" : "bg-gray-100"
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <ChevronLeft size={20} color={isDark ? "#CBD5E1" : "#334155"} />
        </Pressable>
        <View className="flex-1">
          <Text className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>
            Reservas de hoje
          </Text>
          <Text className={`mt-0.5 capitalize ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {dateLabel}
            {count > 0 ? ` · ${count} ${count === 1 ? "reserva" : "reservas"}` : ""}
          </Text>
        </View>
      </View>

      <FlatList
        data={bookings ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-10 flex-grow"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => {
          const start = new Date(item.starts_at);
          const end = new Date(item.ends_at);
          const fmt = (d: Date) =>
            d.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
          return (
            <Pressable
              onLongPress={() => confirmCancel(item.id)}
              className={`rounded-2xl p-4 mb-3 border flex-row items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}
              style={({ pressed }) =>
                pressed
                  ? { transform: [{ scale: 0.995 }], opacity: 0.95 }
                  : undefined
              }
            >
              <View
                className="w-1.5 self-stretch rounded-full mr-3"
                style={{ backgroundColor: item.rooms?.color ?? "#2563EB" }}
              />
              <View className="flex-1">
                <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>
                  {fmt(start)} – {fmt(end)}
                </Text>
                <Text className={`text-sm mt-0.5 ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                  {item.rooms?.name ?? "Sala"}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Users size={12} color="#6B7280" />
                  <Text className={`text-xs ml-1 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                    {item.members?.name ?? "Membro"}
                  </Text>
                </View>
              </View>
              <Text className={`text-[10px] ${isDark ? "text-slate-500" : "text-ink-low"}`}>
                {t("common.holdToCancel")}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="small" color="#0E4A7A" />
              <Text className={`text-xs mt-3 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                Carregando reservas...
              </Text>
            </View>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="Nenhuma reserva para hoje"
              subtitle="Quando houver reservas confirmadas para hoje, elas aparecem aqui."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

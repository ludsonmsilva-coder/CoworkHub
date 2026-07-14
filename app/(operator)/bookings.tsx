import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { CalendarDays, DoorOpen, Plus, Users } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthCalendar, toLocalISODate } from "@/components/ui/MonthCalendar";
import { BookingFormModal } from "@/components/bookings/BookingFormModal";
import { RoomFormModal } from "@/components/rooms/RoomFormModal";
import { LeaseFormModal } from "@/components/leases/LeaseFormModal";
import { useDeleteLease, useEndLease, useLeases, type LeaseWithRefs } from "@/hooks/useLeases";
import { useDeleteRoom } from "@/hooks/useRooms";
import { FileText, StopCircle, Trash2 } from "lucide-react-native";
import { useBookedDaysOfMonth, useBookingsByDay, useCancelBooking } from "@/hooks/useBookings";
import { useSyncFinishedBookingsToInvoices } from "@/hooks/useInvoices";
import { useMembers } from "@/hooks/useMembers";
import { useRooms } from "@/hooks/useRooms";
import { showAlert, showConfirm } from "@/utils/alert";
import type { Room } from "@/types";
import { useAppPreferences } from "@/hooks/useAppPreferences";

function toISODate(d: Date) {
  return toLocalISODate(d);
}



export default function Bookings() {
  const { t, isDark, language } = useAppPreferences();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: "agenda" | "rooms" | "leases" =
    params.tab === "rooms" ? "rooms" : params.tab === "leases" ? "leases" : "agenda";
  const [tab, setTab] = useState<"agenda" | "rooms" | "leases">(initialTab);
  const [leaseModal, setLeaseModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(toISODate(new Date()));
  const [bookingModal, setBookingModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const { data: bookings, refetch, isRefetching, isLoading } = useBookingsByDay(selectedDay);
  const [visibleMonth, setVisibleMonth] = useState(selectedDay.slice(0, 7));
  const { data: bookedDays } = useBookedDaysOfMonth(
    visibleMonth,
    roomFilter !== "all" ? roomFilter : undefined,
    memberFilter !== "all" ? memberFilter : undefined
  );
  const { data: rooms } = useRooms();
  const { data: members } = useMembers("", null);
  const cancel = useCancelBooking();
  const deleteRoom = useDeleteRoom();

  function confirmDeleteRoom(room: Room) {
    showConfirm(
      t("room.deleteTitle"),
      t("room.deleteMsg", { name: room.name }),
      async () => {
        try {
          await deleteRoom.mutateAsync({ id: room.id });
        } catch (err: any) {
          const msg = typeof err?.message === "string" ? err.message : "";
          if (msg === "ROOM_HAS_LEASE") {
            showAlert(t("room.hasLeaseTitle"), t("room.hasLeaseMsg"));
          } else if (msg.startsWith("ROOM_HAS_BOOKINGS")) {
            const parts = msg.split(":");
            const countStr = parts[1] ?? "?";
            const nextISO = parts.slice(2).join(":");
            const nextLabel = nextISO
              ? new Date(nextISO).toLocaleString(language, {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            showConfirm(
              t("room.hasBookingsTitle"),
              t("room.cancelAndDeleteMsg", { count: countStr, date: nextLabel }),
              async () => {
                try {
                  await deleteRoom.mutateAsync({
                    id: room.id,
                    cancelFutureBookings: true,
                  });
                } catch {
                  showAlert(t("common.error"), t("room.deleteError"));
                }
              },
              t("room.cancelAndDeleteConfirm")
            );
          } else {
            showAlert(t("common.error"), t("room.deleteError"));
          }
        }
      },
      t("lease.deleteConfirm")
    );
  }
  const syncFinished = useSyncFinishedBookingsToInvoices();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    void syncFinished.mutateAsync();
  }, [syncFinished]);

  const filteredBookings = useMemo(() => {
    return (bookings ?? []).filter((booking) => {
      const roomOk = roomFilter === "all" || booking.room_id === roomFilter;
      const memberOk = memberFilter === "all" || booking.member_id === memberFilter;
      return roomOk && memberOk;
    });
  }, [bookings, roomFilter, memberFilter]);

  const roomUtilization = useMemo(() => {
    const dayMinutes = (21 - 7) * 60;

    return (rooms ?? []).map((room) => {
      const roomBookings = (bookings ?? []).filter((b) => b.room_id === room.id);
      const usedMinutes = roomBookings.reduce((total, b) => {
        const start = new Date(b.starts_at).getTime();
        const end = new Date(b.ends_at).getTime();
        return total + Math.max(0, Math.round((end - start) / 60000));
      }, 0);

      const percent = Math.min(100, Math.round((usedMinutes / dayMinutes) * 100));

      return {
        room,
        usedMinutes,
        percent,
      };
    });
  }, [rooms, bookings]);

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
      <ScreenHeader title={t("bookings.title")} subtitle={t("bookings.subtitle")} />

      {/* Alternador Agenda / Salas */}
      <View className={`mx-4 md:mx-6 mb-3 flex-row rounded-2xl p-1 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
        {(
          [
            { key: "agenda", label: t("bookings.tab.agenda") },
            { key: "rooms", label: t("bookings.tab.rooms") },
            { key: "leases", label: t("bookings.tab.leases") },
          ] as const
        ).map((tab_) => (
          <Pressable
            key={tab_.key}
            onPress={() => setTab(tab_.key)}
            className={`flex-1 h-10 rounded-xl items-center justify-center ${
              tab === tab_.key ? (isDark ? "bg-card-dark" : "bg-white shadow-sm") : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                tab === tab_.key ? "text-primary" : isDark ? "text-slate-400" : "text-ink-low"
              }`}
            >
              {tab_.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "agenda" ? (
        <>
          {/* Lista de reservas do dia (calendário + filtros rolam junto no cabeçalho) */}
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-32 flex-grow"
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            ListHeaderComponent={
              <View className="pt-1">
          {/* Calendário com mês e ano */}
          <View className="px-4 md:px-6 mb-3">
            <MonthCalendar
              selected={selectedDay}
              onSelect={(iso) => {
                setSelectedDay(iso);
                setVisibleMonth(iso.slice(0, 7));
              }}
              markedDays={bookedDays}
              onMonthChange={setVisibleMonth}
            />
          </View>

          {/* Filtros rápidos da agenda */}
          <View className="px-4 md:px-6 mb-2">
            <Text className={`text-xs tracking-wide uppercase font-semibold ${isDark ? "text-slate-500" : "text-ink-low"}`}>
              {t("bookings.filters")}
            </Text>
          </View>
          <View className="mb-3 px-4 md:px-6 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setRoomFilter("all")}
              className={`px-3 py-2 rounded-full border ${
                roomFilter === "all"
                  ? "bg-primary border-primary"
                  : isDark
                    ? "bg-card-dark border-border-dark"
                    : "bg-white border-gray-200"
              }`}
            >
              <Text className={`text-xs font-semibold ${roomFilter === "all" ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`} numberOfLines={1}>
                {t("bookings.allRooms")}
              </Text>
            </Pressable>

            {(rooms ?? []).map((room) => {
              const selected = roomFilter === room.id;
              return (
                <Pressable
                  key={room.id}
                  onPress={() => setRoomFilter(room.id)}
                  className={`px-3 py-2 rounded-full border flex-row items-center ${
                    selected
                      ? "bg-primary border-primary"
                      : isDark
                        ? "bg-card-dark border-border-dark"
                        : "bg-white border-gray-200"
                  }`}
                >
                  <View
                    className="h-2 w-2 rounded-full mr-1.5"
                    style={{ backgroundColor: selected ? "#fff" : room.color }}
                  />
                  <Text className={`text-xs font-semibold ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`} numberOfLines={1}>
                    {room.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mb-3 px-4 md:px-6 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setMemberFilter("all")}
              className={`px-3 py-2 rounded-full border ${
                memberFilter === "all"
                  ? "bg-primary border-primary"
                  : isDark
                    ? "bg-card-dark border-border-dark"
                    : "bg-white border-gray-200"
              }`}
            >
              <Text className={`text-xs font-semibold ${memberFilter === "all" ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                {t("bookings.allMembers")}
              </Text>
            </Pressable>

            {(members ?? []).map((member) => {
              const selected = memberFilter === member.id;
              return (
                <Pressable
                  key={member.id}
                  onPress={() => setMemberFilter(member.id)}
                  className={`px-3 py-2 rounded-full border ${
                    selected
                      ? "bg-primary border-primary"
                      : isDark
                        ? "bg-card-dark border-border-dark"
                        : "bg-white border-gray-200"
                  }`}
                >
                  <Text className={`text-xs font-semibold ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`} numberOfLines={1}>
                    {member.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Ocupação das salas no dia */}
          <View className="px-4 md:px-6 mb-2">
            <Text className={`text-xs tracking-wide uppercase font-semibold ${isDark ? "text-slate-500" : "text-ink-low"}`}>
              {t("bookings.dayOccupancy")}
            </Text>
          </View>
          <View className="mb-3 px-4 md:px-6">
            {Platform.OS === "web" ? (
              <View className="flex-row flex-wrap gap-2">
                {roomUtilization.map(({ room, usedMinutes, percent }) => (
                  <View
                    key={room.id}
                    className={`rounded-2xl border p-3 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}
                    style={{ width: "48%", minWidth: 220 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-ink"}`} numberOfLines={1}>
                        {room.name}
                      </Text>
                      <Text className="text-xs font-semibold" style={{ color: room.color }}>
                        {percent}%
                      </Text>
                    </View>
                    <Text className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                      {Math.floor(usedMinutes / 60)}h {usedMinutes % 60}m {t("bookings.reserved")}
                    </Text>
                    <View className={`h-2 rounded-full mt-2 overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
                      <View
                        className="h-2 rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: room.color }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4 md:px-6 gap-2"
              >
                {roomUtilization.map(({ room, usedMinutes, percent }) => (
                  <View
                    key={room.id}
                    className={`w-44 rounded-2xl border p-3 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-ink"}`} numberOfLines={1}>
                        {room.name}
                      </Text>
                      <Text className="text-xs font-semibold" style={{ color: room.color }}>
                        {percent}%
                      </Text>
                    </View>
                    <Text className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                      {Math.floor(usedMinutes / 60)}h {usedMinutes % 60}m {t("bookings.reserved")}
                    </Text>
                    <View className={`h-2 rounded-full mt-2 overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
                      <View
                        className="h-2 rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: room.color }}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

              </View>
            }
            renderItem={({ item }) => {
              const start = new Date(item.starts_at);
              const end = new Date(item.ends_at);
              const fmt = (d: Date) =>
                d.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
              return (
                <Pressable
                  onLongPress={() => confirmCancel(item.id)}
                  className={`mx-4 md:mx-6 rounded-2xl p-4 mb-3 border flex-row items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}
                  style={({ pressed }) =>
                    pressed
                      ? {
                          transform: [{ scale: 0.995 }],
                          opacity: 0.95,
                        }
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
                <View className="flex-1 items-center justify-center py-12">
                  <ActivityIndicator size="small" color="#0E4A7A" />
                  <Text className={`text-xs mt-3 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                    Carregando agenda...
                  </Text>
                </View>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title={t("bookings.empty.filtered")}
                  subtitle={
                    roomFilter !== "all" || memberFilter !== "all"
                      ? "Não há reservas com os filtros atuais. Tente ampliar os filtros para visualizar mais resultados."
                      : t("bookings.empty.filteredDesc")
                  }
                />
              )
            }
          />

          <Pressable
            onPress={() => setBookingModal(true)}
            className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg active:bg-primary-dark"
            style={({ pressed }) => ({
              elevation: 8,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Plus size={26} color="#fff" />
          </Pressable>

          <BookingFormModal
            visible={bookingModal}
            onClose={() => setBookingModal(false)}
            dayISO={selectedDay}
          />
        </>
      ) : tab === "rooms" ? (
        <>
          {/* Salas */}
          <FlatList
            data={rooms ?? []}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 md:px-6 pb-32 flex-grow"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setEditingRoom(item);
                  setRoomModal(true);
                }}
                className={`rounded-2xl p-4 mb-3 border flex-row items-center ${isDark ? "bg-card-dark border-border-dark active:bg-slate-800" : "bg-white border-gray-100 active:bg-gray-50"}`}
              >
                <View
                  className="h-11 w-11 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <DoorOpen size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>{item.name}</Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                    {t(`roomType.${item.type}`)} · {item.capacity}{" "}
                    {item.capacity === 1 ? t("room.person") : t("room.people")}
                    {item.price_per_hour ? ` · ${item.price_per_hour}/h` : ""}
                    {item.is_24h
                      ? " · 24h"
                      : ` · ${(item.open_time ?? "07:00").slice(0, 5)}–${(item.close_time ?? "21:00").slice(0, 5)}`}
                  </Text>
                </View>
                <View
                  className={`px-2.5 py-1 rounded-full ${
                    item.is_active
                      ? isDark
                        ? "bg-green-950"
                        : "bg-green-50"
                      : isDark
                        ? "bg-slate-800"
                        : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      item.is_active ? "text-success" : isDark ? "text-slate-400" : "text-ink-low"
                    }`}
                  >
                    {item.is_active ? t("room.active") : t("room.inactive")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmDeleteRoom(item)}
                  className={`h-9 w-9 rounded-full items-center justify-center ml-2 ${
                    isDark ? "bg-red-950" : "bg-red-50"
                  }`}
                >
                  <Trash2 size={17} color="#DC2626" />
                </Pressable>
              </Pressable>
            )}
            ListEmptyComponent={
              <EmptyState
                icon={DoorOpen}
                title={t("bookings.empty.rooms")}
                subtitle={t("bookings.empty.roomsDesc")}
              />
            }
          />

          <Pressable
            onPress={() => {
              setEditingRoom(null);
              setRoomModal(true);
            }}
            className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg active:bg-primary-dark"
            style={({ pressed }) => ({
              elevation: 8,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Plus size={26} color="#fff" />
          </Pressable>

          <RoomFormModal
            visible={roomModal}
            onClose={() => setRoomModal(false)}
            room={editingRoom}
          />
        </>
      ) : (
        <LeasesSection
          isDark={isDark}
          onOpenNew={() => setLeaseModal(true)}
          leaseModal={leaseModal}
          onCloseModal={() => setLeaseModal(false)}
        />
      )}
    </SafeAreaView>
  );
}


function LeasesSection({
  isDark,
  onOpenNew,
  leaseModal,
  onCloseModal,
}: {
  isDark: boolean;
  onOpenNew: () => void;
  leaseModal: boolean;
  onCloseModal: () => void;
}) {
  const { t, language } = useAppPreferences();
  const { data: leases, refetch, isRefetching } = useLeases();
  const endLease = useEndLease();
  const deleteLease = useDeleteLease();

  function confirmDelete(lease: LeaseWithRefs) {
    showConfirm(
      t("lease.deleteTitle"),
      t("lease.deleteMsg", { unit: lease.rooms?.name ?? "" }),
      () => deleteLease.mutate(lease.id),
      t("lease.deleteConfirm")
    );
  }

  function money(v: number) {
    return new Intl.NumberFormat(language, {
      minimumFractionDigits: 2,
    }).format(v);
  }

  function confirmEnd(lease: LeaseWithRefs) {
    showConfirm(
      t("lease.endTitle"),
      t("lease.endMsg", { unit: lease.rooms?.name ?? "" }),
      () => endLease.mutate(lease.id),
      t("lease.endConfirm")
    );
  }

  return (
    <>
      <FlatList
        data={leases ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-32 flex-grow"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => {
          const ended = item.status === "ended";
          return (
            <View
              className={`rounded-2xl p-4 mb-3 border flex-row items-center ${
                isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"
              } ${ended ? "opacity-50" : ""}`}
            >
              <View
                className="h-11 w-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${item.rooms?.color ?? "#2563EB"}20` }}
              >
                <FileText size={20} color={item.rooms?.color ?? "#2563EB"} />
              </View>
              <View className="flex-1 min-w-0 mr-3">
                <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`} numberOfLines={1}>
                  {item.rooms?.name ?? "—"}
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`} numberOfLines={2}>
                  {item.members?.name ?? "—"}
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                  {money(Number(item.monthly_rent))} · {t("lease.dueEvery", { d: item.due_day })}
                </Text>
              </View>
              <View className="items-end shrink-0">
                <View
                  className={`px-2.5 py-1 rounded-full mb-2 ${
                    ended
                      ? isDark ? "bg-slate-800" : "bg-gray-100"
                      : "bg-green-50"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      ended ? (isDark ? "text-slate-400" : "text-ink-low") : "text-success"
                    }`}
                  >
                    {ended ? t("lease.ended") : t("lease.active")}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  {!ended ? (
                    <Pressable
                      onPress={() => confirmEnd(item)}
                      className={`h-9 w-9 rounded-full items-center justify-center ${
                        isDark ? "bg-slate-800" : "bg-gray-100"
                      }`}
                    >
                      <StopCircle size={17} color={isDark ? "#cbd5e1" : "#3D4451"} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => confirmDelete(item)}
                    className={`h-9 w-9 rounded-full items-center justify-center ${
                      isDark ? "bg-red-950" : "bg-red-50"
                    }`}
                  >
                    <Trash2 size={17} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={FileText}
            title={t("lease.empty")}
            subtitle={t("lease.emptyDesc")}
          />
        }
      />

      <Pressable
        onPress={onOpenNew}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg active:bg-primary-dark"
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <LeaseFormModal visible={leaseModal} onClose={onCloseModal} />
    </>
  );
}

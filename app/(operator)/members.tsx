import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, Trash2, Users } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/members/StatusBadge";
import { MemberFormModal } from "@/components/members/MemberFormModal";
import { useDeleteMember, useMembers } from "@/hooks/useMembers";
import { showAlert, showConfirm } from "@/utils/alert";
import type { Member, MemberStatus } from "@/types";
import { useAppPreferences } from "@/hooks/useAppPreferences";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function MemberCard({
  member,
  onPress,
  onDelete,
  isDark,
}: {
  member: Member;
  onPress: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl p-4 mb-3 border flex-row items-center ${
        isDark ? "bg-card-dark border-border-dark active:bg-slate-800" : "bg-white border-gray-100 active:bg-gray-50"
      }`}
      style={({ pressed }) =>
        pressed
          ? {
              transform: [{ scale: 0.995 }],
              opacity: 0.95,
            }
          : undefined
      }
    >
      <View className="h-11 w-11 rounded-full bg-primary-light items-center justify-center mr-3">
        <Text className="text-primary font-bold">{initials(member.name)}</Text>
      </View>
      <View className="flex-1 mr-2">
        <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`} numberOfLines={1}>
          {member.name}
        </Text>
        <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      <StatusBadge status={member.status} />
      <Pressable
        onPress={onDelete}
        className={`h-9 w-9 rounded-full items-center justify-center ml-2 ${
          isDark ? "bg-red-950" : "bg-red-50"
        }`}
      >
        <Trash2 size={17} color="#DC2626" />
      </Pressable>
    </Pressable>
  );
}

export default function Members() {
  const { t, isDark } = useAppPreferences();
  const FILTERS: { value: MemberStatus | null; label: string }[] = [
    { value: null, label: t("members.filter.all") },
    { value: "active", label: t("members.filter.active") },
    { value: "trial", label: t("members.filter.trial") },
    { value: "overdue", label: t("members.filter.overdue") },
    { value: "inactive", label: t("members.filter.inactive") },
  ];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MemberStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const deleteMember = useDeleteMember();

  function confirmDeleteMember(member: Member) {
    showConfirm(
      t("member.deleteTitle"),
      t("member.deleteMsg", { name: member.name }),
      async () => {
        try {
          await deleteMember.mutateAsync(member.id);
        } catch (err: any) {
          if (err?.message === "MEMBER_HAS_LEASE") {
            showAlert(t("member.hasLeaseTitle"), t("member.hasLeaseMsg"));
          } else if (err?.message === "MEMBER_HAS_BOOKINGS") {
            showAlert(t("member.hasBookingsTitle"), t("member.hasBookingsMsg"));
          } else if (err?.message === "MEMBER_HAS_INVOICES") {
            showAlert(t("member.hasInvoicesTitle"), t("member.hasInvoicesMsg"));
          } else {
            showAlert(t("common.error"), t("member.deleteError"));
          }
        }
      },
      t("lease.deleteConfirm")
    );
  }

  const { data: members, isLoading, refetch, isRefetching } = useMembers(
    search,
    filter
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setModalOpen(true);
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      <ScreenHeader title={t("members.title")} subtitle={t("members.subtitle")} />

      {/* Busca */}
      <View className="px-5 mb-3">
        <View className={`flex-row items-center rounded-2xl border px-4 h-12 ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-200"}`}>
          <Search size={18} color={isDark ? "#64748B" : "#9CA3AF"} />
          <TextInput
            className={`flex-1 ml-2 ${isDark ? "text-slate-100" : "text-ink"}`}
            placeholder={t("members.search")}
            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filtros */}
      <View className="px-5 mb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const selected = filter === item.value;
            return (
              <Pressable
                onPress={() => setFilter(item.value)}
                className={`px-4 py-2 rounded-full mr-2 border ${
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
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={members ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-28 flex-grow"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <MemberCard member={item} onPress={() => openEdit(item)} onDelete={() => confirmDeleteMember(item)} isDark={isDark} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="small" color="#0E4A7A" />
              <Text className={`text-xs mt-3 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                Carregando membros...
              </Text>
            </View>
          ) : (
            <EmptyState
              icon={Users}
              title={
                search || filter
                  ? t("members.empty.filtered")
                  : t("members.empty.none")
              }
              subtitle={
                search || filter
                  ? "Nenhum membro corresponde aos filtros atuais. Ajuste busca e status para ampliar os resultados."
                  : t("members.empty.noneDesc")
              }
            />
          )
        }
      />

      {/* Botão flutuante + */}
      <Pressable
        onPress={openCreate}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg active:bg-primary-dark"
        style={({ pressed }) => ({
          elevation: 8,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <MemberFormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        member={editing}
      />
    </SafeAreaView>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Plus,
  RotateCw,
  Trash2,
  Wallet,
  X,
} from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useCleanupDuplicateInvoices,
  useCreateInvoiceManual,
  useGenerateInvoicesAutomatically,
  useSyncFinishedBookingsToInvoices,
  type AutoInvoicePeriodType,
  useInvoiceKpis,
  useInvoices,
  useMarkInvoicePaid,
} from "@/hooks/useInvoices";
import { useRooms } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import type { Invoice, InvoiceStatus } from "@/types";
import { showAlert, showConfirm } from "@/utils/alert";
import { RevenueSummary } from "@/components/finance/RevenueSummary";
import { useAppPreferences } from "@/hooks/useAppPreferences";

const FILTERS: { labelKey: string; value: InvoiceStatus | "all" }[] = [
  { labelKey: "finance.filter.all", value: "all" },
  { labelKey: "finance.pending", value: "pending" },
  { labelKey: "finance.overdue", value: "overdue" },
  { labelKey: "finance.paid", value: "paid" },
];

const AUTO_PERIODS: { labelKey: string; value: AutoInvoicePeriodType }[] = [
  { labelKey: "finance.period.today", value: "today" },
  { labelKey: "finance.period.week", value: "week" },
  { labelKey: "finance.period.month", value: "month" },
  { labelKey: "finance.period.custom", value: "custom" },
];

function statusUi(status: InvoiceStatus) {
  if (status === "paid") {
    return { labelKey: "invoiceStatus.paid", bg: "#ECFDF5", fg: "#059669" };
  }
  if (status === "overdue") {
    return { labelKey: "invoiceStatus.overdue", bg: "#FEF2F2", fg: "#DC2626" };
  }
  if (status === "cancelled") {
    return { labelKey: "invoiceStatus.cancelled", bg: "#F3F4F6", fg: "#6B7280" };
  }
  return { labelKey: "invoiceStatus.pending", bg: "#EFF6FF", fg: "#2563EB" };
}

function readAmount(invoice: Invoice) {
  if (typeof invoice.amount === "number") return invoice.amount;
  if (typeof invoice.amount_cents === "number") return invoice.amount_cents / 100;
  return 0;
}

function formatMoney(value: number, currency: string, locale: string) {
  const allowed = ["USD", "EUR", "GBP", "BRL"];
  const safeCurrency = allowed.includes(currency) ? currency : "USD";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateValue: string | null, locale: string, fallback: string) {
  if (!dateValue) return fallback;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(locale);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatIsoDateTyping(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function normalizeIsoDateOnBlur(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);

  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() + 1 !== month ||
    d.getDate() !== day
  ) {
    return value;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type ExpenseItem = {
  id: string;
  room: string;
  description: string;
  amount: number;
  created_at: string;
};

function KpiCard({
  icon: Icon,
  label,
  value,
  tint,
  bg,
  isDark,
}: {
  icon: any;
  label: string;
  value: number;
  tint: string;
  bg: string;
  isDark: boolean;
}) {
  return (
    <View className={`w-[31%] rounded-2xl p-3 border ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
      <View
        className="h-8 w-8 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: bg }}
      >
        <Icon size={16} color={tint} />
      </View>
      <Text className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>{value}</Text>
      <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>{label}</Text>
    </View>
  );
}

function InvoiceRow({
  invoice,
  currency,
  onPressPay,
  isDark,
}: {
  invoice: Invoice;
  currency: string;
  onPressPay: () => void;
  isDark: boolean;
}) {
  const { t, language } = useAppPreferences();
  const st = statusUi(invoice.status);
  const amount = formatMoney(readAmount(invoice), currency, language);
  const sourceLabel =
    typeof invoice.description === "string" && invoice.description.trim()
      ? invoice.description
      : t("finance.invoiceRef", { id: invoice.id.slice(0, 8) });
  const ownerLabel =
    typeof invoice.member_name === "string" && invoice.member_name.trim()
      ? invoice.member_name
      : typeof invoice.member_email === "string" && invoice.member_email.trim()
        ? invoice.member_email
        : "Sem membro";

  return (
    <View className={`mx-5 rounded-2xl p-4 mb-3 border ${isDark ? "bg-card-dark border-border-dark" : "bg-white border-gray-100"}`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className={`font-semibold ${isDark ? "text-slate-100" : "text-ink"}`} numberOfLines={1}>
            {invoice.description || t("finance.invoiceNoDesc")}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
            {t("finance.dueDate")}: {formatDate(invoice.due_date, language, t("finance.noDueDate"))}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>{t("finance.origin")}: {sourceLabel}</Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-ink-low"}`}>{t("finance.client")}: {ownerLabel}</Text>
        </View>
        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg }}>
          <Text className="text-xs font-semibold" style={{ color: st.fg }}>
            {t(st.labelKey)}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>{amount}</Text>
        {invoice.status !== "paid" && invoice.status !== "cancelled" ? (
          <Pressable
            onPress={onPressPay}
            className="h-9 px-3 rounded-xl bg-primary items-center justify-center active:bg-primary-dark"
            style={({ pressed }) =>
              pressed
                ? {
                    transform: [{ scale: 0.98 }],
                    opacity: 0.92,
                  }
                : undefined
            }
          >
            <Text className="text-white text-sm font-semibold">{t("finance.markPaid")}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function Finance() {
  const { language, t, isDark } = useAppPreferences();
  const { space } = useAuth();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState(todayISO());
  const [memberId, setMemberId] = useState<string | null>(null);
  const [autoPeriod, setAutoPeriod] = useState<AutoInvoicePeriodType>("month");
  const [autoStartDate, setAutoStartDate] = useState(todayISO());
  const [autoEndDate, setAutoEndDate] = useState(todayISO());
  const [autoFeedback, setAutoFeedback] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseRoomId, setExpenseRoomId] = useState<string | null>(null);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmountInput, setExpenseAmountInput] = useState("");
  const [expenseFeedback, setExpenseFeedback] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  const { data: invoices, refetch, isRefetching, isLoading } = useInvoices(statusFilter);
  const { data: kpis } = useInvoiceKpis();
  const markPaid = useMarkInvoicePaid();
  const cleanupDuplicates = useCleanupDuplicateInvoices();
  const createManual = useCreateInvoiceManual();
  const autoGenerate = useGenerateInvoicesAutomatically();
  const syncFinished = useSyncFinishedBookingsToInvoices();
  const { data: members } = useMembers("", null);
  const { data: activeRooms } = useRooms(true);
  const hasAutoSyncedRef = useRef(false);

  const hasFilters = statusFilter !== "all";

  useEffect(() => {
    if (!space?.id || hasAutoSyncedRef.current) return;
    hasAutoSyncedRef.current = true;

    void syncFinished
      .mutateAsync()
      .then((res) => {
        if (res.created > 0) {
          setAutoFeedback(
            `Sincronização automática: ${res.created} fatura(s) criada(s) de reservas já finalizadas.`
          );
        }
      })
      .catch(() => {
        setAutoFeedback("Não foi possível sincronizar automaticamente as reservas finalizadas.");
      });
  }, [space?.id, syncFinished]);

  function resetManualForm() {
    setDescription("");
    setAmountInput("");
    setDueDateInput(todayISO());
    setMemberId(null);
  }

  function confirmMarkPaid(invoiceId: string) {
    showConfirm(t("finance.markPaidTitle"), t("finance.markPaidMsg"), () => markPaid.mutate(invoiceId), t("finance.markPaidConfirm"));
  }

  async function handleCreateManual() {
    const desc = description.trim();
    const amount = Number(amountInput.replace(",", "."));

    if (!desc) {
      showAlert("Atenção", "Informe a descrição da fatura.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("Atenção", "Informe um valor válido maior que zero.");
      return;
    }

    try {
      await createManual.mutateAsync({
        member_id: memberId,
        description: desc,
        amount,
        due_date: dueDateInput || null,
        status: "pending",
      });
      setManualOpen(false);
      resetManualForm();
      showAlert("Sucesso", "Fatura criada com sucesso.");
    } catch {
      showAlert("Erro", "Não foi possível criar a fatura.");
    }
  }

  async function handleAutoGenerate() {
    if (autoGenerate.isPending) return;

    try {
      setAutoFeedback(null);
      const result = await autoGenerate.mutateAsync({
        periodType: autoPeriod,
        startDate: autoPeriod === "custom" ? autoStartDate : undefined,
        endDate: autoPeriod === "custom" ? autoEndDate : undefined,
      });

      const periodLabel = `${new Date(result.periodStart).toLocaleDateString(language)} — ${new Date(result.periodEnd).toLocaleDateString(language)}`;

      if (result.created === 0) {
        const diagnostics: string[] = [];
        if (result.totalBookings === 0) {
          diagnostics.push("- Nenhuma reserva confirmada no período selecionado.");
        }
        if (result.skippedNoPrice > 0) {
          diagnostics.push(
            `- ${result.skippedNoPrice} reserva(s) sem preço/hora válido na sala.`
          );
        }
        if (result.skippedNotFinished > 0) {
          diagnostics.push(
            `- ${result.skippedNotFinished} reserva(s) ainda não finalizadas.`
          );
        }
        if (result.skippedDuplicate > 0) {
          diagnostics.push(
            `- ${result.skippedDuplicate} reserva(s) já faturadas anteriormente.`
          );
        }

        const feedback = `Período: ${periodLabel}. ${diagnostics.length ? diagnostics.join(" ") : "Não houve itens elegíveis para faturamento."}`;
        setAutoFeedback(feedback);

        showAlert(
          "Nenhuma fatura gerada",
          `Período: ${periodLabel}\n\n${diagnostics.length ? diagnostics.join("\n") : "Não houve itens elegíveis para faturamento."}`
        );
        return;
      }

      setAutoFeedback(
        `Período: ${periodLabel}. Faturas criadas: ${result.created}. Ignoradas: ${result.skipped}.`
      );

      showAlert(
        "Geração automática",
        `Período: ${periodLabel}\nFaturas criadas: ${result.created}\nIgnoradas: ${result.skipped}`
      );
      setStatusFilter("all");
    } catch (err: any) {
      if (err?.message === "MISSING_CUSTOM_RANGE") {
        setAutoFeedback("Informe data inicial e final no período customizado.");
        showAlert("Atenção", "Informe data inicial e final no período customizado.");
        return;
      }

      if (err?.message === "INVALID_CUSTOM_RANGE") {
        setAutoFeedback("Período inválido. Verifique as datas informadas.");
        showAlert("Atenção", "Período inválido. Verifique as datas informadas.");
        return;
      }

      const details = typeof err?.message === "string" ? err.message : "Erro desconhecido";
      setAutoFeedback(`Falha ao gerar faturamento: ${details}`);
      showAlert("Erro", `Não foi possível gerar faturas automaticamente.\n\n${details}`);
    }
  }

  function confirmCleanupDuplicates() {
    showConfirm(
      t("finance.cleanupTitle"),
      t("finance.cleanupMsg"),
      async () => {
        try {
          const result = await cleanupDuplicates.mutateAsync();
          if (result.removed === 0) {
            setAutoFeedback("Nenhuma fatura duplicada encontrada para limpar.");
            showAlert("Limpeza", "Nenhuma duplicada encontrada.");
            return;
          }

          setAutoFeedback(
            `Limpeza concluída: ${result.removed} fatura(s) removida(s) em ${result.groups} grupo(s).`
          );
          showAlert(
            "Limpeza concluída",
            `${result.removed} fatura(s) removida(s) em ${result.groups} grupo(s).`
          );
        } catch (err: any) {
          const details = typeof err?.message === "string" ? err.message : "Erro desconhecido";
          setAutoFeedback(`Falha ao limpar duplicadas: ${details}`);
          showAlert("Erro", `Não foi possível limpar duplicadas.\n\n${details}`);
        }
      },
      t("finance.cleanupConfirm")
    );
  }

  function resetExpenseForm() {
    setExpenseRoomId(null);
    setExpenseDescription("");
    setExpenseAmountInput("");
  }

  function handleCreateExpense() {
    const room = (activeRooms ?? []).find((r) => r.id === expenseRoomId);
    const desc = expenseDescription.trim();
    const amount = Number(expenseAmountInput.replace(",", "."));

    if (!room) {
      setExpenseFeedback("Selecione uma sala ativa para a despesa.");
      return;
    }

    if (!desc) {
      setExpenseFeedback("Informe a descrição da despesa.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseFeedback("Informe um valor válido maior que zero.");
      return;
    }

    const item: ExpenseItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      room: room.name,
      description: desc,
      amount,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [item, ...prev]);
    setExpenseFeedback(`Despesa adicionada em ${room.name}.`);
    resetExpenseForm();
  }

  function handleDeleteExpense(id: string) {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    setExpenseFeedback("Despesa apagada.");
  }

  const expenseTotalsByRoom = expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.room] = (acc[item.room] ?? 0) + item.amount;
    return acc;
  }, {});

  const expenseTotalsRows = Object.entries(expenseTotalsByRoom).sort((a, b) => b[1] - a[1]);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-paper-dark" : "bg-paper"}`} edges={["top"]}>
      <ScreenHeader title={t("finance.title")} subtitle={t("finance.subtitle")} />

      <FlatList
        data={invoices ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8 flex-grow"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View>
      <View className="px-5 mb-3 flex-row justify-between">
        <KpiCard
          icon={Clock3}
          label={t("finance.pending")}
          value={kpis?.pending ?? 0}
          tint="#0E4A7A"
          bg="#E8F0F7"
          isDark={isDark}
        />
        <KpiCard
          icon={AlertCircle}
          label={t("finance.overdue")}
          value={kpis?.overdue ?? 0}
          tint="#DC2626"
          bg="#FEF2F2"
          isDark={isDark}
        />
        <KpiCard
          icon={CheckCircle2}
          label={t("finance.paid")}
          value={kpis?.paid ?? 0}
          tint="#059669"
          bg="#ECFDF5"
          isDark={isDark}
        />
      </View>

      <RevenueSummary currency={space?.currency ?? "USD"} />

      <View className="px-5 mb-3 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setManualOpen(true)}
          className="h-11 px-4 rounded-xl bg-primary items-center justify-center flex-row active:bg-primary-dark"
          style={({ pressed }) =>
            pressed
              ? {
                  transform: [{ scale: 0.985 }],
                  opacity: 0.95,
                }
              : undefined
          }
        >
          <Plus size={16} color="#fff" />
          <Text className="text-white font-semibold ml-1.5">{t("finance.newInvoice")}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void handleAutoGenerate();
          }}
          disabled={autoGenerate.isPending}
          className={`h-11 px-4 rounded-xl border items-center justify-center flex-row ${
            autoGenerate.isPending
              ? isDark
                ? "bg-slate-800 border-border-dark"
                : "bg-gray-100 border-gray-200"
              : isDark
                ? "bg-card-dark border-border-dark active:bg-slate-800"
                : "bg-white border-gray-200 active:bg-gray-50"
          }`}
          style={({ pressed }) =>
            pressed && !autoGenerate.isPending
              ? {
                  transform: [{ scale: 0.985 }],
                  opacity: 0.95,
                }
              : undefined
          }
        >
          <RotateCw size={16} color="#0E4A7A" />
          <Text className="text-primary font-semibold ml-1.5">
            {autoGenerate.isPending ? "Gerando..." : t("finance.generateAuto")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setExpenseOpen(true);
            setExpenseFeedback(null);
          }}
          className={`h-11 px-4 rounded-xl border items-center justify-center flex-row ${
            isDark
              ? "bg-card-dark border-border-dark active:bg-slate-800"
              : "bg-white border-gray-200 active:bg-gray-50"
          }`}
          style={({ pressed }) =>
            pressed
              ? {
                  transform: [{ scale: 0.985 }],
                  opacity: 0.95,
                }
              : undefined
          }
        >
          <Plus size={16} color="#0E4A7A" />
          <Text className="text-primary font-semibold ml-1.5">Despesas</Text>
        </Pressable>

        <Pressable
          onPress={confirmCleanupDuplicates}
          disabled={cleanupDuplicates.isPending}
          className={`h-11 px-4 rounded-xl border items-center justify-center flex-row ${
            cleanupDuplicates.isPending
              ? isDark
                ? "bg-slate-800 border-border-dark"
                : "bg-gray-100 border-gray-200"
              : isDark
                ? "bg-card-dark border-border-dark active:bg-slate-800"
                : "bg-white border-gray-200 active:bg-gray-50"
          }`}
          style={({ pressed }) =>
            pressed && !cleanupDuplicates.isPending
              ? {
                  transform: [{ scale: 0.985 }],
                  opacity: 0.95,
                }
              : undefined
          }
        >
          <Text className="text-danger font-semibold">
            {cleanupDuplicates.isPending ? "Limpando..." : t("finance.cleanup")}
          </Text>
        </Pressable>
      </View>

      <View className="px-5 mb-3">
        <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
          {t("finance.periodLabel")}
        </Text>
        <FlatList
          horizontal
          data={AUTO_PERIODS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = item.value === autoPeriod;
            return (
              <Pressable
                onPress={() => setAutoPeriod(item.value)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  selected
                    ? "bg-primary border-primary"
                    : isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-white border-gray-200"
                }`}
              >
                <Text className={`text-sm font-medium ${selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          }}
        />

        {autoPeriod === "custom" ? (
          <View className="mt-3 flex-row">
            <View className="flex-1 mr-2">
              <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-ink-low"}`}>Data inicial</Text>
              <TextInput
                className={`h-11 rounded-xl border px-3 text-sm ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
                placeholder="2026-07-01"
                placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                value={autoStartDate}
                onChangeText={(text) => setAutoStartDate(formatIsoDateTyping(text))}
                onBlur={() => setAutoStartDate((prev) => normalizeIsoDateOnBlur(prev))}
                autoCapitalize="none"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-ink-low"}`}>Data final</Text>
              <TextInput
                className={`h-11 rounded-xl border px-3 text-sm ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
                placeholder="2026-07-31"
                placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                value={autoEndDate}
                onChangeText={(text) => setAutoEndDate(formatIsoDateTyping(text))}
                onBlur={() => setAutoEndDate((prev) => normalizeIsoDateOnBlur(prev))}
                autoCapitalize="none"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>
        ) : null}

        {autoFeedback ? (
          <View className={`mt-3 rounded-xl p-3 border ${isDark ? "bg-card-dark border-border-dark" : "bg-primary-light border-blue-100"}`}>
            <Text className={`text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{autoFeedback}</Text>
          </View>
        ) : null}
      </View>

      <View className="px-5 mb-3">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = item.value === statusFilter;
            return (
              <Pressable
                onPress={() => setStatusFilter(item.value)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  selected
                    ? "bg-primary border-primary"
                    : isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selected ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"
                  }`}
                >
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
          </View>
        }
        renderItem={({ item }) => (
          <InvoiceRow
            invoice={item}
            currency={space?.currency ?? "USD"}
            onPressPay={() => confirmMarkPaid(item.id)}
            isDark={isDark}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="small" color="#0E4A7A" />
              <Text className={`text-xs mt-3 ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                Carregando faturas...
              </Text>
            </View>
          ) : (
            <EmptyState
              icon={Wallet}
              title={hasFilters ? "Nenhuma fatura para este filtro" : t("finance.empty")}
              subtitle={
                hasFilters
                  ? "Troque o status selecionado para visualizar outras faturas."
                  : t("finance.emptyDesc")
              }
            />
          )
        }
      />

      <Modal visible={manualOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className={`rounded-t-3xl ${isDark ? "bg-paper-dark" : "bg-white"}`} style={{ maxHeight: "86%" }}>
            <View className="flex-row items-center justify-between px-5 pt-5 pb-1">
              <View>
                <Text className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>Nova fatura</Text>
                <Text className={`text-xs ${isDark ? "text-slate-400" : "text-ink-low"}`}>Cadastro manual</Text>
              </View>
              <Pressable
                onPress={() => {
                  setManualOpen(false);
                }}
                className={`h-9 w-9 rounded-full items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
              >
                <X size={18} color="#3D4451" />
              </Pressable>
            </View>

            <FlatList
              data={members ?? []}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View className="px-5 pt-3">
                  <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>Descrição *</Text>
                  <TextInput
                    className={`h-12 rounded-xl border px-4 text-base mb-3 ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
                    placeholder="Ex.: Mensalidade cowork Julho"
                    placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                    value={description}
                    onChangeText={setDescription}
                  />

                  <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>Valor *</Text>
                  <TextInput
                    className={`h-12 rounded-xl border px-4 text-base mb-3 ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
                    placeholder="Ex.: 199,90"
                    placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                    value={amountInput}
                    onChangeText={setAmountInput}
                    keyboardType="numbers-and-punctuation"
                  />

                  <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    Vencimento (AAAA-MM-DD)
                  </Text>
                  <TextInput
                    className={`h-12 rounded-xl border px-4 text-base mb-3 ${isDark ? "border-border-dark text-slate-100 bg-card-dark" : "border-gray-200 text-ink bg-white"}`}
                    placeholder="2026-07-30"
                    placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                    value={dueDateInput}
                    onChangeText={(text) => setDueDateInput(formatIsoDateTyping(text))}
                    onBlur={() => setDueDateInput((prev) => normalizeIsoDateOnBlur(prev))}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    maxLength={10}
                  />

                  <Text className={`font-medium mb-2 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>Membro (opcional)</Text>
                  <Pressable
                    onPress={() => setMemberId(null)}
                    className={`px-4 py-2.5 rounded-full border mr-2 mb-2 self-start ${
                      !memberId
                        ? "bg-primary border-primary"
                        : isDark
                          ? "bg-card-dark border-border-dark"
                          : "bg-white border-gray-200"
                    }`}
                  >
                    <Text className={`text-sm font-medium ${!memberId ? "text-white" : isDark ? "text-slate-300" : "text-ink-mid"}`}>
                      Sem membro
                    </Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => {
                const selected = memberId === item.id;
                return (
                  <View className="px-5">
                    <Pressable
                      onPress={() => setMemberId(item.id)}
                      className={`h-11 rounded-xl border px-4 flex-row items-center justify-between mb-2 ${
                        selected
                          ? "border-primary bg-primary-light"
                          : isDark
                            ? "border-border-dark bg-card-dark"
                            : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text className={selected ? "text-primary font-semibold" : isDark ? "text-slate-100" : "text-ink"}>
                        {item.name}
                      </Text>
                      {selected ? <Text className="text-primary font-bold">✓</Text> : null}
                    </Pressable>
                  </View>
                );
              }}
              contentContainerClassName="pb-24"
            />

            <View className={`px-5 pb-6 pt-2 border-t ${isDark ? "border-border-dark" : "border-gray-100"}`}>
              <Pressable
                onPress={() => {
                  void handleCreateManual();
                }}
                className="h-12 rounded-xl bg-primary items-center justify-center active:bg-primary-dark"
                style={({ pressed }) =>
                  pressed
                    ? {
                        transform: [{ scale: 0.985 }],
                        opacity: 0.95,
                      }
                    : undefined
                }
              >
                <Text className="text-white font-semibold">
                  {createManual.isPending ? "Salvando..." : "Criar fatura"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={expenseOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className={`rounded-t-3xl ${isDark ? "bg-paper-dark" : "bg-white"}`} style={{ maxHeight: "86%" }}>
            <View className="flex-row items-center justify-between px-5 pt-5 pb-1">
              <View>
                <Text className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-ink"}`}>Despesas</Text>
                <Text className={`text-xs ${isDark ? "text-slate-400" : "text-ink-low"}`}>Controle por sala</Text>
              </View>
              <Pressable
                onPress={() => setExpenseOpen(false)}
                className={`h-9 w-9 rounded-full items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
              >
                <X size={18} color="#3D4451" />
              </Pressable>
            </View>

            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View className="px-5 pt-3">
                  <Text className={`font-medium mb-1.5 text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>
                    Sala ativa
                  </Text>
                  {(activeRooms ?? []).length === 0 ? (
                    <View className={`rounded-xl border px-3 py-2 mb-2 ${isDark ? "border-border-dark bg-slate-900" : "border-gray-200 bg-gray-50"}`}>
                      <Text className={`text-xs ${isDark ? "text-slate-400" : "text-ink-low"}`}>
                        Nenhuma sala ativa disponível.
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap gap-2 mb-2">
                      {(activeRooms ?? []).map((room) => {
                        const selected = expenseRoomId === room.id;
                        return (
                          <Pressable
                            key={room.id}
                            onPress={() => setExpenseRoomId(room.id)}
                            className={`px-3 py-2 rounded-full border flex-row items-center ${
                              selected
                                ? "border-primary bg-primary-light"
                                : isDark
                                  ? "bg-card-dark border-border-dark"
                                  : "border-gray-200 bg-white"
                            }`}
                          >
                            <View className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: room.color }} />
                            <Text
                              className={`text-sm font-medium ${
                                selected ? "text-primary" : isDark ? "text-slate-300" : "text-ink-mid"
                              }`}
                            >
                              {room.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <View className="flex-row">
                    <View className="flex-1 mr-1.5">
                      <TextInput
                        className={`h-11 rounded-xl border px-3 text-sm mb-2 ${isDark ? "border-border-dark text-slate-100 bg-slate-900" : "border-gray-200 text-ink bg-white"}`}
                        placeholder="Valor da despesa"
                        placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                        value={expenseAmountInput}
                        onChangeText={setExpenseAmountInput}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View className="flex-1 ml-1.5">
                      <TextInput
                        className={`h-11 rounded-xl border px-3 text-sm mb-2 ${isDark ? "border-border-dark text-slate-100 bg-slate-900" : "border-gray-200 text-ink bg-white"}`}
                        placeholder="Descrição"
                        placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                        value={expenseDescription}
                        onChangeText={setExpenseDescription}
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleCreateExpense}
                    className="h-10 px-4 rounded-xl bg-primary items-center justify-center self-start active:bg-primary-dark"
                    style={({ pressed }) =>
                      pressed
                        ? {
                            transform: [{ scale: 0.985 }],
                            opacity: 0.95,
                          }
                        : undefined
                    }
                  >
                    <Text className="text-white font-semibold">Salvar despesa</Text>
                  </Pressable>

                  {expenseFeedback ? (
                    <Text className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-ink-low"}`}>{expenseFeedback}</Text>
                  ) : null}

                  <View className="mt-3">
                    {expenseTotalsRows.length === 0 ? (
                      <View className={`rounded-xl border px-3 py-2 ${isDark ? "border-border-dark bg-slate-900" : "border-gray-200 bg-gray-50"}`}>
                        <Text className={`text-xs ${isDark ? "text-slate-400" : "text-ink-low"}`}>Sem despesas cadastradas ainda.</Text>
                      </View>
                    ) : (
                      expenseTotalsRows.map(([room, total]) => (
                        <View
                          key={`expense-total-${room}`}
                          className={`rounded-xl border px-3 py-2 mb-2 flex-row items-center justify-between ${isDark ? "border-border-dark bg-slate-900" : "border-gray-200 bg-gray-50"}`}
                        >
                          <Text className={`text-sm ${isDark ? "text-slate-300" : "text-ink-mid"}`}>{room}</Text>
                          <Text className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-ink"}`}>
                            {formatMoney(total, space?.currency ?? "USD", language)}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              }
              renderItem={({ item }) => {
                const dateText = new Date(item.created_at).toLocaleDateString(language);
                return (
                  <View className="px-5">
                    <View
                      className={`rounded-xl border px-3 py-2 mb-2 ${isDark ? "border-border-dark bg-slate-900" : "border-gray-200 bg-gray-50"}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={`text-xs flex-1 mr-2 ${isDark ? "text-slate-300" : "text-ink-mid"}`} numberOfLines={1}>
                          {item.room} · {item.description} · {dateText}
                        </Text>
                        <Text className={`text-xs font-semibold mr-2 ${isDark ? "text-slate-100" : "text-ink"}`}>
                          {formatMoney(item.amount, space?.currency ?? "USD", language)}
                        </Text>
                        <Pressable
                          onPress={() => handleDeleteExpense(item.id)}
                          className="h-7 w-7 rounded-full items-center justify-center bg-danger/10"
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              }}
              contentContainerClassName="pb-24"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

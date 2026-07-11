import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Invoice, InvoiceStatus } from "@/types";

function toErrorMessage(err: unknown) {
  if (!err) return "Erro desconhecido";
  if (err instanceof Error) return err.message;
  const asAny = err as any;
  if (typeof asAny?.message === "string") return asAny.message;
  const code = asAny?.code ? ` [${String(asAny.code)}]` : "";
  const detail = asAny?.details ? ` ${String(asAny.details)}` : "";
  const hint = asAny?.hint ? ` Dica: ${String(asAny.hint)}` : "";
  const text = String(err);
  return `${text}${code}${detail}${hint}`.trim();
}

interface InvoiceInsertInput {
  space_id: string;
  member_id: string | null;
  status: InvoiceStatus;
  due_date: string | null;
  amount: number;
  description: string;
}

function isMissingColumnError(err: unknown, columnName: string) {
  const msg = toErrorMessage(err).toLowerCase();
  return msg.includes("does not exist") && msg.includes(columnName.toLowerCase());
}

function readInvoiceAmount(raw: Record<string, unknown>) {
  if (typeof raw.amount === "number") return raw.amount;
  if (typeof raw.amount_cents === "number") return raw.amount_cents / 100;
  return null;
}

function buildInvoiceDedupKey(input: {
  memberId: string | null;
  dueDate: string | null;
  amount: number | null;
}) {
  if (!input.memberId || !input.dueDate || input.amount === null) return null;
  return `${input.memberId}::${input.dueDate}::${input.amount.toFixed(2)}`;
}

export type AutoInvoicePeriodType = "today" | "week" | "month" | "custom";

interface AutoInvoiceRangeInput {
  periodType: AutoInvoicePeriodType;
  startDate?: string;
  endDate?: string;
}

function getAutoInvoiceRange(input: AutoInvoiceRangeInput) {
  const now = new Date();

  if (input.periodType === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (input.periodType === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (input.periodType === "custom") {
    if (!input.startDate || !input.endDate) {
      throw new Error("MISSING_CUSTOM_RANGE");
    }

    const start = new Date(`${input.startDate}T00:00:00`);
    const end = new Date(`${input.endDate}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new Error("INVALID_CUSTOM_RANGE");
    }

    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

async function insertInvoiceWithFallback(input: InvoiceInsertInput) {
  const amountCents = Math.round(input.amount * 100);
  const dueDate = input.due_date;

  const payloads: Record<string, unknown>[] = [
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      due_date: dueDate,
      amount: input.amount,
      amount_cents: amountCents,
      description: input.description,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      due_date: dueDate,
      amount: input.amount,
      amount_cents: amountCents,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      due_date: dueDate,
      amount: input.amount,
      description: input.description,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      due_date: dueDate,
      amount: input.amount,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      due_date: dueDate,
      amount_cents: amountCents,
      description: input.description,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      due_date: dueDate,
      amount_cents: amountCents,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      amount: input.amount,
      description: input.description,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
      description: input.description,
    },
    {
      space_id: input.space_id,
      member_id: input.member_id,
      status: input.status,
    },
    {
      space_id: input.space_id,
      status: input.status,
      description: input.description,
    },
    {
      space_id: input.space_id,
      status: input.status,
    },
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await supabase.from("invoices").insert(payload);
    if (!error) return;
    lastError = error;
  }

  throw new Error(`INVOICE_INSERT_FAILED: ${toErrorMessage(lastError)}`);
}

function normalizeInvoice(raw: Record<string, unknown>): Invoice {
  const status = String(raw.status ?? "pending") as InvoiceStatus;

  return {
    id: String(raw.id ?? ""),
    space_id: String(raw.space_id ?? ""),
    member_id: raw.member_id ? String(raw.member_id) : null,
    status,
    due_date: raw.due_date ? String(raw.due_date) : null,
    amount: typeof raw.amount === "number" ? raw.amount : null,
    amount_cents: typeof raw.amount_cents === "number" ? raw.amount_cents : null,
    description: raw.description ? String(raw.description) : null,
    member_name: raw.member_name ? String(raw.member_name) : null,
    member_email: raw.member_email ? String(raw.member_email) : null,
    created_at: String(raw.created_at ?? ""),
    paid_at: raw.paid_at ? String(raw.paid_at) : null,
    ...raw,
  };
}

export function useInvoices(status: InvoiceStatus | "all" = "all") {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["invoices", space?.id, status],
    enabled: !!space?.id,
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("space_id", space!.id)
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Record<string, unknown>[];

      const memberIds = Array.from(
        new Set(
          rows
            .map((row) => (row.member_id ? String(row.member_id) : null))
            .filter((id): id is string => !!id)
        )
      );

      const memberMap = new Map<string, { name: string | null; email: string | null }>();

      if (memberIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, email")
          .in("id", memberIds);

        if (!membersError) {
          for (const member of (membersData ?? []) as Array<{
            id: string;
            name: string | null;
            email: string | null;
          }>) {
            memberMap.set(String(member.id), {
              name: member.name ?? null,
              email: member.email ?? null,
            });
          }
        }
      }

      return rows.map((row) => {
        const memberId = row.member_id ? String(row.member_id) : null;
        if (memberId && memberMap.has(memberId)) {
          const m = memberMap.get(memberId)!;
          return normalizeInvoice({
            ...row,
            member_name: m.name,
            member_email: m.email,
          });
        }
        return normalizeInvoice(row);
      });
    },
  });
}

export function useInvoiceKpis() {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["invoice-kpis", space?.id],
    enabled: !!space?.id,
    queryFn: async () => {
      const [pending, overdue, paid] = await Promise.all([
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("space_id", space!.id)
          .eq("status", "pending"),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("space_id", space!.id)
          .eq("status", "overdue"),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("space_id", space!.id)
          .eq("status", "paid"),
      ]);

      if (pending.error) throw pending.error;
      if (overdue.error) throw overdue.error;
      if (paid.error) throw paid.error;

      return {
        pending: pending.count ?? 0,
        overdue: overdue.count ?? 0,
        paid: paid.count ?? 0,
      };
    },
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-kpis"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      qc.invalidateQueries({ queryKey: ["revenue-summary"] });
    },
  });
}

export function useCreateInvoiceManual() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      member_id?: string | null;
      description: string;
      amount: number;
      due_date?: string | null;
      status?: InvoiceStatus;
    }) => {
      await insertInvoiceWithFallback({
        space_id: space!.id,
        member_id: input.member_id ?? null,
        status: input.status ?? "pending",
        due_date: input.due_date ?? null,
        amount: input.amount,
        description: input.description.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-kpis"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useGenerateInvoicesAutomatically() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AutoInvoiceRangeInput) => {
      const range = getAutoInvoiceRange(input);
      const periodStart = range.start.toISOString();
      const periodEnd = range.end.toISOString();

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, member_id, room_id, starts_at, ends_at")
        .eq("space_id", space!.id)
        .eq("status", "confirmed")
        .gte("starts_at", periodStart)
        .lte("starts_at", periodEnd);

      if (bookingsError) {
        throw new Error(`BOOKINGS_QUERY_FAILED: ${toErrorMessage(bookingsError)}`);
      }

      const bookingRows = (bookings ?? []) as Array<{
        id: string;
        member_id: string | null;
        room_id: string;
        starts_at: string;
        ends_at: string;
      }>;

      const roomIds = Array.from(new Set(bookingRows.map((b) => b.room_id).filter(Boolean)));
      const roomPriceMap = new Map<string, number>();

      if (roomIds.length > 0) {
        const { data: rooms, error: roomsError } = await supabase
          .from("rooms")
          .select("id, price_per_hour")
          .in("id", roomIds);

        if (roomsError) {
          throw new Error(`ROOMS_QUERY_FAILED: ${toErrorMessage(roomsError)}`);
        }

        for (const room of (rooms ?? []) as Array<{ id: string; price_per_hour: number | null }>) {
          roomPriceMap.set(String(room.id), Number(room.price_per_hour ?? 0));
        }
      }

      let existingDescriptions = new Set<string>();
      let existingDedupKeys = new Set<string>();
      {
        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("space_id", space!.id);

        if (invoicesError) {
          throw new Error(`INVOICES_QUERY_FAILED: ${toErrorMessage(invoicesError)}`);
        } else {
          const invoiceRows = (invoices ?? []) as Array<Record<string, unknown>>;
          existingDescriptions = new Set(
            invoiceRows
              .map((i) => (typeof i.description === "string" ? i.description : ""))
              .filter(Boolean)
          );

          existingDedupKeys = new Set(
            invoiceRows
              .map((row) =>
                buildInvoiceDedupKey({
                  memberId: row.member_id ? String(row.member_id) : null,
                  dueDate: row.due_date ? String(row.due_date) : null,
                  amount: readInvoiceAmount(row),
                })
              )
              .filter((k): k is string => !!k)
          );
        }
      }

      const now = new Date();

      let created = 0;
      let skipped = 0;
      let skippedDuplicate = 0;
      let skippedNoPrice = 0;
      let skippedNotFinished = 0;

      for (const booking of bookingRows) {
        const bookingEndsAt = new Date(String(booking.ends_at));
        if (bookingEndsAt.getTime() > now.getTime()) {
          skipped += 1;
          skippedNotFinished += 1;
          continue;
        }

        const description = `Reserva #${booking.id}`;
        if (existingDescriptions.has(description)) {
          skipped += 1;
          skippedDuplicate += 1;
          continue;
        }

        const starts = new Date(String(booking.starts_at));
        const ends = new Date(String(booking.ends_at));
        const durationHours = Math.max(0, (ends.getTime() - starts.getTime()) / (1000 * 60 * 60));
        const roomPrice = Number(roomPriceMap.get(String(booking.room_id)) ?? 0);
        const amount = Number((durationHours * roomPrice).toFixed(2));

        if (amount <= 0) {
          skipped += 1;
          skippedNoPrice += 1;
          continue;
        }

        const due = new Date(starts);
        due.setDate(due.getDate() + 7);
        const dueDate = due.toISOString().slice(0, 10);

        const dedupKey = buildInvoiceDedupKey({
          memberId: booking.member_id ? String(booking.member_id) : null,
          dueDate,
          amount,
        });

        if (dedupKey && existingDedupKeys.has(dedupKey)) {
          skipped += 1;
          skippedDuplicate += 1;
          continue;
        }

        await insertInvoiceWithFallback({
          space_id: space!.id,
          member_id: booking.member_id ? String(booking.member_id) : null,
          status: "pending",
          due_date: dueDate,
          amount,
          description,
        });

        if (dedupKey) existingDedupKeys.add(dedupKey);
        existingDescriptions.add(description);
        created += 1;
      }

      return {
        created,
        skipped,
        totalBookings: bookingRows.length,
        skippedDuplicate,
        skippedNoPrice,
        skippedNotFinished,
        periodStart: range.start.toISOString(),
        periodEnd: range.end.toISOString(),
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-kpis"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useSyncFinishedBookingsToInvoices() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const now = new Date();
      const lookbackStart = new Date(now);
      lookbackStart.setDate(lookbackStart.getDate() - 90);

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, member_id, room_id, starts_at, ends_at")
        .eq("space_id", space!.id)
        .eq("status", "confirmed")
        .gte("starts_at", lookbackStart.toISOString())
        .lte("ends_at", now.toISOString());

      if (bookingsError) {
        throw new Error(`BOOKINGS_SYNC_QUERY_FAILED: ${toErrorMessage(bookingsError)}`);
      }

      const bookingRows = (bookings ?? []) as Array<{
        id: string;
        member_id: string | null;
        room_id: string;
        starts_at: string;
        ends_at: string;
      }>;

      if (bookingRows.length === 0) {
        return {
          totalFinished: 0,
          created: 0,
          skippedDuplicate: 0,
          skippedNoPrice: 0,
        };
      }

      const roomIds = Array.from(new Set(bookingRows.map((b) => b.room_id).filter(Boolean)));
      const roomPriceMap = new Map<string, number>();

      if (roomIds.length > 0) {
        const { data: rooms, error: roomsError } = await supabase
          .from("rooms")
          .select("id, price_per_hour")
          .in("id", roomIds);

        if (roomsError) {
          throw new Error(`ROOMS_SYNC_QUERY_FAILED: ${toErrorMessage(roomsError)}`);
        }

        for (const room of (rooms ?? []) as Array<{ id: string; price_per_hour: number | null }>) {
          roomPriceMap.set(String(room.id), Number(room.price_per_hour ?? 0));
        }
      }

      let existingDescriptions = new Set<string>();
      let existingDedupKeys = new Set<string>();
      {
        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("space_id", space!.id);

        if (invoicesError) {
          throw new Error(`INVOICES_SYNC_QUERY_FAILED: ${toErrorMessage(invoicesError)}`);
        } else {
          const invoiceRows = (invoices ?? []) as Array<Record<string, unknown>>;
          existingDescriptions = new Set(
            invoiceRows
              .map((i) => (typeof i.description === "string" ? i.description : ""))
              .filter(Boolean)
          );

          existingDedupKeys = new Set(
            invoiceRows
              .map((row) =>
                buildInvoiceDedupKey({
                  memberId: row.member_id ? String(row.member_id) : null,
                  dueDate: row.due_date ? String(row.due_date) : null,
                  amount: readInvoiceAmount(row),
                })
              )
              .filter((k): k is string => !!k)
          );
        }
      }

      let created = 0;
      let skippedDuplicate = 0;
      let skippedNoPrice = 0;

      for (const booking of bookingRows) {
        const description = `Reserva #${booking.id}`;

        if (existingDescriptions.has(description)) {
          skippedDuplicate += 1;
          continue;
        }

        const starts = new Date(String(booking.starts_at));
        const ends = new Date(String(booking.ends_at));
        const durationHours = Math.max(0, (ends.getTime() - starts.getTime()) / (1000 * 60 * 60));
        const roomPrice = Number(roomPriceMap.get(String(booking.room_id)) ?? 0);
        const amount = Number((durationHours * roomPrice).toFixed(2));

        if (amount <= 0) {
          skippedNoPrice += 1;
          continue;
        }

        const due = new Date(ends);
        due.setDate(due.getDate() + 7);
        const dueDate = due.toISOString().slice(0, 10);

        const dedupKey = buildInvoiceDedupKey({
          memberId: booking.member_id ? String(booking.member_id) : null,
          dueDate,
          amount,
        });

        if (dedupKey && existingDedupKeys.has(dedupKey)) {
          skippedDuplicate += 1;
          continue;
        }

        await insertInvoiceWithFallback({
          space_id: space!.id,
          member_id: booking.member_id ? String(booking.member_id) : null,
          status: "pending",
          due_date: dueDate,
          amount,
          description,
        });

        if (dedupKey) existingDedupKeys.add(dedupKey);
        existingDescriptions.add(description);
        created += 1;
      }

      return {
        totalFinished: bookingRows.length,
        created,
        skippedDuplicate,
        skippedNoPrice,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-kpis"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useCleanupDuplicateInvoices() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("space_id", space!.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`INVOICES_CLEANUP_QUERY_FAILED: ${toErrorMessage(error)}`);
      }

      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const groups = new Map<string, string[]>();

      for (const row of rows) {
        const memberId = row.member_id ? String(row.member_id) : "nomember";
        const dueDate = row.due_date ? String(row.due_date) : "nodue";
        const amount = readInvoiceAmount(row);
        const amountKey = amount !== null ? amount.toFixed(2) : "noamount";
        const status = row.status ? String(row.status) : "nostatus";
        const key = `${memberId}::${dueDate}::${amountKey}::${status}`;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(String(row.id));
      }

      const toDelete: string[] = [];
      let groupsWithDuplicates = 0;

      for (const ids of groups.values()) {
        if (ids.length <= 1) continue;
        groupsWithDuplicates += 1;
        toDelete.push(...ids.slice(1));
      }

      if (toDelete.length === 0) {
        return { removed: 0, groups: 0 };
      }

      const { error: deleteError } = await supabase
        .from("invoices")
        .delete()
        .in("id", toDelete);

      if (deleteError) {
        throw new Error(`INVOICES_CLEANUP_DELETE_FAILED: ${toErrorMessage(deleteError)}`);
      }

      return { removed: toDelete.length, groups: groupsWithDuplicates };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-kpis"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

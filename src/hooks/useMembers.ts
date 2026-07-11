import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Member, MemberStatus } from "@/types";

export interface MemberInput {
  name: string;
  email: string;
  phone?: string | null;
  status: MemberStatus;
}

export function useMembers(search: string, status: MemberStatus | null) {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["members", space?.id, search, status],
    enabled: !!space?.id,
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select("*")
        .eq("space_id", space!.id)
        .order("joined_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (search.trim()) {
        const term = search.trim();
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useCreateMember() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: MemberInput) => {
      const { error } = await supabase.from("members").insert({
        space_id: space!.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        status: input.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MemberInput }) => {
      const { error } = await supabase
        .from("members")
        .update({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone?.trim() || null,
          status: input.status,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Bloqueia se for inquilino com contrato ativo
      const { data: leases, error: leaseErr } = await supabase
        .from("leases")
        .select("id")
        .eq("member_id", id)
        .eq("status", "active")
        .limit(1);
      if (leaseErr) throw leaseErr;
      if (leases && leases.length > 0) throw new Error("MEMBER_HAS_LEASE");

      // Bloqueia se tiver reservas futuras confirmadas
      const { data: bookings, error: bookErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("member_id", id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date().toISOString())
        .limit(1);
      if (bookErr) throw bookErr;
      if (bookings && bookings.length > 0) throw new Error("MEMBER_HAS_BOOKINGS");

      // Bloqueia se tiver faturas pendentes
      const { data: invoices, error: invErr } = await supabase
        .from("invoices")
        .select("id")
        .eq("member_id", id)
        .eq("status", "pending")
        .limit(1);
      if (invErr) throw invErr;
      if (invoices && invoices.length > 0) throw new Error("MEMBER_HAS_INVOICES");

      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

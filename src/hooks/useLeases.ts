import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Lease } from "@/types";

export interface LeaseWithRefs extends Lease {
  rooms: { name: string; color: string; type: string } | null;
  members: { name: string; email: string } | null;
}

export function useLeases() {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["leases", space?.id],
    enabled: !!space?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("*, rooms:unit_id(name, color, type), members(name, email)")
        .eq("space_id", space!.id)
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LeaseWithRefs[];
    },
  });
}

export function useCreateLease() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      unit_id: string;
      member_id: string;
      monthly_rent: number;
      due_day: number;
      starts_on: string; // YYYY-MM-DD
      notes?: string;
    }) => {
      // Uma unidade não pode ter dois contratos ativos ao mesmo tempo
      const { data: existing, error: exErr } = await supabase
        .from("leases")
        .select("id")
        .eq("unit_id", input.unit_id)
        .eq("status", "active");
      if (exErr) throw exErr;
      if (existing && existing.length > 0) throw new Error("UNIT_OCCUPIED");

      const { error } = await supabase.from("leases").insert({
        space_id: space!.id,
        unit_id: input.unit_id,
        member_id: input.member_id,
        monthly_rent: input.monthly_rent,
        due_day: input.due_day,
        starts_on: input.starts_on,
        notes: input.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-kpis"] });
    },
  });
}

export function useEndLease() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leases")
        .update({
          status: "ended",
          ends_on: new Date().toISOString().slice(0, 10),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
    },
  });
}

export function useDeleteLease() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
    },
  });
}

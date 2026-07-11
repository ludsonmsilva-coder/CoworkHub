import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { planLimit } from "@/lib/plans";
import type { Room, RoomType } from "@/types";

export interface RoomInput {
  name: string;
  type: RoomType;
  capacity: number;
  price_per_hour?: number | null;
  color: string;
  is_active: boolean;
  open_time: string;
  close_time: string;
  is_24h: boolean;
}

export function useRooms(onlyActive = false) {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["rooms", space?.id, onlyActive],
    enabled: !!space?.id,
    queryFn: async () => {
      let q = supabase
        .from("rooms")
        .select("*")
        .eq("space_id", space!.id)
        .order("created_at");
      if (onlyActive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Room[];
    },
  });
}

export function useSaveRoom() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: RoomInput }) => {
      // Trava do plano: só ao CRIAR unidade nova
      if (!id) {
        const limit = planLimit(space?.plan);
        const { count, error: countErr } = await supabase
          .from("rooms")
          .select("*", { count: "exact", head: true })
          .eq("space_id", space!.id);
        if (countErr) throw countErr;
        if ((count ?? 0) >= limit) {
          throw new Error(`PLAN_LIMIT:${limit}`);
        }
      }

      if (id) {
        const { error } = await supabase.from("rooms").update(input).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert({ ...input, space_id: space!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      cancelFutureBookings = false,
    }: {
      id: string;
      cancelFutureBookings?: boolean;
    }) => {
      // Bloqueia se houver contrato de aluguel ativo nesta unidade
      const { data: activeLeases, error: leaseErr } = await supabase
        .from("leases")
        .select("id")
        .eq("unit_id", id)
        .eq("status", "active")
        .limit(1);
      if (leaseErr) throw leaseErr;
      if (activeLeases && activeLeases.length > 0) {
        throw new Error("ROOM_HAS_LEASE");
      }

      // Reservas futuras confirmadas: informar (e opcionalmente cancelar)
      const nowISO = new Date().toISOString();
      const { data: futureBookings, error: bookErr } = await supabase
        .from("bookings")
        .select("id, starts_at")
        .eq("room_id", id)
        .eq("status", "confirmed")
        .gte("starts_at", nowISO)
        .order("starts_at");
      if (bookErr) throw bookErr;

      if (futureBookings && futureBookings.length > 0) {
        if (!cancelFutureBookings) {
          // devolve quantidade e data da próxima para a interface decidir
          throw new Error(
            `ROOM_HAS_BOOKINGS:${futureBookings.length}:${futureBookings[0].starts_at}`
          );
        }
        const { error: cancelErr } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("room_id", id)
          .eq("status", "confirmed")
          .gte("starts_at", nowISO);
        if (cancelErr) throw cancelErr;
      }

      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const BOOKING_BUFFER_MINUTES = 15;

export interface BookingWithRefs {
  id: string;
  room_id: string;
  member_id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  notes: string | null;
  rooms: { name: string; color: string } | null;
  members: { name: string } | null;
}

export function useBookingsByDay(dayISO: string) {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["bookings", space?.id, dayISO],
    enabled: !!space?.id,
    queryFn: async () => {
      const start = `${dayISO}T00:00:00`;
      const end = `${dayISO}T23:59:59`;

      const { data, error } = await supabase
        .from("bookings")
        .select("*, rooms(name,color), members(name)")
        .eq("space_id", space!.id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date(start).toISOString())
        .lte("starts_at", new Date(end).toISOString())
        .order("starts_at");

      if (error) throw error;
      return data as unknown as BookingWithRefs[];
    },
  });
}

export function useCreateBooking() {
  const { space } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      room_id: string;
      member_id: string;
      starts_at: Date;
      ends_at: Date;
      notes?: string;
      reminder_hours?: number | null;
    }) => {
      // Horário de funcionamento da SALA (editável no cadastro da sala)
      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .select("open_time, close_time, is_24h")
        .eq("id", input.room_id)
        .single();
      if (roomErr) throw roomErr;

      const durationMs = input.ends_at.getTime() - input.starts_at.getTime();
      const isLongTerm = durationMs >= 24 * 60 * 60 * 1000; // diárias/mensais não validam hora

      if (!room?.is_24h && !isLongTerm) {
        const toMin = (t: string) => {
          const [h, m] = t.slice(0, 5).split(":").map(Number);
          return h * 60 + m;
        };
        const open = toMin(room?.open_time ?? "07:00");
        const close = toMin(room?.close_time ?? "21:00");
        const start =
          input.starts_at.getHours() * 60 + input.starts_at.getMinutes();
        const end = input.ends_at.getHours() * 60 + input.ends_at.getMinutes();

        let ok: boolean;
        if (close > open) {
          // Horário normal no mesmo dia (ex.: 07:00–21:00)
          ok = start >= open && end <= close && end > start;
        } else {
          // Horário noturno cruzando a meia-noite (ex.: 18:00–02:00)
          const inWindow = (t: number) => t >= open || t <= close;
          ok = inWindow(start) && inWindow(end);
        }

        if (!ok) {
          const fmt = (t: string) => t.slice(0, 5);
          throw new Error(
            `OUTSIDE_BUSINESS_HOURS:${fmt(room?.open_time ?? "07:00")}-${fmt(
              room?.close_time ?? "21:00"
            )}`
          );
        }
      }

      const bufferedStart = new Date(
        input.starts_at.getTime() - BOOKING_BUFFER_MINUTES * 60 * 1000
      );
      const bufferedEnd = new Date(
        input.ends_at.getTime() + BOOKING_BUFFER_MINUTES * 60 * 1000
      );

      // Validação de conflito de horário
      const { data: conflicts, error: confErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("room_id", input.room_id)
        .eq("status", "confirmed")
        .lt("starts_at", bufferedEnd.toISOString())
        .gt("ends_at", bufferedStart.toISOString());

      if (confErr) throw confErr;
      if (conflicts && conflicts.length > 0) {
        throw new Error("CONFLICT");
      }

      const { error } = await supabase.from("bookings").insert({
        space_id: space!.id,
        room_id: input.room_id,
        member_id: input.member_id,
        starts_at: input.starts_at.toISOString(),
        reminder_hours: input.reminder_hours ?? null,
        ends_at: input.ends_at.toISOString(),
        notes: input.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

/** Dias do mês que têm reservas confirmadas (para os pontinhos do calendário) */
export function useBookedDaysOfMonth(monthISO: string, roomId?: string, memberId?: string) {
  const { space } = useAuth();

  return useQuery({
    queryKey: ["booked-days", space?.id, monthISO, roomId ?? "all", memberId ?? "all"],
    enabled: !!space?.id,
    queryFn: async () => {
      const [y, m] = monthISO.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);

      let query = supabase
        .from("bookings")
        .select("starts_at, room_id, member_id")
        .eq("space_id", space!.id)
        .eq("status", "confirmed")
        .gte("starts_at", start.toISOString())
        .lte("starts_at", end.toISOString());

      if (roomId && roomId !== "all") query = query.eq("room_id", roomId);
      if (memberId && memberId !== "all") query = query.eq("member_id", memberId);

      const { data, error } = await query;
      if (error) throw error;

      const days = new Set<string>();
      for (const b of data ?? []) {
        const d = new Date(b.starts_at as string);
        days.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        );
      }
      return days;
    },
  });
}

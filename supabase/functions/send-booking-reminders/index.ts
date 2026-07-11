import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type BookingRow = {
  id: string;
  starts_at: string;
  reminder_hours: number | null;
  reminder_sent_at: string | null;
  reminder_attempts: number | null;
  status: "confirmed" | "cancelled";
  notes: string | null;
  members: { name: string; email: string | null } | null;
  rooms: { name: string } | null;
  spaces: { name: string; email_sender_name: string | null; timezone: string | null } | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function sanitizeSenderName(value: string) {
  return value.replace(/[<>\"]/g, "").trim();
}

function isDueNow(startsAtIso: string, reminderHours: number, now: Date, windowMinutes: number) {
  const startsAt = new Date(startsAtIso);
  const dueAtMs = startsAt.getTime() - reminderHours * 60 * 60 * 1000;
  const nowMs = now.getTime();
  const endMs = nowMs + windowMinutes * 60 * 1000;
  return dueAtMs >= nowMs && dueAtMs < endMs;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const cronSecret = Deno.env.get("REMINDER_CRON_SECRET") ?? "";
  const fromEmail = Deno.env.get("REMINDER_FROM_EMAIL") ?? "lembretes@lokaro.co";
  const windowMinutes = Number(Deno.env.get("REMINDER_WINDOW_MINUTES") ?? "5");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (cronSecret) {
    const auth = req.headers.get("authorization")?.replace("Bearer ", "").trim();
    const secretHeader = req.headers.get("x-cron-secret")?.trim();
    if (auth !== cronSecret && secretHeader !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const futureLimit = new Date(now.getTime() + 49 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, reminder_hours, reminder_sent_at, reminder_attempts, status, notes, members(name,email), rooms(name), spaces(name,email_sender_name,timezone)"
    )
    .eq("status", "confirmed")
    .not("reminder_hours", "is", null)
    .is("reminder_sent_at", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", futureLimit.toISOString())
    .limit(1000);

  if (error) {
    return new Response(JSON.stringify({ error: `BOOKINGS_QUERY_FAILED: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const bookings = (data ?? []) as unknown as BookingRow[];
  const due = bookings.filter((b) =>
    typeof b.reminder_hours === "number" && b.reminder_hours > 0
      ? isDueNow(b.starts_at, b.reminder_hours, now, windowMinutes)
      : false
  );

  let sent = 0;
  let failed = 0;

  for (const booking of due) {
    const member = asArray(booking.members)[0] ?? booking.members;
    const room = asArray(booking.rooms)[0] ?? booking.rooms;
    const space = asArray(booking.spaces)[0] ?? booking.spaces;

    const to = member?.email?.trim().toLowerCase();
    if (!to) {
      failed += 1;
      await supabase
        .from("bookings")
        .update({
          reminder_error: "MEMBER_EMAIL_MISSING",
          reminder_attempts: (booking.reminder_attempts ?? 0) + 1,
        })
        .eq("id", booking.id)
        .is("reminder_sent_at", null);
      continue;
    }

    const senderName = sanitizeSenderName(space?.email_sender_name || space?.name || "Lokaro");
    const from = `${senderName} <${fromEmail}>`;
    const starts = new Date(booking.starts_at);
    const startLabel = starts.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const subject = `Lembrete: sua reserva começa em ${booking.reminder_hours}h`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px;color:#0f172a">
        <h2 style="margin:0 0 12px">Lembrete de reserva</h2>
        <p>Olá, ${member?.name ?? "cliente"}.</p>
        <p>Este é um lembrete da sua reserva:</p>
        <ul>
          <li><strong>Espaço:</strong> ${space?.name ?? "Lokaro"}</li>
          <li><strong>Sala:</strong> ${room?.name ?? "Sala"}</li>
          <li><strong>Início:</strong> ${startLabel}</li>
        </ul>
        <p>Se precisar ajustar, entre em contato com o administrador do espaço.</p>
      </div>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!resendResp.ok) {
      const body = await resendResp.text();
      failed += 1;
      await supabase
        .from("bookings")
        .update({
          reminder_error: `RESEND_ERROR_${resendResp.status}: ${body.slice(0, 300)}`,
          reminder_attempts: (booking.reminder_attempts ?? 0) + 1,
        })
        .eq("id", booking.id)
        .is("reminder_sent_at", null);
      continue;
    }

    sent += 1;
    await supabase
      .from("bookings")
      .update({
        reminder_sent_at: new Date().toISOString(),
        reminder_error: null,
        reminder_attempts: (booking.reminder_attempts ?? 0) + 1,
      })
      .eq("id", booking.id)
      .is("reminder_sent_at", null);
  }

  return new Response(
    JSON.stringify({
      scanned: bookings.length,
      due: due.length,
      sent,
      failed,
      now: now.toISOString(),
      windowMinutes,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

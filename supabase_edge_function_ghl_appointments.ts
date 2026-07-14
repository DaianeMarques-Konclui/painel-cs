// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface GhlWebhookPayload {
  appointment_id?: string;
  cs_email?: string;
  client_email?: string;
  client_name?: string;
  start_time?: string;
  email?: string;
  full_name?: string;
  calendar?: { appointmentId?: string; startTime?: string; [key: string]: unknown };
  user?: { email?: string; [key: string]: unknown };
  appointment?: { id?: string; [key: string]: unknown };
  [key: string]: unknown;
}

console.info("server started");

// Cliente com a service role key (ignora RLS), pra gravar sem depender da
// chave anon usada pelo painel na leitura.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const body: GhlWebhookPayload = await req.json();

    const appointmentId = body.appointment_id || body?.calendar?.appointmentId || body?.appointment?.id;
    const csEmail = body.cs_email || body?.user?.email;
    const clientEmail = body.client_email || body.email;
    const clientName = body.client_name || body.full_name;
    const startTime = body.start_time || body?.calendar?.startTime;

    if (!appointmentId || !csEmail) {
      return Response.json({ error: "faltando appointment_id ou cs_email" }, { status: 400 });
    }

    const { error } = await supabase.from("ghl_appointments").upsert({
      appointment_id: String(appointmentId),
      cs_email: csEmail,
      client_email: clientEmail || null,
      client_name: clientName || null,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      calendar: body.calendar || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "appointment_id" });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});

// Crea un Link de Pago de Bold para una RECARGA de saldo del usuario.
// Cuando el pago se aprueba, el webhook (o el polling de order-status)
// acredita amount + bonus al user_balances.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOLD_IDENTITY_KEY = Deno.env.get("BOLD_IDENTITY_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOLD_API_URL = "https://integrations.api.bold.co/online/link/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!BOLD_IDENTITY_KEY) throw new Error("Falta configurar BOLD_IDENTITY_KEY");
    const body = await req.json().catch(() => ({}));
    const amount = Math.floor(Number(body?.amount_cop) || 0);
    const bonus = Math.max(0, Math.floor(Number(body?.bonus_cop) || 0));
    const userId = body?.user_id;
    const buyerEmail = body?.buyer_email;

    if (!userId) throw new Error("user_id requerido");
    if (amount < 1000) throw new Error("Monto mínimo: $1.000 COP");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const orderRef = `EC-TOP-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const { error: oErr } = await supabase.from("orders").insert({
      order_ref: orderRef,
      user_id: userId,
      buyer_email: buyerEmail ?? null,
      amount_cop: amount,
      currency: "COP",
      status: "pending",
      kind: "topup",
      topup_amount_cop: amount,
      topup_bonus_cop: bonus,
      items: [],
    });
    if (oErr) throw oErr;

    const origin = req.headers.get("origin") ?? "https://easyshopcheats.lovable.app";
    const callbackUrl = `${origin}/orden/${orderRef}`;
    const expirationNs = (Date.now() + 60 * 60 * 1000) * 1_000_000;

    const linkPayload: Record<string, unknown> = {
      amount_type: "CLOSE",
      amount: { currency: "COP", total_amount: amount, tip_amount: 0 },
      reference: orderRef,
      description: `Recarga de saldo Easy Cheats${bonus > 0 ? ` (+${bonus} bono)` : ""}`,
      expiration_date: expirationNs,
      callback_url: callbackUrl,
    };
    if (buyerEmail) linkPayload.payer_email = buyerEmail;

    const boldRes = await fetch(BOLD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `x-api-key ${BOLD_IDENTITY_KEY}`,
      },
      body: JSON.stringify(linkPayload),
    });
    const boldJson = await boldRes.json().catch(() => ({}));
    if (!boldRes.ok || !boldJson?.payload?.url) {
      const errMsg = boldJson?.errors?.[0]?.errors ?? boldJson?.errors?.[0]?.message ?? boldJson?.message ?? `Bold respondió ${boldRes.status}`;
      await supabase.from("orders").update({ status: "rejected" }).eq("order_ref", orderRef);
      throw new Error(errMsg);
    }

    await supabase.from("orders").update({ payment_link: boldJson.payload.payment_link }).eq("order_ref", orderRef);

    return new Response(JSON.stringify({
      order_ref: orderRef, amount, currency: "COP",
      checkout_url: boldJson.payload.url,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    console.error("[bold-topup]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

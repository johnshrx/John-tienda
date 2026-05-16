// Crea un Link de Pago de Bold con soporte de variantes y saldo de usuario.
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
    if (!BOLD_IDENTITY_KEY) throw new Error("Falta configurar BOLD_IDENTITY_KEY en el servidor");

    const body = await req.json().catch(() => ({}));
    const { items, buyer_email, user_id, use_balance } = body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "items requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const productIds = Array.from(new Set(items.map((i: any) => i.product_id)));
    const variantIds = Array.from(new Set(items.map((i: any) => i.variant_id).filter(Boolean)));

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price_cop, discount_percent, active")
      .in("id", productIds);

    const { data: variants } = variantIds.length
      ? await supabase
          .from("product_variants")
          .select("id, product_id, name, price_cop, discount_percent, active")
          .in("id", variantIds)
      : { data: [] as any[] };

    let amount = 0;
    const validatedItems: Array<{
      product_id: string; variant_id: string | null; name: string; qty: number; price: number;
    }> = [];

    for (const item of items) {
      const prod = products?.find((p: any) => p.id === item.product_id);
      if (!prod || !prod.active) {
        return new Response(JSON.stringify({ error: `Producto no disponible: ${item.product_id}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let unit = prod.price_cop;
      let discount = prod.discount_percent ?? 0;
      let displayName = prod.name;
      let variantId: string | null = null;

      if (item.variant_id) {
        const v = (variants ?? []).find((vv: any) => vv.id === item.variant_id && vv.product_id === prod.id);
        if (!v || !v.active) {
          return new Response(JSON.stringify({ error: `Variante no disponible` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        unit = v.price_cop;
        discount = v.discount_percent ?? 0;
        displayName = `${prod.name} — ${v.name}`;
        variantId = v.id;
      }

      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      const qty = Math.max(1, Math.min(10, Number(item.qty) || 1));
      amount += finalUnit * qty;
      validatedItems.push({ product_id: prod.id, variant_id: variantId, name: displayName, qty, price: finalUnit });
    }

    // Aplicar saldo del usuario si lo solicita
    let balanceApplied = 0;
    if (use_balance && user_id) {
      const { data: bal } = await supabase
        .from("user_balances").select("balance_cop").eq("user_id", user_id).maybeSingle();
      const available = Math.max(0, Number(bal?.balance_cop ?? 0));
      balanceApplied = Math.min(available, amount);
    }
    const amountToCharge = amount - balanceApplied;

    const orderRef = `EC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Caso 1: el saldo cubre todo → orden aprobada inmediatamente, sin Bold
    if (amountToCharge <= 0) {
      // descontar saldo atómicamente
      if (balanceApplied > 0 && user_id) {
        const { data: balRow } = await supabase
          .from("user_balances").select("balance_cop").eq("user_id", user_id).maybeSingle();
        const newBal = Math.max(0, Number(balRow?.balance_cop ?? 0) - balanceApplied);
        await supabase.from("user_balances").update({ balance_cop: newBal }).eq("user_id", user_id);
        await supabase.from("balance_transactions").insert({
          user_id, delta_cop: -balanceApplied, balance_after_cop: newBal,
          reason: "order_payment", note: `Pago orden ${orderRef}`,
        });
      }
      const { error: oErr } = await supabase.from("orders").insert({
        order_ref: orderRef,
        user_id: user_id ?? null,
        buyer_email: buyer_email ?? null,
        amount_cop: amount,
        balance_applied_cop: balanceApplied,
        currency: "COP",
        status: "pending", // será marcado approved por order-status al consultar (entrega assets)
        items: validatedItems,
      });
      if (oErr) throw oErr;
      return new Response(JSON.stringify({
        order_ref: orderRef, amount, currency: "COP",
        paid_with_balance: true,
        redirect_url: `/orden/${orderRef}?paid=balance`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (amountToCharge < 1000) {
      return new Response(JSON.stringify({ error: "Monto mínimo a pagar con Bold: $1.000 COP" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: oErr } = await supabase.from("orders").insert({
      order_ref: orderRef,
      user_id: user_id ?? null,
      buyer_email: buyer_email ?? null,
      amount_cop: amount,
      balance_applied_cop: balanceApplied,
      currency: "COP",
      status: "pending",
      items: validatedItems,
    });
    if (oErr) throw oErr;

    const origin = req.headers.get("origin") ?? "https://easyshopcheats.lovable.app";
    const callbackUrl = `${origin}/orden/${orderRef}`;
    const expirationNs = (Date.now() + 60 * 60 * 1000) * 1_000_000;

    const linkPayload: Record<string, unknown> = {
      amount_type: "CLOSE",
      amount: { currency: "COP", total_amount: amountToCharge, tip_amount: 0 },
      reference: orderRef,
      description: `Easy Cheats - ${validatedItems.length} producto(s)`,
      expiration_date: expirationNs,
      callback_url: callbackUrl,
    };
    if (buyer_email) linkPayload.payer_email = buyer_email;

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
      const errorObj = boldJson?.errors?.[0];
      const errMsg = errorObj?.errors ?? errorObj?.message ?? boldJson?.message ?? `Bold respondió ${boldRes.status}`;
      await supabase.from("orders").update({ status: "rejected" }).eq("order_ref", orderRef);
      throw new Error(errMsg);
    }

    const checkoutUrl: string = boldJson.payload.url;
    const paymentLink: string = boldJson.payload.payment_link;

    // Reservar saldo: lo restamos ahora (al rechazar el pago lo devolveremos en order-status)
    if (balanceApplied > 0 && user_id) {
      const { data: balRow } = await supabase
        .from("user_balances").select("balance_cop").eq("user_id", user_id).maybeSingle();
      const newBal = Math.max(0, Number(balRow?.balance_cop ?? 0) - balanceApplied);
      await supabase.from("user_balances").update({ balance_cop: newBal }).eq("user_id", user_id);
      await supabase.from("balance_transactions").insert({
        user_id, delta_cop: -balanceApplied, balance_after_cop: newBal,
        reason: "order_payment", note: `Reserva orden ${orderRef}`,
      });
    }

    await supabase.from("orders").update({ payment_link: paymentLink }).eq("order_ref", orderRef);

    return new Response(JSON.stringify({
      order_ref: orderRef, amount: amountToCharge, currency: "COP",
      checkout_url: checkoutUrl, payment_link: paymentLink,
      balance_applied: balanceApplied,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    console.error("[bold-checkout] error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

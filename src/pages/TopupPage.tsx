/**
 * Página de recarga de saldo.
 * El cliente elige el monto (mínimo 10 USD) y paga por Bold.
 * Compatible con PC y móvil.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MIN_USD = 10;

export default function TopupPage() {
  const { user, loading } = useAuth();
  const { balance } = useBalance();
  const { format, currency, rateUsdToCop, toDisplay } = useCurrency();
  const navigate = useNavigate();

  const minCop = useMemo(() => Math.ceil(MIN_USD * rateUsdToCop), [rateUsdToCop]);

  // Monto mostrado al usuario en su moneda actual (USD o COP)
  const [displayAmount, setDisplayAmount] = useState<number>(() =>
    currency === "USD" ? MIN_USD : Math.ceil(MIN_USD * rateUsdToCop),
  );
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/recargar", { replace: true });
  }, [loading, user, navigate]);

  // amount en COP (lo que se cobra y guarda)
  const amountCop = useMemo(() => {
    if (currency === "USD") return Math.round((displayAmount || 0) * rateUsdToCop);
    return Math.round(displayAmount || 0);
  }, [displayAmount, currency, rateUsdToCop]);

  const belowMin = amountCop < minCop;

  const quickAmountsUsd = [10, 20, 50, 100, 200];

  async function pay() {
    if (belowMin) return toast.error(`Monto mínimo: ${MIN_USD} USD`);
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("bold-topup", {
        body: { amount_cop: amountCop, bonus_cop: 0, user_id: user?.id, buyer_email: user?.email },
      });
      if (error) throw new Error(error.message);
      if (!data || data.error) throw new Error(data?.error ?? "Respuesta inválida");
      if (!data.checkout_url) throw new Error("Bold no devolvió URL");
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error("No se pudo iniciar la recarga", { description: (e as Error).message });
      setCreating(false);
    }
  }

  if (loading || !user) {
    return <div className="container-app py-20 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="container-app py-8 sm:py-12 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {/* Saldo actual */}
      <div className="rounded-2xl border-gradient bg-gradient-card p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Tu saldo actual</p>
            <p className="font-display text-2xl sm:text-3xl font-black text-gradient truncate">
              {format(balance)}
            </p>
          </div>
        </div>
      </div>

      <h1 className="mt-8 font-display text-2xl sm:text-3xl font-black">
        Recarga tu <span className="text-gradient">saldo</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Monto mínimo: <span className="font-bold text-foreground">{MIN_USD} USD</span>. Serás redirigido a Bold para pagar.
      </p>

      {/* Montos rápidos */}
      <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-2">
        {quickAmountsUsd.map((usd) => {
          const value = currency === "USD" ? usd : Math.ceil(usd * rateUsdToCop);
          const active = Math.abs(displayAmount - value) < 0.5;
          return (
            <button
              key={usd}
              onClick={() => setDisplayAmount(value)}
              className={`rounded-lg border px-2 py-2.5 text-sm font-bold transition ${
                active
                  ? "border-primary bg-primary/15 text-primary shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              ${usd}
            </button>
          );
        })}
      </div>

      {/* Input personalizado */}
      <div className="mt-5 rounded-xl border border-border bg-card p-4 sm:p-5">
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Monto a recargar ({currency})
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-display text-2xl font-black text-muted-foreground">
            {currency === "USD" ? "$" : "COP"}
          </span>
          <Input
            type="number"
            min={currency === "USD" ? MIN_USD : minCop}
            step={currency === "USD" ? 1 : 1000}
            inputMode="decimal"
            value={displayAmount || ""}
            onChange={(e) => setDisplayAmount(parseFloat(e.target.value || "0"))}
            className="h-12 text-xl font-bold"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Equivalente</span>
          <span className="font-bold">{format(amountCop)}</span>
        </div>

        {belowMin && (
          <p className="mt-2 text-xs text-destructive">
            El monto mínimo es {MIN_USD} USD ({format(minCop)}).
          </p>
        )}

        <Button
          className="mt-4 w-full h-12 text-base font-bold bg-gradient-to-r from-accent to-primary text-primary-foreground hover:opacity-90 shadow-glow"
          disabled={creating || belowMin}
          onClick={pay}
        >
          {creating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>Recargar {format(amountCop)} con Bold</>
          )}
        </Button>

        <p className="mt-3 text-[11px] text-center text-muted-foreground">
          Al confirmar serás redirigido a Bold para completar el pago de forma segura.
        </p>
      </div>
    </div>
  );
}

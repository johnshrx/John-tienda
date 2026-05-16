import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShieldCheck, ArrowLeft, Loader2, Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, formatCOP } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, setQty, remove, total, clear, keyOf } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email ?? "");
  const [creating, setCreating] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [useBalance, setUseBalance] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);

  // Requerir sesión
  useEffect(() => {
    if (!authLoading && !user && items.length > 0) {
      toast.info("Inicia sesión para continuar con tu compra");
      navigate("/auth?redirect=/checkout", { replace: true });
    }
  }, [authLoading, user, items.length, navigate]);

  // Cargar saldo
  const loadBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_balances" as any).select("balance_cop").eq("user_id", user.id).maybeSingle();
    setBalance(Number((data as any)?.balance_cop ?? 0));
  };
  useEffect(() => { loadBalance(); }, [user]);

  async function redeemGift() {
    if (!giftCode.trim()) return;
    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_gift_card" as any, { _code: giftCode.trim() });
    setRedeeming(false);
    if (error) return toast.error("Error al canjear", { description: error.message });
    const r = data as any;
    if (!r?.ok) {
      const msg = { not_found: "Código no válido", inactive: "Tarjeta ya usada o inactiva", expired: "Tarjeta expirada", auth_required: "Inicia sesión" }[r?.error] ?? r?.error;
      return toast.error("No se pudo canjear", { description: msg });
    }
    toast.success(`Saldo agregado: ${formatCOP(r.amount_cop)}`);
    setGiftCode("");
    loadBalance();
  }

  async function startCheckout() {
    if (items.length === 0) return toast.error("Tu carrito está vacío");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Ingresa un correo válido");

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("bold-checkout", {
        body: {
          items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, qty: i.qty })),
          buyer_email: email, user_id: user?.id ?? null,
          use_balance: useBalance,
        },
      });
      if (error) throw new Error(error.message ?? "Error de red");
      if (!data || data.error) throw new Error(data?.error ?? "Respuesta inválida");

      // Pagado 100% con saldo
      if (data.paid_with_balance) {
        clear();
        toast.success("Pago realizado con saldo");
        navigate(`/orden/${data.order_ref}`);
        return;
      }

      if (!data.checkout_url) throw new Error("Bold no devolvió la URL de checkout");
      toast.success("Redirigiendo a Bold...");
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error("No se pudo iniciar el pago", { description: (e as Error).message });
      setCreating(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-3xl font-black">Tu carrito está vacío</h1>
        <p className="mt-3 text-muted-foreground">Explora el catálogo y agrega tus cheats favoritos.</p>
        <Button asChild className="mt-6"><Link to="/productos">Ver productos</Link></Button>
      </div>
    );
  }

  const balanceToApply = useBalance ? Math.min(balance, total) : 0;
  const toPay = total - balanceToApply;

  return (
    <div className="container-app py-12">
      <Link to="/productos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Seguir comprando
      </Link>

      <h1 className="font-display text-4xl font-black">Tu <span className="text-gradient">carrito</span></h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((it) => {
            const k = keyOf(it);
            return (
              <div key={k} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <div className="h-20 w-20 shrink-0 rounded-lg bg-secondary grid place-items-center text-primary/30 font-display font-black overflow-hidden">
                  {it.image_url ? <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" /> : it.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{it.name}</h3>
                  <p className="text-sm text-muted-foreground">{format(it.price_cop)} c/u</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(k, it.qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-bold">{it.qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(k, it.qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <p className="font-display font-bold text-gradient">{format(it.price_cop * it.qty)}</p>
                  <Button size="icon" variant="ghost" onClick={() => remove(k)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Gift card input */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><Gift className="h-4 w-4 text-accent" /> ¿Tienes una tarjeta de regalo?</p>
            <div className="mt-3 flex gap-2">
              <Input value={giftCode} onChange={(e) => setGiftCode(e.target.value.toUpperCase())} placeholder="EC-XXXX-XXXX-XXXX" />
              <Button onClick={redeemGift} disabled={redeeming || !giftCode.trim()}>
                {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Canjear"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">El monto se suma a tu saldo y puedes usarlo aquí.</p>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border-gradient bg-gradient-card p-6">
            <h2 className="font-display text-xl font-bold">Resumen</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{format(total)}</span>
              </div>
              {balance > 0 && (
                <label className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3 cursor-pointer hover:border-primary/50 transition">
                  <input type="checkbox" checked={useBalance} onChange={(e) => setUseBalance(e.target.checked)} className="mt-0.5" />
                  <div className="flex-1">
                    <p className="flex items-center gap-1 text-sm font-bold"><Wallet className="h-3.5 w-3.5 text-accent" /> Usar mi saldo</p>
                    <p className="text-xs text-muted-foreground">Disponible: {format(balance)}</p>
                  </div>
                </label>
              )}
              {useBalance && balanceToApply > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Saldo aplicado</span><span>− {format(balanceToApply)}</span>
                </div>
              )}
            </div>
            <div className="my-4 h-px bg-border" />
            <div className="flex justify-between items-baseline">
              <span className="font-bold uppercase tracking-wider text-sm">Total a pagar</span>
              <span className="font-display text-2xl font-black text-gradient">{format(toPay)}</span>
            </div>
            {toPay > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                El cobro se procesa en COP por Bold: <strong>{formatCOP(toPay)}</strong>.
              </p>
            )}

            <div className="mt-6 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Correo de contacto
              </label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" disabled={creating} />
            </div>

            <Button className="mt-6 w-full shadow-glow" size="lg" onClick={startCheckout} disabled={creating || items.length === 0}>
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</> : (toPay <= 0 ? "Pagar con saldo" : "Pagar con Bold")}
            </Button>

            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => { clear(); navigate("/productos"); }} disabled={creating}>
              Vaciar carrito
            </Button>

            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" /> Pago procesado de forma segura por Bold.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

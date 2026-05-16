import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCOP } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DeliverySection } from "./OrderResultPage";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  /** Carga URLs firmadas frescas desde la edge function. */
  async function loadDetails(orderRef: string) {
    if (details[orderRef]) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-status?order_ref=${encodeURIComponent(orderRef)}`;
    const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" } });
    const data = await res.json();
    setDetails((d) => ({ ...d, [orderRef]: data }));
  }

  function toggle(ref: string) {
    if (openRef === ref) { setOpenRef(null); return; }
    setOpenRef(ref);
    loadDetails(ref);
  }

  if (authLoading) return <div className="container-app py-20 text-center text-muted-foreground">Cargando...</div>;

  if (!user) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-3xl font-black">Inicia sesión</h1>
        <p className="mt-3 text-muted-foreground">Necesitas una cuenta para ver tus pedidos.</p>
        <Button asChild className="mt-6"><Link to="/auth">Entrar</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-black">Mis <span className="text-gradient">pedidos</span></h1>
      <p className="mt-2 text-muted-foreground">Vuelve a ver, copiar y descargar tus productos comprados.</p>

      <div className="mt-8 space-y-4">
        {orders.length === 0 && <p className="text-muted-foreground">Aún no tienes pedidos.</p>}
        {orders.map((o) => {
          const isOpen = openRef === o.order_ref;
          const expired = o.access_until && new Date(o.access_until) < new Date();
          return (
            <div key={o.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("es-CO")}</p>
                  <p className="font-mono text-sm">{o.order_ref}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-3 text-sm">
                {(o.items as any[]).map((i, k) => (
                  <p key={k}>· {i.qty}× {i.name}</p>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap justify-between items-center gap-3">
                <span className="font-display text-xl font-black text-gradient">{formatCOP(o.amount_cop)}</span>
                {o.status === "approved" && (
                  <Button variant="outline" size="sm" onClick={() => toggle(o.order_ref)} className="gap-2">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {isOpen ? "Ocultar" : (expired ? "Acceso expirado" : "Ver y descargar")}
                  </Button>
                )}
              </div>

              {isOpen && o.status === "approved" && (
                <div className="mt-4 border-t border-border pt-4">
                  {!details[o.order_ref] ? (
                    <p className="text-sm text-muted-foreground">Cargando descargas...</p>
                  ) : (
                    <DeliverySection order={details[o.order_ref]} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Aprobada", cls: "bg-accent/15 text-accent border-accent/30" },
    pending: { label: "Pendiente", cls: "bg-primary/15 text-primary border-primary/30" },
    rejected: { label: "Rechazada", cls: "bg-destructive/15 text-destructive border-destructive/30" },
    voided: { label: "Anulada", cls: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[status] ?? map.pending;
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

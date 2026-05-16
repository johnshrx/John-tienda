/**
 * Página de retorno tras el pago en Bold.
 * Bold redirige aquí con: ?bold-order-id=...&bold-tx-status=approved|rejected|pending
 *
 * Cuando la orden está aprobada y dentro de la ventana de acceso, mostramos:
 *  - Las claves entregadas (copiables)
 *  - Los archivos de descarga (URLs firmadas frescas, válidas mientras dure el acceso)
 *  - Los videos tutoriales
 *
 * Si la ventana de acceso expiró, se indica al cliente que use Discord.
 */
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Copy, ShoppingBag, Download, PlayCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCOP, useCart } from "@/contexts/CartContext";
import { DISCORD_INVITE } from "@/config/site";
import { toast } from "sonner";

export default function OrderResultPage() {
  const { orderRef: paramRef } = useParams();
  const [search] = useSearchParams();
  const orderRef = paramRef ?? search.get("bold-order-id") ?? "";
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { clear } = useCart();
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (order?.status === "approved") clear();
  }, [order?.status, clear]);

  useEffect(() => {
    if (!orderRef) { setLoading(false); return; }
    let cancelled = false;

    async function fetchOrder() {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-status?order_ref=${encodeURIComponent(orderRef)}`;
      const res = await fetch(url, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" },
      });
      const data = await res.json();
      if (!cancelled) {
        setOrder(data);
        setLoading(false);
      }
      return data;
    }

    fetchOrder().then((d) => {
      if (d?.status === "pending" && polls < 6) {
        setTimeout(() => setPolls((p) => p + 1), 2000);
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRef, polls]);

  if (loading) {
    return <div className="container-app py-20 text-center text-muted-foreground">Cargando estado de tu orden...</div>;
  }

  if (!order || order.error) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="font-display text-3xl font-black">Orden no encontrada</h1>
        <Button asChild className="mt-6"><Link to="/productos">Ir al catálogo</Link></Button>
      </div>
    );
  }

  const status = order.status as "pending" | "approved" | "rejected" | "voided";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isTopup = order.kind === "topup";

  return (
    <div className="container-app py-12 max-w-3xl">
      <div className="rounded-2xl border-gradient bg-gradient-card p-8 text-center">
        {isApproved ? (
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent animate-pulse-glow rounded-full" />
        ) : isRejected ? (
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
        ) : (
          <Clock className="mx-auto h-16 w-16 text-primary animate-pulse" />
        )}

        <h1 className="mt-6 font-display text-3xl md:text-4xl font-black">
          {isApproved && (isTopup ? "¡Saldo recargado! 💰" : "¡Gracias por tu compra! 🎮")}
          {isRejected && "Pago rechazado"}
          {!isApproved && !isRejected && "Procesando pago..."}
        </h1>

        {isApproved && isTopup && (
          <p className="mt-3 text-base text-foreground">
            Tu saldo se acreditó: <span className="font-bold text-gradient">{formatCOP((order.topup_amount_cop ?? 0) + (order.topup_bonus_cop ?? 0))}</span>
            {order.topup_bonus_cop > 0 && <> (incluye bono de {formatCOP(order.topup_bonus_cop)})</>}.
            <br />Úsalo en cualquier compra desde el carrito.
          </p>
        )}
        {isApproved && !isTopup && (
          <p className="mt-3 text-base text-foreground">
            Gracias por confiar en <span className="font-bold text-gradient">Easy Cheats</span>,
            el mejor distribuidor de hacks para móvil. Abajo tienes tus productos para descargar
            y volver a ver desde <Link to="/mis-ordenes" className="underline text-accent">Mis pedidos</Link>.
          </p>
        )}
        {isRejected && <p className="mt-3 text-muted-foreground">El pago no se completó. Puedes intentar nuevamente.</p>}
        {!isApproved && !isRejected && <p className="mt-3 text-muted-foreground">Estamos confirmando tu pago con Bold...</p>}

        <div className="mt-6 inline-flex flex-col gap-1 rounded-lg bg-secondary/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Orden</span>
          <span className="font-mono">{order.order_ref}</span>
          <span className="font-display text-xl font-black text-gradient">{formatCOP(order.amount_cop)}</span>
        </div>
      </div>

      {isApproved && !isTopup && <DeliverySection order={order} />}

      {isApproved && !isTopup && (
        <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-accent mb-3" />
          <h3 className="font-display text-xl font-bold">¿Necesitas ayuda o soporte para instalar?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Abre un ticket en nuestro Discord y nuestro equipo te ayudará paso a paso.
          </p>
          <Button asChild size="lg" className="mt-4 gap-2">
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer">
              <MessageCircle className="h-5 w-5" /> Abrir ticket en Discord
            </a>
          </Button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isTopup ? (
          <>
            <Button asChild variant="outline"><Link to="/recargar">Recargar más</Link></Button>
            <Button asChild><Link to="/productos">Ir a comprar</Link></Button>
          </>
        ) : (
          <>
            <Button asChild variant="outline"><Link to="/mis-ordenes"><ShoppingBag className="mr-2 h-4 w-4" /> Mis pedidos</Link></Button>
            <Button asChild><Link to="/productos">Seguir comprando</Link></Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Muestra claves, archivos de descarga y videos por producto. Reutilizable
 * en la página de éxito y en "Mis pedidos".
 */
export function DeliverySection({ order }: { order: any }) {
  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copiado al portapapeles");
  };

  const expired = !!order.access_expired;
  const accessUntil = order.access_until ? new Date(order.access_until) : null;

  // Separar keys de texto y archivos únicos
  const textKeysByProduct: Record<string, string[]> = {};
  const fileKeysByProduct: Record<string, Array<{ name: string; url: string | null }>> = {};
  for (const k of (order.delivered_keys ?? []) as Array<any>) {
    if (k.delivery_type === "file") {
      (fileKeysByProduct[k.product_id] ??= []).push({
        name: k.file_name ?? k.key_value ?? "Archivo",
        url: k.file_url ?? null,
      });
    } else {
      (textKeysByProduct[k.product_id] ??= []).push(k.key_value);
    }
  }

  const assets = (order.delivered_assets ?? []) as Array<{
    product_id: string; name: string;
    files: { name: string; url: string }[];
    videos: { name: string; url: string }[];
  }>;

  if (expired) {
    return (
      <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-center">
        <p className="font-bold">El acceso a esta compra expiró</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Contáctanos por Discord si necesitas recuperar tus archivos.
        </p>
      </div>
    );
  }

  if (assets.length === 0 && Object.keys(textKeysByProduct).length === 0 && Object.keys(fileKeysByProduct).length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Tus <span className="text-gradient">descargas</span></h2>
        {accessUntil && (
          <p className="text-xs text-muted-foreground">Acceso hasta {accessUntil.toLocaleDateString("es-CO")}</p>
        )}
      </div>

      {assets.map((d) => (
        <div key={d.product_id} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-display text-lg font-bold">{d.name}</h3>

          {(textKeysByProduct[d.product_id] ?? []).length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Claves de acceso</p>
              <div className="space-y-2">
                {textKeysByProduct[d.product_id].map((k, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded-md bg-background px-3 py-2 text-sm font-mono text-accent">{k}</code>
                    <Button size="icon" variant="outline" onClick={() => copy(k)}><Copy className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(fileKeysByProduct[d.product_id] ?? []).length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tu archivo personal</p>
              <div className="flex flex-wrap gap-2">
                {fileKeysByProduct[d.product_id].map((f, i) => (
                  f.url ? (
                    <Button key={i} asChild variant="default" className="gap-2">
                      <a href={f.url} target="_blank" rel="noreferrer" download>
                        <Download className="h-4 w-4" /> {f.name}
                      </a>
                    </Button>
                  ) : (
                    <span key={i} className="text-xs text-muted-foreground">{f.name} (no disponible)</span>
                  )
                ))}
              </div>
            </div>
          )}

          {d.files.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Archivos de descarga</p>
              <div className="flex flex-wrap gap-2">
                {d.files.map((f, i) => (
                  <Button key={i} asChild variant="default" className="gap-2">
                    <a href={f.url} target="_blank" rel="noreferrer" download>
                      <Download className="h-4 w-4" /> {f.name}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {d.videos.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Videos / enlaces</p>
              <div className="flex flex-col gap-2">
                {d.videos.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent hover:underline">
                    <PlayCircle className="h-4 w-4" /> {v.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

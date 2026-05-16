import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Check, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

interface Variant {
  id: string;
  name: string;
  price_cop: number;
  discount_percent: number;
  active: boolean;
  sort_order: number;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [p, setP] = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      setP(prod);
      if (prod) {
        const { data: vs } = await supabase
          .from("product_variants" as any)
          .select("*")
          .eq("product_id", prod.id)
          .eq("active", true)
          .order("sort_order", { ascending: true });
        const list = (vs ?? []) as unknown as Variant[];
        setVariants(list);
        if (list.length > 0) setSelectedVariantId(list[0].id);
      }
      setLoading(false);
    })();
  }, [slug]);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  if (loading) return <div className="container-app py-20 text-center text-muted-foreground">Cargando...</div>;
  if (!p) return (
    <div className="container-app py-20 text-center">
      <p className="text-muted-foreground">Producto no encontrado.</p>
      <Button asChild className="mt-4"><Link to="/productos">Ver catálogo</Link></Button>
    </div>
  );

  const features: string[] = Array.isArray(p.features) ? p.features : [];

  // Precio efectivo
  const basePrice = selected ? selected.price_cop : p.price_cop;
  const baseDiscount = selected ? selected.discount_percent : (p.discount_percent ?? 0);
  const finalPrice = baseDiscount > 0 ? Math.round(basePrice * (1 - baseDiscount / 100)) : basePrice;

  const itemForCart = () => ({
    product_id: p.id,
    variant_id: selected?.id ?? null,
    variant_name: selected?.name ?? null,
    slug: p.slug,
    name: selected ? `${p.name} — ${selected.name}` : p.name,
    price_cop: finalPrice,
    image_url: p.image_url,
  });

  return (
    <div className="container-app py-12">
      <Link to="/productos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-[16/12] overflow-hidden rounded-2xl border-gradient bg-secondary relative">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-grid grid place-items-center">
              <span className="font-display text-7xl font-black text-primary/20">
                {(p.game ?? "EC").slice(0, 3).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div>
          {p.game && <p className="text-sm font-bold uppercase tracking-widest text-accent">{p.game}</p>}
          <h1 className="mt-2 font-display text-4xl font-black">{p.name}</h1>
          {p.category && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold uppercase text-primary">
              <Tag className="h-3 w-3" /> {p.category}
            </span>
          )}

          <p className="mt-6 text-muted-foreground leading-relaxed">{p.description}</p>

          {features.length > 0 && (
            <ul className="mt-8 space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                </li>
              ))}
            </ul>
          )}

          {variants.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Elige una opción</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {variants.map((v) => {
                  const vFinal = v.discount_percent > 0
                    ? Math.round(v.price_cop * (1 - v.discount_percent / 100))
                    : v.price_cop;
                  const isSel = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`rounded-lg border p-3 text-left transition ${isSel ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/50"}`}
                    >
                      <p className="font-bold text-sm">{v.name}</p>
                      <p className="mt-1 font-display text-base font-black text-gradient">{format(vFinal)}</p>
                      {v.discount_percent > 0 && (
                        <p className="text-[10px] text-muted-foreground line-through">{format(v.price_cop)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl border-gradient bg-gradient-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Precio</p>
            <div className="flex items-baseline gap-3">
              <p className="font-display text-4xl font-black text-gradient">{format(finalPrice)}</p>
              {baseDiscount > 0 && (
                <p className="text-sm text-muted-foreground line-through">{format(basePrice)}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 shadow-glow"
                onClick={() => {
                  add(itemForCart());
                  toast.success("Agregado al carrito", { description: itemForCart().name });
                }}
              >
                <ShoppingCart className="h-5 w-5" /> Agregar al carrito
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  add(itemForCart());
                  navigate("/checkout");
                }}
              >
                Comprar ahora
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

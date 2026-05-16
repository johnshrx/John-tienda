import { Link } from "react-router-dom";
import { Tag, ArrowRight } from "lucide-react";
import { useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  game: string | null;
  category: string | null;
  price_cop: number;
  image_url: string | null;
  features: any;
  discount_percent?: number | null;
  variants?: Array<{ price_cop: number; discount_percent: number; active: boolean }> | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const { format } = useCurrency();
  const cardRef = useRef<HTMLElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  // Calcular rango de precios desde variantes activas (si existen)
  const activeVariants = (p.variants ?? []).filter((v) => v.active);
  const variantPrices = activeVariants.map((v) =>
    v.discount_percent > 0 ? Math.round(v.price_cop * (1 - v.discount_percent / 100)) : v.price_cop,
  );

  let priceLabel: string;
  let strikePrice: string | null = null;
  if (variantPrices.length > 0) {
    const min = Math.min(...variantPrices);
    const max = Math.max(...variantPrices);
    priceLabel = min === max ? format(min) : `${format(min)} – ${format(max)}`;
  } else {
    const discount = p.discount_percent ?? 0;
    const finalPrice = discount > 0 ? Math.round(p.price_cop * (1 - discount / 100)) : p.price_cop;
    priceLabel = format(finalPrice);
    if (discount > 0) strikePrice = format(p.price_cop);
  }

  const hasVariants = variantPrices.length > 0;

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="card-spotlight group relative overflow-hidden rounded-xl border-gradient bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1.5"
    >
      <div className="card-spotlight-layer pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link to={`/producto/${p.slug}`} className="block aspect-[16/10] overflow-hidden bg-secondary relative">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 bg-grid grid place-items-center">
            <span className="font-display text-5xl font-black text-primary/20">{(p.game ?? "EC").slice(0, 3).toUpperCase()}</span>
          </div>
        )}
        {p.category && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
            <Tag className="h-3 w-3" /> {p.category}
          </span>
        )}
      </Link>

      <div className="relative p-5">
        {p.game && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.game}</p>}
        <h3 className="mt-1 font-display text-lg font-bold leading-tight">
          <Link to={`/producto/${p.slug}`} className="hover:text-primary">{p.name}</Link>
        </h3>
        {p.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{hasVariants ? "Desde / hasta" : "Precio"}</p>
            <p className="font-display text-xl font-black text-gradient truncate">{priceLabel}</p>
            {strikePrice && <p className="text-xs text-muted-foreground line-through">{strikePrice}</p>}
          </div>
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link to={`/producto/${p.slug}`}>
              Ver opciones <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

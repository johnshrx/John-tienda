import { useEffect, useMemo, useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [q, setQ] = useState("");
  const [game, setGame] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, description, game, category, price_cop, image_url, features, discount_percent")
        .eq("active", true)
        .order("created_at", { ascending: false });
      const products = (data ?? []) as ProductCardData[];
      const ids = products.map((p) => p.id);
      if (ids.length > 0) {
        const { data: vs } = await supabase
          .from("product_variants" as any)
          .select("product_id, price_cop, discount_percent, active")
          .in("product_id", ids);
        const map = new Map<string, any[]>();
        (vs ?? []).forEach((v: any) => {
          const arr = map.get(v.product_id) ?? [];
          arr.push(v); map.set(v.product_id, arr);
        });
        products.forEach((p) => { p.variants = map.get(p.id) ?? []; });
      }
      setProducts(products);
    })();
  }, []);

  const games = useMemo(
    () => Array.from(new Set(products.map((p) => p.game).filter(Boolean))) as string[],
    [products],
  );

  const filtered = products.filter((p) => {
    const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.description?.toLowerCase().includes(q.toLowerCase());
    const matchG = game === "all" || p.game === game;
    return matchQ && matchG;
  });

  return (
    <div className="container-app py-12">
      <header className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Catálogo completo</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-black">Todos los <span className="text-gradient">cheats</span></h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Filtra por juego o busca por nombre. Todos nuestros productos incluyen actualizaciones y soporte.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={game === "all"} onClick={() => setGame("all")}>Todos</FilterChip>
          {games.map((g) => (
            <FilterChip key={g} active={game === g} onClick={() => setGame(g)}>{g}</FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No se encontraron productos.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

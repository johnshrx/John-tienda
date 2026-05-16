import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Lock, Headphones, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero.jpg";

export default function HomePage() {
  const [featured, setFeatured] = useState<ProductCardData[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, description, game, category, price_cop, image_url, features, discount_percent")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(6);
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
      setFeatured(products);
    })();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" aria-hidden className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>

        <div className="container-app py-20 md:py-32 lg:py-40">
          <div className="max-w-3xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Indetectable · Actualizado a diario
            </span>

            <h1 className="mt-6 font-display text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
              Domina cada partida con <span className="text-gradient">cheats premium</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              La tienda digital #1 para gamers competitivos. Aimbots, wallhacks, mod menus y
              más, con entrega instantánea de claves al pagar.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2 shadow-glow">
                <Link to="/productos">
                  Ver catálogo <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="#como-funciona">Cómo funciona</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4 fill-accent text-accent" /> 4.9/5 — +12.000 clientes
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" /> Pago seguro con Bold
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="como-funciona" className="container-app py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: Zap, title: "Entrega instantánea", desc: "Recibe tu clave o archivo al instante después de pagar." },
            { icon: Shield, title: "100% indetectable", desc: "Bypass actualizado contra los anti-cheat más estrictos." },
            { icon: Lock, title: "Pago protegido", desc: "Procesado por Bold, con cifrado de extremo a extremo." },
            { icon: Headphones, title: "Soporte 24/7", desc: "Equipo de gamers listo para ayudarte cuando lo necesites." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border-gradient bg-gradient-card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="container-app py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Catálogo</p>
            <h2 className="font-display text-3xl md:text-4xl font-black">Productos destacados</h2>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/productos">Ver todo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}

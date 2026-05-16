/**
 * Panel de administración: gestión de productos, claves de inventario y órdenes.
 * Solo accesible para usuarios con rol 'admin'.
 */
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, KeySquare, TrendingUp, Package, ShoppingBag, DollarSign, Gift, Copy } from "lucide-react";
import { formatCOP } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="container-app py-20 text-center text-muted-foreground">Cargando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="container-app py-20 text-center">
      <h1 className="font-display text-3xl font-black">Acceso restringido</h1>
      <p className="mt-3 text-muted-foreground">
        Solo administradores. Pide a otro admin que te otorgue rol o asigna el rol manualmente desde la base de datos.
      </p>
      <Button asChild className="mt-6"><Link to="/">Volver al inicio</Link></Button>
    </div>
  );

  return (
    <div className="container-app py-12">
      <h1 className="font-display text-4xl font-black">Panel <span className="text-gradient">admin</span></h1>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
          <TabsTrigger value="giftcards">Gift Cards</TabsTrigger>
          <TabsTrigger value="topups">Recargas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><AdminOverview /></TabsContent>
        <TabsContent value="products"><AdminProducts /></TabsContent>
        <TabsContent value="orders"><AdminOrders /></TabsContent>
        <TabsContent value="giftcards"><AdminGiftCards /></TabsContent>
        <TabsContent value="topups"><AdminTopups /></TabsContent>
      </Tabs>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [keysFor, setKeysFor] = useState<string | null>(null);

  const load = () =>
    supabase.from("products").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setProducts(data ?? []));

  useEffect(() => { load(); }, []);

  async function save(form: HTMLFormElement, files: Array<{ name: string; path: string }>) {
    const fd = new FormData(form);
    const payload = {
      slug: String(fd.get("slug")),
      name: String(fd.get("name")),
      description: String(fd.get("description")),
      game: String(fd.get("game")),
      category: String(fd.get("category")),
      price_cop: parseInt(String(fd.get("price_cop")) || "0", 10),
      discount_percent: Math.max(0, Math.min(95, parseInt(String(fd.get("discount_percent")) || "0", 10))),
      image_url: (String(fd.get("image_url")) || null) as any,
      features: String(fd.get("features")).split("\n").map((s) => s.trim()).filter(Boolean),
      active: fd.get("active") === "on",
      requires_key: fd.get("requires_key") === "on",
      delivery_files: files,
      delivery_videos: parseVideoLines(String(fd.get("delivery_videos") ?? "")),
    };
    let resp;
    if (editing?.id) resp = await supabase.from("products").update(payload).eq("id", editing.id);
    else resp = await supabase.from("products").insert(payload);

    if (resp.error) toast.error("Error al guardar", { description: resp.error.message });
    else { toast.success("Guardado"); setEditing(null); load(); }
  }

  /** "Nombre | https://url" por línea */
  function parseVideoLines(s: string) {
    return s.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [name, url] = l.split("|").map((x) => x.trim());
      return { name: name || "Video", url: url || name };
    });
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-bold">Catálogo ({products.length})</h2>
          <Button size="sm" onClick={() => setEditing({})} className="gap-2"><Plus className="h-4 w-4" /> Nuevo</Button>
        </div>
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="font-bold truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.game} · {formatCOP(p.price_cop)} · {p.active ? "Activo" : "Inactivo"}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setKeysFor(p.id)} title="Claves de inventario"><KeySquare className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div>
        {editing !== null ? (
          <ProductEditor product={editing} onSave={save} onCancel={() => setEditing(null)} />
        ) : keysFor ? (
          <KeysManager productId={keysFor} onClose={() => setKeysFor(null)} />
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona un producto o crea uno nuevo.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Formulario de producto con pestañas: General + Entrega/Email.
 */
function ProductEditor({
  product, onSave, onCancel,
}: {
  product: any;
  onSave: (f: HTMLFormElement, files: Array<{ name: string; path: string }>) => void;
  onCancel: () => void;
}) {
  const [files, setFiles] = useState<Array<{ name: string; path: string }>>(product.delivery_files ?? []);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(product.image_url ?? "");
  const [uploadingImage, setUploadingImage] = useState(false);

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    setUploadingImage(false);
    e.target.value = "";
    if (error) return toast.error("Error subiendo imagen", { description: error.message });
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    if (product.id) {
      await supabase.from("products").update({ image_url: data.publicUrl }).eq("id", product.id);
    }
    toast.success("Imagen actualizada");
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${product.id ?? "new"}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-deliverables").upload(path, file, {
      upsert: false,
    });
    setUploading(false);
    e.target.value = "";
    if (error) return toast.error("Error subiendo archivo", { description: error.message });
    const next = [...files, { name: file.name, path }];
    setFiles(next);
    if (product.id) {
      await supabase.from("products").update({ delivery_files: next }).eq("id", product.id);
    }
    toast.success("Archivo subido");
  }

  async function removeFile(idx: number) {
    const f = files[idx];
    await supabase.storage.from("product-deliverables").remove([f.path]).catch(() => {});
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    if (product.id) await supabase.from("products").update({ delivery_files: next }).eq("id", product.id);
  }

  function renameFile(idx: number, name: string) {
    const next = files.map((f, i) => (i === idx ? { ...f, name } : f));
    setFiles(next);
    if (product.id) supabase.from("products").update({ delivery_files: next }).eq("id", product.id);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(e.currentTarget, files);
      }}
      className="rounded-xl border-gradient bg-gradient-card p-5 space-y-3 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      <h3 className="font-display text-lg font-bold">{product.id ? "Editar" : "Nuevo"} producto</h3>

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="delivery">Entrega</TabsTrigger>
        </TabsList>

        <TabsContent forceMount value="general" className="space-y-3 mt-3 data-[state=inactive]:hidden">
          <Field label="Slug (único)" name="slug" def={product.slug} />
          <Field label="Nombre" name="name" def={product.name} />
          <Field label="Juego" name="game" def={product.game} />
          <Field label="Categoría" name="category" def={product.category} />
          <Field label="Precio (COP)" name="price_cop" type="number" def={product.price_cop} />
          <Field label="Descuento (%)" name="discount_percent" type="number" def={product.discount_percent ?? 0} />
          <div>
            <Label>Imagen del producto</Label>
            <div className="mt-1 flex items-start gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-20 w-20 rounded-md object-cover border border-border" />
              ) : (
                <div className="h-20 w-20 rounded-md bg-secondary/50 grid place-items-center text-xs text-muted-foreground">Sin imagen</div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadImage}
                  disabled={uploadingImage}
                  className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:cursor-pointer"
                />
                <Input
                  name="image_url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="O pega una URL https://..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea name="description" defaultValue={product.description ?? ""} rows={3} />
          </div>
          <div>
            <Label>Características (una por línea)</Label>
            <Textarea name="features" defaultValue={(product.features ?? []).join("\n")} rows={4} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={product.active ?? true} /> Activo
          </label>
        </TabsContent>

        <TabsContent forceMount value="variants" className="space-y-3 mt-3 data-[state=inactive]:hidden">
          {product.id ? (
            <VariantsEditor productId={product.id} />
          ) : (
            <p className="text-sm text-amber-400">⚠️ Guarda el producto primero para configurar variantes.</p>
          )}
        </TabsContent>

        <TabsContent forceMount value="delivery" className="space-y-4 mt-3 data-[state=inactive]:hidden">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="requires_key" defaultChecked={product.requires_key ?? true} />
            Este producto requiere entregar una clave única (key)
          </label>

          <div>
            <Label>Archivos descargables</Label>
            <p className="text-xs text-muted-foreground mb-2">Sube archivos. El "nombre" es el texto que verá el cliente en el botón de descarga.</p>
            {!product.id && (
              <p className="text-xs text-amber-400 mb-2">⚠️ Guarda el producto antes de subir archivos.</p>
            )}
            <input
              type="file"
              onChange={uploadFile}
              disabled={uploading || !product.id}
              className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:cursor-pointer"
            />
            <div className="mt-2 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-secondary/50 px-2 py-1.5">
                  <Input
                    value={f.name}
                    onChange={(e) => renameFile(i, e.target.value)}
                    placeholder="Nombre del botón"
                    className="h-8 text-xs flex-1"
                  />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={f.path}>{f.path.split("/").pop()}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-destructive text-lg leading-none px-1">×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Enlaces y videos (uno por línea, formato: <code>Nombre del botón | URL</code>)</Label>
            <p className="text-xs text-muted-foreground mb-2">Sirve para videos de YouTube, enlaces de Mega/Drive, tutoriales, etc.</p>
            <Textarea
              name="delivery_videos"
              defaultValue={(product.delivery_videos ?? []).map((v: any) => `${v.name} | ${v.url}`).join("\n")}
              rows={4}
              placeholder="Tutorial instalación | https://youtu.be/...&#10;Descarga MEGA | https://mega.nz/..."
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button type="submit" className="flex-1">Guardar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

function Field({ label, name, def, type = "text" }: { label: string; name: string; def?: any; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input name={name} type={type} defaultValue={def ?? ""} required={!["image_url", "discount_percent"].includes(name)} />
    </div>
  );
}

/**
 * Resumen ejecutivo: total ventas (solo pagadas), número de órdenes,
 * productos activos y ventas recientes.
 */
function AdminOverview() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidOrders: 0,
    pendingOrders: 0,
    activeProducts: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("amount_cop, status, created_at, order_ref, buyer_email"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
      ]);
      const orders = ordersRes.data ?? [];
      const paid = orders.filter((o: any) => o.status === "approved");
      setStats({
        totalRevenue: paid.reduce((sum: number, o: any) => sum + (o.amount_cop || 0), 0),
        paidOrders: paid.length,
        pendingOrders: orders.filter((o: any) => o.status === "pending").length,
        activeProducts: productsRes.count ?? 0,
      });
      setRecent(
        [...orders]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8),
      );
    })();
  }, []);

  const cards = [
    { icon: DollarSign, label: "Ventas totales", value: formatCOP(stats.totalRevenue), accent: true },
    { icon: ShoppingBag, label: "Órdenes pagadas", value: stats.paidOrders.toString() },
    { icon: TrendingUp, label: "Órdenes pendientes", value: stats.pendingOrders.toString() },
    { icon: Package, label: "Productos activos", value: stats.activeProducts.toString() },
  ];

  return (
    <div className="mt-6 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border-gradient bg-gradient-card p-5 ${c.accent ? "shadow-glow" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <c.icon className={`h-4 w-4 ${c.accent ? "text-accent" : "text-primary"}`} />
            </div>
            <p className={`mt-2 font-display text-2xl font-black ${c.accent ? "text-gradient" : ""}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-xl font-bold mb-4">Ventas recientes</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay ventas registradas.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((o: any) => (
              <div key={o.order_ref} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs truncate">{o.order_ref}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("es-CO")} · {o.buyer_email ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-gradient">{formatCOP(o.amount_cop)}</p>
                  <p className={`text-[10px] uppercase tracking-wider ${o.status === "approved" ? "text-accent" : "text-muted-foreground"}`}>{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CurrencySettings />
    </div>
  );
}

/**
 * Configuración de moneda visible en la tienda. Cambia entre COP y USD
 * y permite ajustar la tasa de conversión que se usa solo para mostrar
 * los precios (el cobro real con Bold sigue siendo en COP).
 */
function CurrencySettings() {
  const { currency, setCurrency, rateUsdToCop, setRate, accessWindowDays, setAccessWindowDays } = useCurrency();
  const [draftRate, setDraftRate] = useState(rateUsdToCop);
  const [draftDays, setDraftDays] = useState(accessWindowDays);

  useEffect(() => { setDraftRate(rateUsdToCop); }, [rateUsdToCop]);
  useEffect(() => { setDraftDays(accessWindowDays); }, [accessWindowDays]);

  return (
    <div className="rounded-xl border-gradient bg-gradient-card p-5 space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Moneda de la tienda</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige cómo se muestran los precios. El cobro real con Bold siempre se procesa en COP.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider">Mostrar en</Label>
            <div className="mt-1 inline-flex rounded-md border border-border bg-background p-0.5">
              <button
                onClick={async () => { await setCurrency("COP"); toast.success("Moneda: COP"); }}
                className={`px-3 py-1.5 text-sm font-bold rounded-sm ${currency === "COP" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >COP</button>
              <button
                onClick={async () => { await setCurrency("USD"); toast.success("Moneda: USD"); }}
                className={`px-3 py-1.5 text-sm font-bold rounded-sm ${currency === "USD" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >USD</button>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Tasa: 1 USD =</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input type="number" min={100} step={50} value={draftRate}
                onChange={(e) => setDraftRate(Number(e.target.value))} className="w-32" />
              <span className="text-sm text-muted-foreground">COP</span>
              <Button size="sm" onClick={async () => { await setRate(draftRate); toast.success("Tasa actualizada"); }}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="font-display text-xl font-bold">Ventana de acceso a descargas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Días que el cliente podrá volver a ver y descargar sus productos desde "Mis pedidos" tras la compra.
        </p>
        <div className="mt-4 flex items-end gap-2">
          <div>
            <Label className="text-xs uppercase tracking-wider">Días</Label>
            <Input type="number" min={1} max={3650} value={draftDays}
              onChange={(e) => setDraftDays(Number(e.target.value))} className="w-32 mt-1" />
          </div>
          <Button size="sm" onClick={async () => { await setAccessWindowDays(draftDays); toast.success("Ventana actualizada"); }}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

function KeysManager({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [bulk, setBulk] = useState("");
  const [targetVariant, setTargetVariant] = useState<string>(""); // "" = base producto
  const [uploadingFile, setUploadingFile] = useState(false);

  const load = async () => {
    const { data: ks } = await supabase.from("product_keys").select("*")
      .eq("product_id", productId).order("created_at", { ascending: false });
    setKeys(ks ?? []);
    const { data: vs } = await supabase.from("product_variants" as any).select("id, name")
      .eq("product_id", productId).order("sort_order");
    setVariants((vs ?? []) as any[]);
  };
  useEffect(() => { load(); }, [productId]);

  async function add() {
    const list = bulk.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!list.length) return;
    const payload = list.map((k) => ({
      product_id: productId,
      variant_id: targetVariant || null,
      key_value: k,
      delivery_type: "text",
    }));
    const { error } = await supabase.from("product_keys").insert(payload);
    if (error) toast.error(error.message); else { setBulk(""); load(); toast.success(`${list.length} claves agregadas`); }
  }

  /** Sube uno o varios archivos: cada archivo se vuelve una "key" única.
   *  Al ser entregado, no se entregará a otro cliente (igual que las keys de texto). */
  async function uploadUniqueFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingFile(true);
    const rows: any[] = [];
    for (const file of files) {
      const path = `${productId}/uniq/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${file.name}`;
      const { error } = await supabase.storage.from("product-deliverables").upload(path, file);
      if (error) { toast.error(`Error subiendo ${file.name}: ${error.message}`); continue; }
      rows.push({
        product_id: productId,
        variant_id: targetVariant || null,
        key_value: file.name,
        delivery_type: "file",
        file_path: path,
        file_name: file.name,
      });
    }
    if (rows.length) {
      const { error } = await supabase.from("product_keys").insert(rows);
      if (error) toast.error(error.message); else toast.success(`${rows.length} archivo(s) únicos agregados`);
    }
    setUploadingFile(false);
    e.target.value = "";
    load();
  }

  async function del(id: string) {
    const k = keys.find((x) => x.id === id);
    if (k?.file_path) await supabase.storage.from("product-deliverables").remove([k.file_path]).catch(() => {});
    await supabase.from("product_keys").delete().eq("id", id);
    load();
  }

  const available = keys.filter((k) => !k.delivered).length;
  const variantName = (vid: string | null) =>
    !vid ? "Base" : variants.find((v) => v.id === vid)?.name ?? "—";

  return (
    <div className="rounded-xl border-gradient bg-gradient-card p-5 sticky top-20">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-lg font-bold">Inventario único (keys + archivos)</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>×</Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{available} disponibles · {keys.length} totales</p>

      <div className="mt-4 space-y-2">
        <Label>Asignar a</Label>
        <select
          value={targetVariant}
          onChange={(e) => setTargetVariant(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Producto base (sin variante)</option>
          {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>

        <Label className="mt-2">Texto (claves) — una por línea</Label>
        <Textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY" />
        <Button size="sm" onClick={add}>Guardar claves</Button>

        <div className="border-t border-border pt-3 mt-3">
          <Label>Archivos únicos (uno por cliente)</Label>
          <p className="text-xs text-muted-foreground mb-1">Cada archivo se entregará a un solo cliente y no se reutilizará.</p>
          <input
            type="file"
            multiple
            onChange={uploadUniqueFiles}
            disabled={uploadingFile}
            className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-4 max-h-72 overflow-auto space-y-1">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-2 text-xs rounded bg-secondary/50 px-2 py-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-10 shrink-0">
              {k.delivery_type === "file" ? "📎" : "🔑"}
            </span>
            <code className="truncate font-mono flex-1" title={k.file_name ?? k.key_value}>
              {k.file_name ?? k.key_value}
            </code>
            <span className="text-[10px] text-muted-foreground">{variantName(k.variant_id)}</span>
            <span className={k.delivered ? "text-muted-foreground" : "text-accent"}>{k.delivered ? "entregada" : "libre"}</span>
            <button onClick={() => del(k.id)} className="text-destructive">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  return (
    <div className="mt-6 space-y-3">
      <h2 className="font-display text-xl font-bold">Últimas órdenes ({orders.length})</h2>
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-mono text-xs">{o.order_ref}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("es-CO")} · {o.buyer_email ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-gradient">{formatCOP(o.amount_cop)}</p>
              <p className="text-xs uppercase tracking-wider">{o.status}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * Editor de variantes de un producto
 * ============================================================ */
function VariantsEditor({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("product_variants" as any)
      .select("*").eq("product_id", productId).order("sort_order");
    setVariants((data ?? []) as any[]);
  };
  useEffect(() => { load(); }, [productId]);

  async function addVariant() {
    setLoading(true);
    const { error } = await supabase.from("product_variants" as any).insert({
      product_id: productId, name: "Nueva opción", price_cop: 0,
      sort_order: variants.length, requires_key: true,
    });
    setLoading(false);
    if (error) toast.error(error.message); else load();
  }
  async function updateVariant(id: string, patch: any) {
    const { error } = await supabase.from("product_variants" as any).update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }
  async function delVariant(id: string) {
    if (!confirm("¿Eliminar esta variante? También borrará sus claves.")) return;
    await supabase.from("product_variants" as any).delete().eq("id", id);
    load();
  }
  async function uploadVariantFile(variantId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${productId}/v/${variantId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-deliverables").upload(path, file);
    e.target.value = "";
    if (error) return toast.error(error.message);
    const v = variants.find((x) => x.id === variantId);
    const next = [...(v?.delivery_files ?? []), { name: file.name, path }];
    await updateVariant(variantId, { delivery_files: next });
    load();
    toast.success("Archivo subido");
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Si el producto no tiene variantes, se usa el precio base. Si las tiene, el cliente debe elegir una.
        </p>
        <Button size="sm" onClick={addVariant} disabled={loading} className="gap-1">
          <Plus className="h-3 w-3" /> Agregar
        </Button>
      </div>

      {variants.length === 0 && <p className="text-sm text-muted-foreground italic">Sin variantes configuradas.</p>}

      {variants.map((v, idx) => (
        <details key={v.id} open={idx === variants.length - 1} className="rounded-lg border border-border bg-card/50 p-3">
          <summary className="flex items-center justify-between cursor-pointer text-sm font-bold">
            <span>{v.name || "(sin nombre)"} — {formatCOP(v.price_cop)}</span>
            <button onClick={(e) => { e.preventDefault(); delVariant(v.id); }} className="text-destructive text-lg leading-none px-2">×</button>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Nombre (ej: 7 días)</Label>
              <Input defaultValue={v.name} onBlur={(e) => updateVariant(v.id, { name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Precio (COP)</Label>
              <Input type="number" defaultValue={v.price_cop} onBlur={(e) => updateVariant(v.id, { price_cop: parseInt(e.target.value || "0", 10) })} />
            </div>
            <div>
              <Label className="text-xs">Descuento (%)</Label>
              <Input type="number" defaultValue={v.discount_percent} onBlur={(e) => updateVariant(v.id, { discount_percent: Math.max(0, Math.min(95, parseInt(e.target.value || "0", 10))) })} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={v.active} onChange={(e) => updateVariant(v.id, { active: e.target.checked })} /> Activa
            </label>
            <label className="col-span-2 flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={v.requires_key} onChange={(e) => updateVariant(v.id, { requires_key: e.target.checked })} /> Requiere entregar clave única
            </label>
            <div className="col-span-2">
              <Label className="text-xs">Archivos de esta variante</Label>
              <input
                type="file"
                onChange={(e) => uploadVariantFile(v.id, e)}
                className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:cursor-pointer"
              />
              <div className="mt-2 space-y-1">
                {(v.delivery_files ?? []).map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs rounded bg-secondary/50 px-2 py-1">
                    <Input
                      defaultValue={f.name}
                      className="h-7 text-xs"
                      onBlur={(e) => {
                        const next = (v.delivery_files ?? []).map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x);
                        updateVariant(v.id, { delivery_files: next });
                      }}
                    />
                    <button
                      onClick={async () => {
                        await supabase.storage.from("product-deliverables").remove([f.path]).catch(() => {});
                        const next = (v.delivery_files ?? []).filter((_: any, j: number) => j !== i);
                        await updateVariant(v.id, { delivery_files: next });
                        load();
                      }}
                      className="text-destructive"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Enlaces / videos (Nombre | URL por línea)</Label>
              <Textarea
                rows={2}
                defaultValue={(v.delivery_videos ?? []).map((x: any) => `${x.name} | ${x.url}`).join("\n")}
                onBlur={(e) => {
                  const lines = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
                    const [name, url] = l.split("|").map((x) => x.trim());
                    return { name: name || "Enlace", url: url || name };
                  });
                  updateVariant(v.id, { delivery_videos: lines });
                }}
              />
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ============================================================
 * Gestión de Gift Cards
 * ============================================================ */
function AdminGiftCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [amount, setAmount] = useState(50000);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () =>
    supabase.from("gift_cards" as any).select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setCards((data ?? []) as any[]));
  useEffect(() => { load(); }, []);

  function genCode() {
    const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `EC-${seg()}-${seg()}-${seg()}`;
  }

  async function create() {
    if (amount < 1000) return toast.error("Monto mínimo: $1.000 COP");
    setCreating(true);
    const rows = Array.from({ length: count }).map(() => ({
      code: genCode(), initial_amount_cop: amount, balance_cop: amount,
      note: note || null, status: "active",
    }));
    const { error } = await supabase.from("gift_cards" as any).insert(rows);
    setCreating(false);
    if (error) toast.error(error.message);
    else { toast.success(`${count} gift card(s) creadas`); setNote(""); load(); }
  }

  async function disable(id: string) {
    await supabase.from("gift_cards" as any).update({ status: "disabled" }).eq("id", id);
    load();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado");
  }

  const statusColor = (s: string) =>
    s === "active" ? "text-accent" : s === "redeemed" ? "text-muted-foreground" : "text-destructive";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="rounded-xl border-gradient bg-gradient-card p-5 sticky top-20">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Gift className="h-4 w-4 text-accent" /> Generar gift cards
          </h3>
          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-xs">Monto por tarjeta (COP)</Label>
              <Input type="number" min={1000} step={1000} value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} />
            </div>
            <div>
              <Label className="text-xs">Cantidad</Label>
              <Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value || "1", 10))))} />
            </div>
            <div>
              <Label className="text-xs">Nota (opcional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sorteo Discord, regalo, etc." />
            </div>
            <Button className="w-full" onClick={create} disabled={creating}>Generar</Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-display text-lg font-bold mb-3">Tarjetas creadas ({cards.length})</h3>
        <div className="space-y-2">
          {cards.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay gift cards.</p>}
          {cards.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs truncate">{c.code}</code>
                  <button onClick={() => copy(c.code)} className="text-muted-foreground hover:text-primary"><Copy className="h-3 w-3" /></button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCOP(c.initial_amount_cop)} · saldo {formatCOP(c.balance_cop)}
                  {c.note ? ` · ${c.note}` : ""}
                  {c.redeemed_at ? ` · canjeada ${new Date(c.redeemed_at).toLocaleDateString("es-CO")}` : ""}
                </p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider ${statusColor(c.status)}`}>{c.status}</span>
              {c.status === "active" && (
                <Button size="sm" variant="ghost" onClick={() => disable(c.id)}>Desactivar</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Paquetes de recarga de saldo (con bonos)
 * ============================================================ */
function AdminTopups() {
  const [packages, setPackages] = useState<any[]>([]);
  const [amount, setAmount] = useState(50000);
  const [bonus, setBonus] = useState(0);
  const [label, setLabel] = useState("");

  const load = () =>
    supabase.from("topup_packages" as any).select("*").order("sort_order")
      .then(({ data }) => setPackages((data ?? []) as any[]));
  useEffect(() => { load(); }, []);

  async function create() {
    if (amount < 1000) return toast.error("Monto mínimo: $1.000 COP");
    const { error } = await supabase.from("topup_packages" as any).insert({
      amount_cop: amount, bonus_cop: bonus, label: label || null,
      sort_order: packages.length, active: true,
    });
    if (error) toast.error(error.message);
    else { toast.success("Paquete creado"); setLabel(""); load(); }
  }

  async function update(id: string, patch: any) {
    const { error } = await supabase.from("topup_packages" as any).update(patch).eq("id", id);
    if (error) toast.error(error.message); else load();
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar paquete?")) return;
    await supabase.from("topup_packages" as any).delete().eq("id", id);
    load();
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="rounded-xl border-gradient bg-gradient-card p-5 sticky top-20">
          <h3 className="font-display text-lg font-bold">Nuevo paquete</h3>
          <p className="mt-1 text-xs text-muted-foreground">Ej: pagas $100.000 → recibes $150.000 de saldo (bono $50.000).</p>
          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-xs">Monto a pagar (COP)</Label>
              <Input type="number" min={1000} step={1000} value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} />
            </div>
            <div>
              <Label className="text-xs">Bono extra (COP)</Label>
              <Input type="number" min={0} step={1000} value={bonus} onChange={(e) => setBonus(parseInt(e.target.value || "0", 10))} />
              <p className="mt-1 text-xs text-muted-foreground">Saldo total que recibe: {formatCOP(amount + bonus)}</p>
            </div>
            <div>
              <Label className="text-xs">Etiqueta (opcional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="¡Más popular!" />
            </div>
            <Button className="w-full" onClick={create}>Crear paquete</Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-display text-lg font-bold mb-3">Paquetes ({packages.length})</h3>
        <div className="space-y-2">
          {packages.length === 0 && <p className="text-sm text-muted-foreground">Sin paquetes. Crea uno para que tus clientes recarguen saldo.</p>}
          {packages.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                <div>
                  <Label className="text-xs">Monto</Label>
                  <Input type="number" defaultValue={p.amount_cop} onBlur={(e) => update(p.id, { amount_cop: parseInt(e.target.value || "0", 10) })} />
                </div>
                <div>
                  <Label className="text-xs">Bono</Label>
                  <Input type="number" defaultValue={p.bonus_cop} onBlur={(e) => update(p.id, { bonus_cop: parseInt(e.target.value || "0", 10) })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Etiqueta</Label>
                  <Input defaultValue={p.label ?? ""} onBlur={(e) => update(p.id, { label: e.target.value || null })} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" defaultChecked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} /> Activo
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => del(p.id)} className="text-destructive">×</Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Cliente paga {formatCOP(p.amount_cop)} → recibe {formatCOP(p.amount_cop + (p.bonus_cop || 0))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

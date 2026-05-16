/**
 * Carrito de compras con soporte de variantes (line key = product_id + variant_id).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  variant_id: string | null;
  variant_name?: string | null;
  slug: string;
  name: string;
  price_cop: number;
  image_url: string | null;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (lineKey: string) => void;
  setQty: (lineKey: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
  keyOf: (i: { product_id: string; variant_id: string | null }) => string;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "easycheats:cart:v2";

const keyOf = (i: { product_id: string; variant_id: string | null }) =>
  `${i.product_id}::${i.variant_id ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const k = keyOf(item);
      const existing = prev.find((p) => keyOf(p) === k);
      if (existing) {
        return prev.map((p) =>
          keyOf(p) === k ? { ...p, qty: Math.min(10, p.qty + qty) } : p,
        );
      }
      return [...prev, { ...item, qty, variant_id: item.variant_id ?? null }];
    });
  };

  const remove: CartCtx["remove"] = (k) => setItems((p) => p.filter((i) => keyOf(i) !== k));
  const setQty: CartCtx["setQty"] = (k, qty) =>
    setItems((p) => p.map((i) => (keyOf(i) === k ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i)));
  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price_cop * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count, keyOf }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

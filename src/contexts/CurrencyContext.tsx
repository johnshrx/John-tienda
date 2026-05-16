/**
 * Contexto de moneda. La tienda almacena precios en COP en la BD.
 * El ADMIN elige (desde el panel) qué moneda mostrar a TODOS los clientes
 * y la tasa USD→COP. La configuración se guarda en `store_settings` (BD)
 * para que sea global y consistente para todos los visitantes.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Currency = "COP" | "USD";

interface CurrencyCtx {
  currency: Currency;
  rateUsdToCop: number;
  accessWindowDays: number;
  /** Solo el admin debe usar estos setters. Persisten en BD. */
  setCurrency: (c: Currency) => Promise<void>;
  setRate: (r: number) => Promise<void>;
  setAccessWindowDays: (d: number) => Promise<void>;
  toDisplay: (cop: number) => number;
  format: (cop: number) => string;
  loaded: boolean;
}

const Ctx = createContext<CurrencyCtx | null>(null);
const DEFAULT_RATE = 4000;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("COP");
  const [rateUsdToCop, setRateState] = useState<number>(DEFAULT_RATE);
  const [accessWindowDays, setAccessWindowDaysState] = useState<number>(30);
  const [loaded, setLoaded] = useState(false);

  // Carga inicial + suscripción a cambios de la fila singleton
  useEffect(() => {
    let active = true;
    supabase
      .from("store_settings")
      .select("currency, rate_usd_to_cop, access_window_days")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!active) return;
        if (data?.currency === "USD" || data?.currency === "COP") setCurrencyState(data.currency);
        if (data?.rate_usd_to_cop) setRateState(Number(data.rate_usd_to_cop));
        if (data?.access_window_days) setAccessWindowDaysState(Number(data.access_window_days));
        setLoaded(true);
      });

    const channel = supabase
      .channel("store_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        (payload: any) => {
          const row = payload.new ?? payload.record;
          if (!row) return;
          if (row.currency === "USD" || row.currency === "COP") setCurrencyState(row.currency);
          if (row.rate_usd_to_cop) setRateState(Number(row.rate_usd_to_cop));
          if (row.access_window_days) setAccessWindowDaysState(Number(row.access_window_days));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    await supabase.from("store_settings").update({ currency: c, updated_at: new Date().toISOString() }).eq("id", 1);
  };

  const setRate = async (r: number) => {
    const v = r > 0 ? r : DEFAULT_RATE;
    setRateState(v);
    await supabase.from("store_settings").update({ rate_usd_to_cop: v, updated_at: new Date().toISOString() }).eq("id", 1);
  };

  const setAccessWindowDays = async (d: number) => {
    const v = Math.max(1, Math.min(3650, Math.floor(d || 0)));
    setAccessWindowDaysState(v);
    await supabase.from("store_settings").update({ access_window_days: v, updated_at: new Date().toISOString() } as any).eq("id", 1);
  };

  const toDisplay = (cop: number) => (currency === "USD" ? cop / rateUsdToCop : cop);

  const format = (cop: number) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 2,
      }).format(cop / rateUsdToCop);
    }
    return new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP", maximumFractionDigits: 0,
    }).format(cop);
  };

  return (
    <Ctx.Provider value={{ currency, rateUsdToCop, accessWindowDays, setCurrency, setRate, setAccessWindowDays, toDisplay, format, loaded }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency debe usarse dentro de CurrencyProvider");
  return ctx;
}

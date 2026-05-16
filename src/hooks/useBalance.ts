/**
 * Hook que carga el saldo del usuario autenticado y se mantiene
 * actualizado vía Realtime cuando cambia su fila en `user_balances`.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  async function load(uid: string) {
    const { data } = await supabase
      .from("user_balances" as any)
      .select("balance_cop").eq("user_id", uid).maybeSingle();
    setBalance(Number((data as any)?.balance_cop ?? 0));
    setLoaded(true);
  }

  useEffect(() => {
    if (!user) { setBalance(0); setLoaded(true); return; }
    load(user.id);
    const channel = supabase.channel(`balance-${user.id}-${Math.random().toString(36).slice(2, 8)}`);
    channel
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "user_balances", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const row = payload.new ?? payload.record;
          if (row) setBalance(Number(row.balance_cop ?? 0));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return { balance, loaded, reload: () => user && load(user.id) };
}

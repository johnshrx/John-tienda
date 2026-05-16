import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut, LayoutDashboard, LogIn, Wallet } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { BrandText } from "@/components/BrandText";
import { DISCORD_INVITE } from "@/config/site";
import logo from "@/assets/logo.png";

export function Header() {
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { balance } = useBalance();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold uppercase tracking-wider transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" aria-label="Easy Cheats">
          <img
            src={logo}
            alt="Easy Cheats"
            className="h-10 w-10 rounded-lg object-cover shadow-glow"
          />
          <BrandText className="text-lg sm:text-xl" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={linkCls}>Inicio</NavLink>
          <NavLink to="/productos" className={linkCls}>Productos</NavLink>
          <NavLink to="/mis-ordenes" className={linkCls}>Mis órdenes</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {/* Soporte Discord — visible siempre */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex gap-2 border-[#5865F2]/40 text-[#7B86FF] hover:bg-[#5865F2]/10 hover:text-white"
          >
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" aria-label="Soporte por Discord">
              <DiscordIcon className="h-4 w-4" />
              <span className="hidden lg:inline">Soporte</span>
            </a>
          </Button>

          {user && (
            <button
              onClick={() => navigate("/recargar")}
              title="Mi saldo · recargar"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{format(balance)}</span>
            </button>
          )}

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => navigate("/admin")}
              className="gap-2 bg-gradient-to-r from-accent to-primary text-primary-foreground hover:opacity-90 shadow-glow"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Panel Admin</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/checkout")}
            className="relative"
            aria-label="Carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Button>

          {user ? (
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="gap-2">
              <LogIn className="h-4 w-4" /> Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.372.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

import { Zap, Shield, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandText } from "@/components/BrandText";
import { DISCORD_INVITE } from "@/config/site";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 bg-card/30">
      <div className="container-app py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src={logo} alt="Easy Cheats" className="h-8 w-8 rounded-md object-cover" />
            <BrandText className="text-lg" />
          </div>
          <p className="text-sm text-muted-foreground">
            Cheats premium, indetectables y con entrega instantánea para tus juegos favoritos.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider mb-3">Tienda</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/productos" className="hover:text-primary">Catálogo</Link></li>
            <li><Link to="/checkout" className="hover:text-primary">Carrito</Link></li>
            <li><Link to="/mis-ordenes" className="hover:text-primary">Mis órdenes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider mb-3">Garantía</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Pago 100% seguro con Bold</li>
            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Entrega instantánea</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> Soporte 24/7</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider mb-3">Soporte</h4>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-bold text-white hover:bg-[#4752c4] transition-colors"
          >
            Únete a nuestro Discord
          </a>
          <p className="mt-3 text-xs text-muted-foreground">Atención inmediata en nuestro servidor.</p>
        </div>
      </div>
      <div className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Easy Cheats. Todos los derechos reservados.
      </div>
    </footer>
  );
}


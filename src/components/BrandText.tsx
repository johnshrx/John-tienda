/**
 * Texto de marca "Easy Cheats" con fuente llamativa y textura de lava azul animada.
 * Usar en cualquier lugar donde aparezca el nombre de la tienda.
 */
import { cn } from "@/lib/utils";

interface BrandTextProps {
  className?: string;
  /** "split" muestra Easy en color base + Cheats con lava; "full" toda la palabra con lava */
  variant?: "split" | "full";
}

export function BrandText({ className, variant = "split" }: BrandTextProps) {
  return (
    <span className={cn("brand-text inline-flex items-baseline", className)}>
      {variant === "split" ? (
        <>
          <span className="brand-text-plain">EASY</span>
          <span className="brand-lava">CHEATS</span>
        </>
      ) : (
        <span className="brand-lava">EASYCHEATS</span>
      )}
    </span>
  );
}

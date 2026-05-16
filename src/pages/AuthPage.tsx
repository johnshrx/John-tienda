import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BrandText } from "@/components/BrandText";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Correo inválido").max(255);
const passSchema = z.string().min(6, "Mínimo 6 caracteres").max(72);

export default function AuthPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const redirectTo = search.get("redirect") ?? "/";
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(data.get("email"));
    const pass = passSchema.safeParse(data.get("password"));
    if (!email.success || !pass.success) {
      return toast.error("Datos inválidos", { description: email.error?.issues[0]?.message ?? pass.error?.issues[0]?.message });
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: pass.data });
    setLoading(false);
    if (error) return toast.error("No se pudo iniciar sesión", { description: error.message });
    toast.success("Bienvenido de vuelta");
    navigate(redirectTo);
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(data.get("email"));
    const pass = passSchema.safeParse(data.get("password"));
    const name = z.string().trim().min(1).max(80).safeParse(data.get("name"));
    if (!email.success || !pass.success || !name.success) {
      return toast.error("Datos inválidos");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: pass.data,
      options: {
        data: { display_name: name.data },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) return toast.error("No se pudo crear la cuenta", { description: error.message });
    toast.success("¡Cuenta creada!", { description: "Revisa tu correo si necesitas verificar." });
    navigate(redirectTo);
  }

  return (
    <div className="container-app py-16 grid place-items-center">
      <div className="w-full max-w-md">
        {/* Sin icono al lado del nombre — solo el texto de marca */}
        <Link to="/" className="flex justify-center mb-8">
          <BrandText className="text-3xl" />
        </Link>

        <div className="rounded-2xl border-gradient bg-gradient-card p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                  {loading ? "Entrando..." : "Iniciar sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required maxLength={80} placeholder="Tu nombre" />
                </div>
                <div>
                  <Label htmlFor="email2">Correo</Label>
                  <Input id="email2" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password2">Contraseña</Label>
                  <Input id="password2" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                  {loading ? "Creando..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

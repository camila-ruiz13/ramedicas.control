import { Mail, Lock, Pill, Fingerprint, Sparkles, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="size-4" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight">
              Ramedicas Control
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-balance">
              Hola,
              <br />
              Bienvenida de nuevo
            </h1>
            <p className="text-muted-foreground">
              Ingresá para gestionar tus funciones laborales.
            </p>
          </div>

          <form action={login} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tucorreo@ramedicas.com"
                  className="h-11 rounded-xl pl-10"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-xl pl-10"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <SubmitButton
              className="h-11 w-fit rounded-xl bg-primary px-8 font-medium hover:bg-primary/90"
              pendingText="Entrando..."
            >
              Entrar
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 lg:block">
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-10 top-24 size-40 rounded-full bg-white/15 blur-xl" />
        <div className="absolute -right-10 bottom-10 size-72 rounded-full bg-black/10 blur-2xl" />
        <div className="absolute bottom-24 left-16 size-24 rounded-full bg-white/10 blur-lg" />

        <div className="relative flex h-full flex-col items-center justify-center gap-10 p-10">
          <div className="relative flex size-56 items-center justify-center rounded-[2.5rem] bg-white/15 shadow-2xl backdrop-blur-sm">
            <Fingerprint className="size-24 text-white" strokeWidth={1.25} />
            <div className="absolute -right-4 -top-4 flex size-12 items-center justify-center rounded-2xl bg-white shadow-lg">
              <ShieldCheck className="size-6 text-violet-600" />
            </div>
            <div className="absolute -bottom-5 -left-5 flex size-12 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Sparkles className="size-6 text-fuchsia-500" />
            </div>
          </div>

          <div className="max-w-xs text-center text-white">
            <p className="font-heading text-2xl font-bold text-balance">
              Todo tu trabajo, en un solo lugar
            </p>
            <p className="mt-2 text-sm text-white/80">
              Acceso seguro por usuario y módulos que crecen con tu equipo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function SidebarNav({ email }: { email: string }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r p-4">
      <div className="flex flex-col gap-4">
        <span className="text-sm font-semibold">Ramedicas Control</span>
        <nav className="flex flex-col gap-1">
          <Link href="/" className="rounded-md px-2 py-1 text-sm hover:bg-accent">
            Inicio
          </Link>
          {MODULES.map((module) => (
            <Link
              key={module.slug}
              href={module.href}
              className="rounded-md px-2 py-1 text-sm hover:bg-accent"
            >
              {module.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <span className="truncate text-xs text-muted-foreground">{email}</span>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}

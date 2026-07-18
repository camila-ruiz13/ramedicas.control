"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Pill } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function SidebarNav({
  email,
  visibleSlugs,
}: {
  email: string;
  visibleSlugs: string[];
}) {
  const pathname = usePathname();
  // MODULES (with its icon components) is imported directly here rather than
  // passed as a prop — React component references from a Server Component
  // can't cross the client-boundary serialization.
  const modules = MODULES.filter((m) => visibleSlugs.includes(m.slug));

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm">
            <Pill className="size-4" />
          </div>
          <span className="font-heading text-sm font-bold tracking-tight">
            Ramedicas Control
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Home className="size-4" />
            Inicio
          </Link>
          {modules.map((moduleDef) => {
            const Icon = moduleDef.icon;
            const active = pathname.startsWith(moduleDef.href);
            return (
              <Link
                key={moduleDef.slug}
                href={moduleDef.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active && MODULE_COLOR_CLASSES[moduleDef.color].icon,
                  )}
                />
                {moduleDef.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(email)}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {email}
          </span>
        </div>
        <form action={logout}>
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="w-full justify-start gap-2"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}

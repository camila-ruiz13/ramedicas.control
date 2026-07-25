"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home, LogOut, Menu, Pill, X } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES, UNITS, type UnitSlug } from "@/lib/modules";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

// A tiny external store instead of useState+useEffect: reading localStorage
// only after mount to dodge a hydration mismatch would mean calling
// setState from inside an effect, which triggers an extra cascading render
// (flagged by the React Compiler lint). useSyncExternalStore reads the
// persisted value directly on the client's first render and renders `false`
// server-side, so there's exactly one render either way.
let collapsedListeners: Array<() => void> = [];

function getCollapsedSnapshot() {
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
}

function getCollapsedServerSnapshot() {
  return false;
}

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.push(listener);
  return () => {
    collapsedListeners = collapsedListeners.filter((l) => l !== listener);
  };
}

function setCollapsedStore(next: boolean) {
  localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
  for (const listener of collapsedListeners) listener();
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
  const unitGroups = UNITS.map((unit) => ({
    unit,
    modules: modules.filter((m) => m.unit === unit.slug),
  })).filter((g) => g.modules.length > 0);

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  function toggle() {
    setCollapsedStore(!collapsed);
  }

  // Solo relevante por debajo de md: en desktop el sidebar siempre está en
  // flujo normal (estático), el toggle de arriba es lo único que lo angosta.
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  // Los módulos de una unidad solo se ven si el usuario clickea esa unidad
  // explícitamente — no se auto-expanden por estar en una de sus páginas.
  const [openUnit, setOpenUnit] = useState<UnitSlug | null>(null);

  return (
    <>
      {/* Barra superior solo-mobile: el sidebar de escritorio no cabe en una
          pantalla de celular, así que ahí vive detrás de este botón. */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent/50"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
          <Pill className="size-3.5" />
        </div>
        <span className="truncate font-heading text-sm font-bold tracking-tight">
          Ramedicas Control
        </span>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col justify-between border-r bg-sidebar p-4 text-sidebar-foreground transition-transform duration-200",
          "md:static md:z-auto md:translate-x-0 md:transition-[width]",
          mobileOpen && "translate-x-0",
          collapsed ? "md:w-[68px]" : "md:w-64",
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggle}
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 hover:bg-sidebar-accent/50",
                collapsed && "md:justify-center md:px-0",
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm">
                <Pill className="size-4" />
              </div>
              <span
                className={cn(
                  "truncate font-heading text-sm font-bold tracking-tight",
                  collapsed && "md:hidden",
                )}
              >
                Ramedicas Control
              </span>
            </button>
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Cerrar menú"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent/50 md:hidden"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              title="Inicio"
              onClick={closeMobile}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "md:justify-center md:px-0",
                pathname === "/"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Home className="size-4 shrink-0" />
              <span className={cn(collapsed && "md:hidden")}>Inicio</span>
            </Link>

            <div className="mt-3 flex flex-col gap-1">
              {unitGroups.map(({ unit, modules: unitModules }) => {
                const UnitIcon = unit.icon;
                const unitColors = MODULE_COLOR_CLASSES[unit.color];
                const open = openUnit === unit.slug;
                return (
                  <div key={unit.slug}>
                    <button
                      type="button"
                      onClick={() => setOpenUnit(open ? null : unit.slug)}
                      title={unit.label}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        collapsed && "md:justify-center md:px-0",
                        open
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <UnitIcon className={cn("size-4 shrink-0", open && unitColors.icon)} />
                      <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "md:hidden")}>
                        {unit.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 shrink-0 transition-transform",
                          open && "rotate-180",
                          collapsed && "md:hidden",
                        )}
                      />
                    </button>
                    {open && (
                      <div className="mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                        {unitModules.map((moduleDef) => {
                          const Icon = moduleDef.icon;
                          const active = pathname.startsWith(moduleDef.href);
                          return (
                            <Link
                              key={moduleDef.slug}
                              href={moduleDef.href}
                              title={moduleDef.subtitle ? `${moduleDef.label} (${moduleDef.subtitle})` : moduleDef.label}
                              onClick={closeMobile}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                collapsed && "md:justify-center md:px-0",
                                active
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "size-4 shrink-0",
                                  active && MODULE_COLOR_CLASSES[moduleDef.color].icon,
                                )}
                              />
                              <span className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
                                <span className="block truncate leading-tight">{moduleDef.label}</span>
                                {moduleDef.subtitle && (
                                  <span className="block truncate text-[11px] leading-tight font-normal opacity-60">
                                    {moduleDef.subtitle}
                                  </span>
                                )}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-card px-3 py-2",
              collapsed && "md:justify-center md:px-0",
            )}
            title={email}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(email)}
            </div>
            <span className={cn("truncate text-xs text-muted-foreground", collapsed && "md:hidden")}>
              {email}
            </span>
          </div>
          <form action={logout}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              title="Cerrar sesión"
              className={cn("w-full gap-2", collapsed ? "justify-start md:justify-center md:px-0" : "justify-start")}
            >
              <LogOut className="size-4 shrink-0" />
              <span className={cn(collapsed && "md:hidden")}>Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

import { Anchor, Castle, Flame, Landmark, Mountain, Snowflake, Users, ShoppingCart, Handshake, Scale, type LucideIcon } from "lucide-react";

export type ModuleColor = "teal" | "amber" | "violet" | "rose" | "sky" | "indigo" | "cyan" | "fuchsia" | "emerald";

export type UnitSlug = "westeros" | "essos";

export type UnitDefinition = {
  slug: UnitSlug;
  label: string;
  description: string;
  icon: LucideIcon;
  color: ModuleColor;
};

// Las "unidades" son puramente una agrupación visual/de navegación (portada
// de Inicio + secciones del sidebar) — los permisos siguen siendo por
// módulo (permissions.ts), una unidad no tiene su propio permiso.
export const UNITS: UnitDefinition[] = [
  {
    slug: "westeros",
    label: "Westeros",
    description: "Tareas y autorizaciones",
    icon: Castle,
    color: "indigo",
  },
  {
    slug: "essos",
    label: "Essos",
    description: "Proveedores, precios y compras",
    icon: Flame,
    color: "amber",
  },
];

export type ModuleDefinition = {
  slug: string;
  // Nombre "temático" (Juego de Tronos) que se muestra grande en el sidebar
  // y en la tarjeta de la unidad.
  label: string;
  // Nombre funcional original — se muestra chico debajo de `label` para que
  // se siga entendiendo qué hace el módulo aunque tenga nombre de casa/ciudad.
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  color: ModuleColor;
  unit: UnitSlug;
  // Gated purely by Profile.isAdmin instead of the Role/RoleModulePermission
  // system — every other module's visibility comes from permissions.ts.
  adminOnly?: boolean;
};

export const MODULE_COLOR_CLASSES: Record<
  ModuleColor,
  { badge: string; icon: string }
> = {
  teal: { badge: "bg-teal-500/15", icon: "text-teal-600 dark:text-teal-400" },
  amber: {
    badge: "bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
  },
  violet: {
    badge: "bg-violet-500/15",
    icon: "text-violet-600 dark:text-violet-400",
  },
  rose: { badge: "bg-rose-500/15", icon: "text-rose-600 dark:text-rose-400" },
  sky: { badge: "bg-sky-500/15", icon: "text-sky-600 dark:text-sky-400" },
  indigo: { badge: "bg-indigo-500/15", icon: "text-indigo-600 dark:text-indigo-400" },
  cyan: { badge: "bg-cyan-500/15", icon: "text-cyan-600 dark:text-cyan-400" },
  fuchsia: { badge: "bg-fuchsia-500/15", icon: "text-fuchsia-600 dark:text-fuchsia-400" },
  emerald: { badge: "bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400" },
};

// Add one entry here per new module folder under src/app/(modules).
// `adminOnly` modules are only ever shown/reachable for Profile.isAdmin users;
// every other module's visibility is decided by the signed-in user's Role
// permissions (see src/lib/permissions.ts), not by anything in this file.
export const MODULES: ModuleDefinition[] = [
  {
    slug: "tareas",
    label: "Casterly Rock",
    subtitle: "Tareas",
    href: "/tareas",
    icon: Mountain,
    color: "rose",
    unit: "westeros",
  },
  {
    slug: "proveedores",
    label: "Braavos",
    subtitle: "Convocatoria Proveedores",
    href: "/proveedores",
    icon: Landmark,
    color: "amber",
    unit: "essos",
  },
  {
    slug: "autorizacion-compras",
    label: "Dragonstone",
    subtitle: "Autorización Compras",
    href: "/autorizacion-compras",
    icon: Flame,
    color: "violet",
    unit: "westeros",
  },
  {
    slug: "cambios-precios",
    label: "Winterfell",
    subtitle: "Cambios de Precios",
    href: "/cambios-precios",
    icon: Snowflake,
    color: "teal",
    unit: "westeros",
  },
  {
    slug: "compras-predevoluciones",
    label: "Pentos",
    subtitle: "Compras y Predevoluciones",
    href: "/compras-predevoluciones",
    icon: ShoppingCart,
    color: "cyan",
    unit: "essos",
  },
  {
    slug: "descuentos-proveedores",
    label: "Volantis",
    subtitle: "Descuentos y Rebates",
    href: "/descuentos-proveedores",
    icon: Anchor,
    color: "indigo",
    unit: "essos",
  },
  {
    slug: "prorroga-proveedores",
    label: "Qarth",
    subtitle: "Prórroga Proveedores",
    href: "/prorroga-proveedores",
    icon: Handshake,
    color: "fuchsia",
    unit: "essos",
  },
  {
    slug: "precios-regulados",
    label: "Astapor",
    subtitle: "Precios Regulados",
    href: "/precios-regulados",
    icon: Scale,
    color: "emerald",
    unit: "essos",
  },
  {
    slug: "usuarios",
    label: "Myr",
    subtitle: "Usuarios",
    href: "/usuarios",
    icon: Users,
    color: "sky",
    unit: "essos",
    adminOnly: true,
  },
];

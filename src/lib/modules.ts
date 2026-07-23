import { ListTodo, Users, Truck, ShieldCheck, TrendingUp, Percent, ShoppingCart, Handshake, type LucideIcon } from "lucide-react";

export type ModuleColor = "teal" | "amber" | "violet" | "rose" | "sky" | "indigo" | "cyan" | "fuchsia";

export type ModuleDefinition = {
  slug: string;
  label: string;
  href: string;
  icon: LucideIcon;
  color: ModuleColor;
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
};

// Add one entry here per new module folder under src/app/(modules).
// `adminOnly` modules are only ever shown/reachable for Profile.isAdmin users;
// every other module's visibility is decided by the signed-in user's Role
// permissions (see src/lib/permissions.ts), not by anything in this file.
export const MODULES: ModuleDefinition[] = [
  {
    slug: "tareas",
    label: "Tareas",
    href: "/tareas",
    icon: ListTodo,
    color: "rose",
  },
  {
    slug: "proveedores",
    label: "Proveedores",
    href: "/proveedores",
    icon: Truck,
    color: "amber",
  },
  {
    slug: "autorizacion-compras",
    label: "Autorización Compras",
    href: "/autorizacion-compras",
    icon: ShieldCheck,
    color: "violet",
  },
  {
    slug: "cambios-precios",
    label: "Cambios de Precios",
    href: "/cambios-precios",
    icon: TrendingUp,
    color: "teal",
  },
  {
    slug: "compras-predevoluciones",
    label: "Compras y Predevoluciones",
    href: "/compras-predevoluciones",
    icon: ShoppingCart,
    color: "cyan",
  },
  {
    slug: "descuentos-proveedores",
    label: "Descuentos y Rebates",
    href: "/descuentos-proveedores",
    icon: Percent,
    color: "indigo",
  },
  {
    slug: "prorroga-proveedores",
    label: "Prórroga Proveedores",
    href: "/prorroga-proveedores",
    icon: Handshake,
    color: "fuchsia",
  },
  {
    slug: "usuarios",
    label: "Usuarios",
    href: "/usuarios",
    icon: Users,
    color: "sky",
    adminOnly: true,
  },
];

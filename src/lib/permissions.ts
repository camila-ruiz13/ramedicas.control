import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VERIFIED_USER_ID_HEADER } from "@/lib/supabase/middleware";
import { MODULES, UNITS, type ModuleDefinition, type UnitSlug } from "@/lib/modules";

// The proxy (src/lib/supabase/middleware.ts) already ran supabase.auth.getUser()
// for this request and stamped the verified id in VERIFIED_USER_ID_HEADER — reading
// it here instead of calling getUser() again saves a second ~150-800ms round trip
// to Supabase Auth on every single navigation/action. Wrapped in React's cache() so
// the profile query itself only happens ONCE per request no matter how many times
// this is called (shared (modules)/layout.tsx + each page's own requireModuleView()).
export const getCurrentProfile = cache(async () => {
  const headerList = await headers();
  const userId = headerList.get(VERIFIED_USER_ID_HEADER);
  if (!userId) return null;

  return prisma.profile.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } },
  });
});

export type CurrentProfile = NonNullable<
  Awaited<ReturnType<typeof getCurrentProfile>>
>;

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (!profile.isAdmin) redirect("/");
  return profile;
}

function permissionFor(profile: CurrentProfile, moduleSlug: string) {
  return profile.role?.permissions.find((p) => p.moduleSlug === moduleSlug);
}

export function canView(profile: CurrentProfile, moduleSlug: string) {
  if (profile.isAdmin) return true;
  return permissionFor(profile, moduleSlug)?.canView ?? false;
}

export function canInteract(profile: CurrentProfile, moduleSlug: string) {
  if (profile.isAdmin) return true;
  return permissionFor(profile, moduleSlug)?.canInteract ?? false;
}

export function getVisibleModules(profile: CurrentProfile): ModuleDefinition[] {
  return MODULES.filter((moduleDef) =>
    moduleDef.adminOnly ? profile.isAdmin : canView(profile, moduleDef.slug),
  );
}

// Unidades con al menos un módulo visible para este usuario — una unidad
// sin módulos visibles no tiene sentido mostrarla ni en Inicio ni en el sidebar.
export function getVisibleUnits(profile: CurrentProfile) {
  const visible = getVisibleModules(profile);
  return UNITS.filter((unit) => visible.some((m) => m.unit === unit.slug));
}

export function getVisibleModulesForUnit(profile: CurrentProfile, unitSlug: UnitSlug): ModuleDefinition[] {
  return getVisibleModules(profile).filter((m) => m.unit === unitSlug);
}

// Call at the top of a module's page.tsx/layout.tsx to enforce access
// server-side — the sidebar hiding the link is not enough on its own since
// a user could still navigate to the URL directly.
export async function requireModuleView(moduleSlug: string) {
  const profile = await requireProfile();
  const moduleDef = MODULES.find((m) => m.slug === moduleSlug);
  const allowed = moduleDef?.adminOnly
    ? profile.isAdmin
    : canView(profile, moduleSlug);
  if (!allowed) redirect("/");
  return profile;
}

// Call at the top of a mutating server action (upload, create, delete, ...)
// gated by the "interactuar" permission. Throws instead of redirecting since
// actions run as a form submission, not a page render.
export async function requireModuleInteract(moduleSlug: string) {
  const profile = await requireProfile();
  const moduleDef = MODULES.find((m) => m.slug === moduleSlug);
  const allowed = moduleDef?.adminOnly
    ? profile.isAdmin
    : canInteract(profile, moduleSlug);
  if (!allowed) throw new Error("No tenés permiso para esta acción");
  return profile;
}

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MODULES, type ModuleDefinition } from "@/lib/modules";

// Wrapped in React's cache() so the auth round trip + profile query only
// happen ONCE per request no matter how many times this is called — both
// the shared (modules)/layout.tsx (for the sidebar) and each page's own
// requireModuleView() call this, and without cache() each call redid a full
// ~1s getUser() + ~1s Prisma query from scratch.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.profile.findUnique({
    where: { id: user.id },
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

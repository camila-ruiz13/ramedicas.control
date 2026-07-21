import { requireProfile, getVisibleModules } from "@/lib/permissions";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login if unauthenticated. Middleware already covers this
  // too — this is a defense-in-depth check for direct server-side renders.
  const profile = await requireProfile();
  const visibleSlugs = getVisibleModules(profile).map((m) => m.slug);

  return (
    <div className="flex min-h-screen bg-muted/40">
      <SidebarNav email={profile.email} visibleSlugs={visibleSlugs} />
      {/* min-w-0: without it, flex-1 refuses to shrink main below the
          intrinsic width of its widest descendant (e.g. a wide table),
          bulging the whole page instead of letting that descendant scroll
          internally. */}
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}

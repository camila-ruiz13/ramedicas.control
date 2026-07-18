import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireProfile, getVisibleModules } from "@/lib/permissions";

export default async function HomePage() {
  const profile = await requireProfile();
  const modules = getVisibleModules(profile);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutGrid className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Inicio</h1>
          <p className="text-muted-foreground">
            Resumen de tus módulos de gestión.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((moduleDef) => {
          const Icon = moduleDef.icon;
          const colors = MODULE_COLOR_CLASSES[moduleDef.color];
          return (
            <Link key={moduleDef.slug} href={moduleDef.href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg ${colors.badge}`}
                    >
                      <Icon className={`size-5 ${colors.icon}`} />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                  <CardTitle className="pt-2">{moduleDef.label}</CardTitle>
                  <CardDescription>Módulo activo</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

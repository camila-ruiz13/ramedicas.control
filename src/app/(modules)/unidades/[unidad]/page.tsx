import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODULE_COLOR_CLASSES, UNITS, type UnitSlug } from "@/lib/modules";
import { requireProfile, getVisibleModulesForUnit } from "@/lib/permissions";

function isUnitSlug(value: string): value is UnitSlug {
  return UNITS.some((u) => u.slug === value);
}

export default async function UnidadPage({
  params,
}: {
  params: Promise<{ unidad: string }>;
}) {
  const { unidad } = await params;
  if (!isUnitSlug(unidad)) notFound();

  const profile = await requireProfile();
  const unit = UNITS.find((u) => u.slug === unidad)!;
  const modules = getVisibleModulesForUnit(profile, unidad);
  const colors = MODULE_COLOR_CLASSES[unit.color];
  const Icon = unit.icon;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Inicio
        </Link>
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">{unit.label}</h1>
            <p className="text-muted-foreground">{unit.description}</p>
          </div>
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenés módulos disponibles en esta unidad.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((moduleDef) => {
            const ModuleIcon = moduleDef.icon;
            const moduleColors = MODULE_COLOR_CLASSES[moduleDef.color];
            return (
              <Link key={moduleDef.slug} href={moduleDef.href} className="group">
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${moduleColors.badge}`}>
                        <ModuleIcon className={`size-5 ${moduleColors.icon}`} />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                    <CardTitle className="pt-2">{moduleDef.label}</CardTitle>
                    <CardDescription>{moduleDef.subtitle ?? "Módulo activo"}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
